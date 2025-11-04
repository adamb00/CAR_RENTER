import nodemailer, { type Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';

type RequiredMailEnv = 'MAIL_HOST' | 'MAIL_PORT' | 'MAIL_USER' | 'MAIL_PASS';

const REQUIRED_ENV_VARS: RequiredMailEnv[] = [
  'MAIL_HOST',
  'MAIL_PORT',
  'MAIL_USER',
  'MAIL_PASS',
];

type SendMailParams = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: Mail.Attachment[];
};

let cachedTransporter: Transporter | null = null;

const hasWindow = typeof window !== 'undefined';

if (hasWindow) {
  throw new Error(
    'The mailer utility can only be imported in a server environment.'
  );
}

function ensureEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing mail configuration environment variables: ${missing.join(', ')}`
    );
  }
}

function resolveTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  ensureEnvVars();

  const port = Number(process.env.MAIL_PORT);
  const useSecureConnection = port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: useSecureConnection,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: useSecureConnection
      ? undefined
      : {
          rejectUnauthorized:
            process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
        },
  });

  return cachedTransporter;
}

export function isMailConfigured(): boolean {
  return REQUIRED_ENV_VARS.every((key) => Boolean(process.env[key]));
}

export async function sendMail({
  to,
  subject,
  text,
  html,
  from,
  replyTo,
  headers,
  attachments,
}: SendMailParams) {
  if (!text && !html) {
    throw new Error(
      'Either "text" or "html" content must be provided to sendMail.'
    );
  }

  const transporter = resolveTransporter();

  const fromName =
    process.env.MAIL_FROM_NAME && process.env.MAIL_FROM_NAME.trim().length > 0
      ? process.env.MAIL_FROM_NAME.trim()
      : 'Zodiacs Rent a Car';

  const defaultFrom =
    process.env.MAIL_FROM ||
    (process.env.MAIL_USER
      ? `"${fromName}" <${process.env.MAIL_USER}>`
      : undefined);

  if (!from && !defaultFrom) {
    throw new Error(
      'Missing "from" address. Provide a "from" parameter or set MAIL_FROM/MAIL_USER.'
    );
  }

  return transporter.sendMail({
    to,
    subject,
    text,
    html,
    from: from ?? defaultFrom,
    replyTo,
    headers,
    attachments,
  });
}
