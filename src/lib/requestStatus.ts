export const CONTACT_STATUS_NEW = 'new' as const;
export const CONTACT_STATUS_QUOTE_SENT = 'quote_sent' as const;
export const CONTACT_STATUS_QUOTE_ACCEPTED = 'quote_accepted' as const;

export type ContactStatus =
  | typeof CONTACT_STATUS_NEW
  | typeof CONTACT_STATUS_QUOTE_SENT
  | typeof CONTACT_STATUS_QUOTE_ACCEPTED;

export const RENT_STATUS_NEW = 'new' as const;
export const RENT_STATUS_FORM_SUBMITTED = 'form_submitted' as const;
export const RENT_STATUS_ACCEPTED = 'accepted' as const;
export const RENT_STATUS_REGISTERED = 'registered' as const;
export const RENT_STATUS_CANCELLED = 'cancelled' as const;

export type RentRequestStatus =
  | typeof RENT_STATUS_NEW
  | typeof RENT_STATUS_FORM_SUBMITTED
  | typeof RENT_STATUS_ACCEPTED
  | typeof RENT_STATUS_REGISTERED
  | typeof RENT_STATUS_CANCELLED;
