import { getSupabaseServerClient } from '@/lib/supabase/server';

export type ContactQuoteRecord = {
  id: string;
  locale: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: 'email' | 'phone' | 'whatsapp' | 'viber';
  rentalStart?: string | null;
  rentalEnd?: string | null;
  arrivalFlight?: string | null;
  departureFlight?: string | null;
  partySize?: string | null;
  children?: string | null;
  carId?: string | null;
};

export async function getContactQuoteById(
  quoteId: string
): Promise<ContactQuoteRecord | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('ContactQuotes')
    .select(
      `
        id,
        locale,
        name,
        email,
        phone,
        preferredchannel,
        rentalstart,
        rentalend,
        arrivalflight,
        departureflight,
        partysize,
        children,
        carid
      `
    )
    .eq('id', quoteId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch contact quote', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id as string,
    locale: data.locale as string,
    name: data.name as string,
    email: data.email as string,
    phone: data.phone as string,
    preferredChannel: (data.preferredchannel ??
      'email') as ContactQuoteRecord['preferredChannel'],
    rentalStart: data.rentalstart ?? null,
    rentalEnd: data.rentalend ?? null,
    arrivalFlight: data.arrivalflight ?? null,
    departureFlight: data.departureflight ?? null,
    partySize: data.partysize ?? null,
    children: data.children ?? null,
    carId: data.carid ?? null,
  };
}
