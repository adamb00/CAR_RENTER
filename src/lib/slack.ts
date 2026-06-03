import { createHmac, timingSafeEqual } from 'node:crypto';

type SlackChatPostMessageResponse = {
  ok: boolean;
  error?: string;
  response_metadata?: {
    messages?: string[];
  };
};

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_CHAT_POST_MESSAGE_URL = 'https://slack.com/api/chat.postMessage';
const SLACK_ACTION_VALUE_PREFIX = 'task_status:';
const QUOTE_SEND_EMAIL_PREFIX = 'quote_send_email:';
const DEFAULT_DEV_ADMIN_SLACK_INTERACTIONS_URL =
  'http://localhost:3000/api/slack/interactions';
const ADMIN_SLACK_INTERACTIONS_URL =
  process.env.CAR_RENTER_ADMIN_SLACK_INTERACTIONS_URL ??
  (process.env.NODE_ENV !== 'production'
    ? DEFAULT_DEV_ADMIN_SLACK_INTERACTIONS_URL
    : process.env.CAR_RENTER_ADMIN_URL
      ? `${process.env.CAR_RENTER_ADMIN_URL.replace(/\/$/, '')}/api/slack/interactions`
      : undefined);

export const hasSlackConfig = () => Boolean(SLACK_BOT_TOKEN?.trim());
export const hasSlackSigningSecret = () =>
  Boolean(SLACK_SIGNING_SECRET?.trim());

export type SlackTaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

type SlackMessageBlock = Record<string, unknown>;

export const buildTaskStatusActionValue = ({
  taskId,
  status,
}: {
  taskId: string;
  status: SlackTaskStatus;
}) => `${SLACK_ACTION_VALUE_PREFIX}${taskId}:${status}`;

export const parseTaskStatusActionValue = (value?: string | null) => {
  if (!value || !value.startsWith(SLACK_ACTION_VALUE_PREFIX)) return null;
  const [, payload] = value.split(SLACK_ACTION_VALUE_PREFIX);
  const [taskId, status] = payload.split(':');

  if (!taskId || !status) return null;
  if (
    status !== 'PENDING' &&
    status !== 'IN_PROGRESS' &&
    status !== 'COMPLETED' &&
    status !== 'CANCELLED'
  ) {
    return null;
  }

  return {
    taskId,
    status: status as SlackTaskStatus,
  };
};

export const verifySlackRequestSignature = ({
  rawBody,
  timestamp,
  signature,
}: {
  rawBody: string;
  timestamp?: string | null;
  signature?: string | null;
}) => {
  const signingSecret = SLACK_SIGNING_SECRET?.trim();
  if (!signingSecret || !timestamp || !signature) return false;

  const requestAge = Math.abs(
    Math.floor(Date.now() / 1000) - Number(timestamp),
  );
  if (!Number.isFinite(requestAge) || requestAge > 60 * 5) return false;

  const baseString = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex')}`;

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signature, 'utf8');
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const verifySlackRequestSignatureDetailed = ({
  rawBody,
  timestamp,
  signature,
}: {
  rawBody: string;
  timestamp?: string | null;
  signature?: string | null;
}) => {
  const signingSecret = SLACK_SIGNING_SECRET?.trim();
  if (!signingSecret) return { ok: false as const, reason: 'missing_secret' };
  if (!timestamp) return { ok: false as const, reason: 'missing_timestamp' };
  if (!signature) return { ok: false as const, reason: 'missing_signature' };

  const parsedTimestamp = Number(timestamp);
  if (!Number.isFinite(parsedTimestamp)) {
    return { ok: false as const, reason: 'invalid_timestamp' };
  }

  const requestAge = Math.abs(Math.floor(Date.now() / 1000) - parsedTimestamp);
  if (requestAge > 60 * 5) {
    return { ok: false as const, reason: 'timestamp_out_of_range' };
  }

  const baseString = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex')}`;

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return { ok: false as const, reason: 'signature_length_mismatch' };
  }

  const ok = timingSafeEqual(expectedBuffer, receivedBuffer);
  return ok
    ? { ok: true as const, reason: 'ok' }
    : { ok: false as const, reason: 'signature_mismatch' };
};

export const sendSlackDirectMessage = async ({
  slackUserId,
  text,
  blocks,
}: {
  slackUserId: string;
  text: string;
  blocks?: SlackMessageBlock[];
}) => {
  if (!hasSlackConfig()) {
    throw new Error('Missing Slack configuration');
  }

  const response = await fetch(SLACK_CHAT_POST_MESSAGE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel: slackUserId,
      text,
      ...(blocks?.length ? { blocks } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack HTTP error: ${response.status}`);
  }

  const data = (await response.json()) as SlackChatPostMessageResponse;

  if (!data.ok && data.error === 'invalid_blocks' && blocks?.length) {
    const fallbackResponse = await fetch(SLACK_CHAT_POST_MESSAGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: slackUserId,
        text,
      }),
    });

    if (!fallbackResponse.ok) {
      throw new Error(`Slack HTTP error: ${fallbackResponse.status}`);
    }

    const fallbackData =
      (await fallbackResponse.json()) as SlackChatPostMessageResponse;

    if (fallbackData.ok) {
      return;
    }

    throw new Error(
      `Slack API error: ${fallbackData.error ?? 'unknown_error'}`,
    );
  }

  if (!data.ok) {
    const details = data.response_metadata?.messages?.join(' | ');
    throw new Error(
      `Slack API error: ${data.error ?? 'unknown_error'}${
        details ? ` (${details})` : ''
      }`,
    );
  }
};

export const triggerQuoteSendEmailSlackInteraction = async ({
  quoteId,
}: {
  quoteId: string;
}) => {
  const interactionsUrl = ADMIN_SLACK_INTERACTIONS_URL?.trim();
  const signingSecret = SLACK_SIGNING_SECRET?.trim();
  const normalizedQuoteId = quoteId.trim();

  if (!interactionsUrl) {
    throw new Error('Missing admin Slack interactions URL');
  }

  if (!signingSecret) {
    throw new Error('Missing Slack signing secret');
  }

  if (!normalizedQuoteId) {
    throw new Error('Missing quote ID');
  }

  const payload = {
    type: 'block_actions',
    user: {},
    actions: [
      {
        action_id: 'quote_send_email_auto_offer',
        value: `${QUOTE_SEND_EMAIL_PREFIX}${normalizedQuoteId}`,
      },
    ],
  };
  const rawBody = new URLSearchParams({
    payload: JSON.stringify(payload),
  }).toString();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `v0=${createHmac('sha256', signingSecret)
    .update(`v0:${timestamp}:${rawBody}`)
    .digest('hex')}`;

  const response = await fetch(interactionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Slack-Request-Timestamp': timestamp,
      'X-Slack-Signature': signature,
    },
    body: rawBody,
  });

  const text = await response.text();
  let data: { error?: string; text?: string } | null = null;
  try {
    data = text
      ? (JSON.parse(text) as { error?: string; text?: string })
      : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ??
        data?.text ??
        `Admin Slack interactions HTTP error: ${response.status}`,
    );
  }

  const responseText = data?.text?.trim();
  if (
    responseText &&
    !responseText.toLowerCase().includes('sent') &&
    !responseText.toLowerCase().includes('elküldve')
  ) {
    throw new Error(responseText);
  }

  return data;
};
