'use server';

import { randomUUID } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export type NotificationPayload = {
  type: string;
  title: string;
  description: string;
  href?: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
  eventKey?: string;
  referenceId?: string | null;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
  notifyAt?: Date | string | null;
};

/**
 * Stores a notification entry while swallowing DB errors so the primary action
 * that triggered the notification does not fail.
 */
export async function recordNotification({
  type,
  title,
  description,
  href = '/',
  tone = 'info',
  eventKey,
  referenceId,
  metadata,
  notifyAt,
}: NotificationPayload) {
  const generatedKey =
    eventKey ??
    `db-event:${type}:${referenceId ?? randomUUID()}:${Date.now()}:0`;

  let notifyAtValue: Date | undefined;
  if (notifyAt) {
    const candidate =
      typeof notifyAt === 'string' ? new Date(notifyAt) : notifyAt;
    if (!Number.isNaN(candidate.getTime())) {
      notifyAtValue = candidate;
    }
  }

  try {
    await prisma.notification.create({
      data: {
        eventKey: generatedKey,
        type,
        title,
        description,
        href,
        tone,
        metadata: metadata ?? undefined,
        notifyAt: notifyAtValue,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to store notification', error);
  }
}
