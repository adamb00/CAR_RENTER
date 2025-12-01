export const STATUS_NEW = 'new' as const;
export const STATUS_DONE = 'closed' as const;

export type RequestStatus = 'new' | 'in_progress' | 'answered' | 'closed';
