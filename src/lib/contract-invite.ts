import { createHash } from 'node:crypto';

export const hashContractInviteToken = (token: string) =>
  createHash('sha256').update(token.trim()).digest('hex');

export const isContractInviteExpired = (
  expiresAt?: Date | null,
  completedAt?: Date | null
) => Boolean(expiresAt && !completedAt && expiresAt.getTime() < Date.now());
