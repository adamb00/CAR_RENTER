import { sendMail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { buildContractPdf } from '@/lib/contract-pdf';
import { renderBrandEmail } from '@/lib/emailTemplates';

type LocalizedContractMailCopy = {
  subject: string;
  greetingPrefix: string;
  intro: string;
  attachmentLine: string;
  footerNote: string;
  bookingIdLabel: string;
  signerLabel: string;
  renterFallback: string;
};

const CONTRACT_MAIL_COPY: Record<string, LocalizedContractMailCopy> = {
  en: {
    subject: 'Rental agreement',
    greetingPrefix: 'Dear',
    intro: 'Your rental agreement has been signed.',
    attachmentLine: 'You can find the signed PDF in the attachment.',
    footerNote: 'Thank you for choosing Zodiacs Rent a Car.',
    bookingIdLabel: 'Booking ID',
    signerLabel: 'Signer',
    renterFallback: 'Renter',
  },
  hu: {
    subject: 'Bérleti szerződés',
    greetingPrefix: 'Kedves',
    intro: 'A bérleti szerződésed aláírásra került.',
    attachmentLine: 'A csatolmányban találod az aláírt PDF-et.',
    footerNote: 'Köszönjük, hogy a Zodiacs Rent a Cart választottad.',
    bookingIdLabel: 'Foglalás azonosító',
    signerLabel: 'Aláíró',
    renterFallback: 'Bérlő',
  },
  de: {
    subject: 'Mietvertrag',
    greetingPrefix: 'Guten Tag',
    intro: 'Ihr Mietvertrag wurde unterzeichnet.',
    attachmentLine: 'Das unterschriebene PDF finden Sie im Anhang.',
    footerNote: 'Vielen Dank, dass Sie sich für Zodiacs Rent a Car entschieden haben.',
    bookingIdLabel: 'Buchungsnummer',
    signerLabel: 'Unterzeichner',
    renterFallback: 'Mieter',
  },
  ro: {
    subject: 'Contract de închiriere',
    greetingPrefix: 'Bună',
    intro: 'Contractul tău de închiriere a fost semnat.',
    attachmentLine: 'Găsești PDF-ul semnat în atașament.',
    footerNote: 'Îți mulțumim că ai ales Zodiacs Rent a Car.',
    bookingIdLabel: 'ID rezervare',
    signerLabel: 'Semnatar',
    renterFallback: 'Chiriaș',
  },
  fr: {
    subject: 'Contrat de location',
    greetingPrefix: 'Bonjour',
    intro: 'Votre contrat de location a été signé.',
    attachmentLine: 'Vous trouverez le PDF signé en pièce jointe.',
    footerNote: "Merci d'avoir choisi Zodiacs Rent a Car.",
    bookingIdLabel: 'Numéro de réservation',
    signerLabel: 'Signataire',
    renterFallback: 'Locataire',
  },
  es: {
    subject: 'Contrato de alquiler',
    greetingPrefix: 'Hola',
    intro: 'Tu contrato de alquiler ha sido firmado.',
    attachmentLine: 'Encontrarás el PDF firmado en el archivo adjunto.',
    footerNote: 'Gracias por elegir Zodiacs Rent a Car.',
    bookingIdLabel: 'ID de reserva',
    signerLabel: 'Firmante',
    renterFallback: 'Arrendatario',
  },
  it: {
    subject: 'Contratto di noleggio',
    greetingPrefix: 'Buongiorno',
    intro: 'Il tuo contratto di noleggio è stato firmato.',
    attachmentLine: 'Trovi il PDF firmato in allegato.',
    footerNote: 'Grazie per aver scelto Zodiacs Rent a Car.',
    bookingIdLabel: 'ID prenotazione',
    signerLabel: 'Firmatario',
    renterFallback: 'Cliente',
  },
  sk: {
    subject: 'Nájomná zmluva',
    greetingPrefix: 'Dobrý deň',
    intro: 'Vaša nájomná zmluva bola podpísaná.',
    attachmentLine: 'Podpísané PDF nájdete v prílohe.',
    footerNote: 'Ďakujeme, že ste si vybrali Zodiacs Rent a Car.',
    bookingIdLabel: 'ID rezervácie',
    signerLabel: 'Podpisujúci',
    renterFallback: 'Nájomca',
  },
  cz: {
    subject: 'Nájemní smlouva',
    greetingPrefix: 'Dobrý den',
    intro: 'Vaše nájemní smlouva byla podepsána.',
    attachmentLine: 'Podepsané PDF najdete v příloze.',
    footerNote: 'Děkujeme, že jste si vybrali Zodiacs Rent a Car.',
    bookingIdLabel: 'ID rezervace',
    signerLabel: 'Podepisující',
    renterFallback: 'Nájemce',
  },
  se: {
    subject: 'Hyresavtal',
    greetingPrefix: 'Hej',
    intro: 'Ditt hyresavtal har signerats.',
    attachmentLine: 'Du hittar den signerade PDF-filen i bilagan.',
    footerNote: 'Tack för att du valde Zodiacs Rent a Car.',
    bookingIdLabel: 'Boknings-ID',
    signerLabel: 'Undertecknare',
    renterFallback: 'Hyresgäst',
  },
  no: {
    subject: 'Leieavtale',
    greetingPrefix: 'Hei',
    intro: 'Leieavtalen din er signert.',
    attachmentLine: 'Du finner den signerte PDF-filen i vedlegget.',
    footerNote: 'Takk for at du valgte Zodiacs Rent a Car.',
    bookingIdLabel: 'Bestillings-ID',
    signerLabel: 'Signatar',
    renterFallback: 'Leietaker',
  },
  dk: {
    subject: 'Lejeaftale',
    greetingPrefix: 'Hej',
    intro: 'Din lejeaftale er underskrevet.',
    attachmentLine: 'Du finder den underskrevne PDF-fil i vedhæftningen.',
    footerNote: 'Tak fordi du valgte Zodiacs Rent a Car.',
    bookingIdLabel: 'Booking-ID',
    signerLabel: 'Underskriver',
    renterFallback: 'Lejer',
  },
  pl: {
    subject: 'Umowa najmu',
    greetingPrefix: 'Cześć',
    intro: 'Twoja umowa najmu została podpisana.',
    attachmentLine: 'Podpisany plik PDF znajdziesz w załączniku.',
    footerNote: 'Dziękujemy za wybranie Zodiacs Rent a Car.',
    bookingIdLabel: 'ID rezerwacji',
    signerLabel: 'Podpisujący',
    renterFallback: 'Najemca',
  },
};

type FinalizeContractInviteInput = {
  bookingId: string;
  recipientEmail: string;
  contractText: string;
  signerName: string;
  renterSignatureData: string;
  lessorSignatureData?: string | null;
};

type FinalizeContractInviteResult = {
  success?: 'returned';
  error?:
    | 'signer_name_required'
    | 'invalid_signature_format'
    | 'already_signed'
    | 'booking_not_found'
    | 'finalize_failed';
};

const BOOKING_FROM_ADDRESS =
  process.env.BOOKING_EMAIL_FROM ??
  process.env.EMAIL_FROM ??
  process.env.MAIL_FROM ??
  process.env.MAIL_USER;

export async function finalizeBookingContractInvite({
  bookingId,
  recipientEmail,
  contractText,
  signerName,
  renterSignatureData,
  lessorSignatureData,
}: FinalizeContractInviteInput): Promise<FinalizeContractInviteResult> {
  const trimmedSignerName = signerName.trim();
  if (!trimmedSignerName) {
    return { error: 'signer_name_required' };
  }

  if (!renterSignatureData.startsWith('data:image/')) {
    return { error: 'invalid_signature_format' };
  }

  const existing = await prisma.bookingContracts.findUnique({
    where: { bookingId },
    select: { id: true },
  });
  if (existing) {
    return { error: 'already_signed' };
  }

  const booking = await prisma.rentRequest.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      humanId: true,
      contactName: true,
      locale: true,
    },
  });
  if (!booking) {
    return { error: 'booking_not_found' };
  }

  const signedAt = new Date();
  const updatedAt = new Date();
  const locale = booking.locale?.trim() || 'en';
  const copy = CONTRACT_MAIL_COPY[locale] ?? CONTRACT_MAIL_COPY.en;
  let contractId: string | null = null;
  try {
    const created = await prisma.bookingContracts.create({
      data: {
        bookingId,
        signerName: trimmedSignerName,
        signerEmail: recipientEmail,
        contractVersion: 'v1',
        contractText,
        signatureData: renterSignatureData,
        lessorSignatureData: lessorSignatureData ?? null,
        signedAt,
        updatedAt,
      },
      select: { id: true },
    });
    contractId = created.id;

    const pdf = await buildContractPdf({
      contractText,
      signerName: trimmedSignerName,
      signedAt,
      renterSignatureDataUrl: renterSignatureData,
      lessorSignatureDataUrl: lessorSignatureData ?? null,
    });

    await sendMail({
      to: recipientEmail,
      from: BOOKING_FROM_ADDRESS,
      replyTo: process.env.MAIL_USER,
      subject: `${copy.subject} (${booking.humanId ?? booking.id})`,
      text: [
        `${copy.greetingPrefix} ${
          trimmedSignerName || booking.contactName || copy.renterFallback
        },`,
        '',
        copy.intro,
        copy.attachmentLine,
        '',
        copy.footerNote,
      ].join('\n'),
      html: renderBrandEmail({
        title: `${copy.subject} (${booking.humanId ?? booking.id})`,
        intro: copy.intro,
        rows: [
          {
            label: copy.bookingIdLabel,
            value: booking.humanId ?? booking.id,
          },
          {
            label: copy.signerLabel,
            value:
              trimmedSignerName || booking.contactName || copy.renterFallback,
          },
        ],
        footerNote: copy.attachmentLine,
        securityNote: copy.footerNote,
      }),
      attachments: [
        {
          filename: `rental-agreement-${booking.humanId ?? booking.id}.pdf`,
          content: pdf,
        },
      ],
    });

    await prisma.bookingContracts.update({
      where: { id: created.id },
      data: {
        pdfSentAt: new Date(),
      },
    });

    await prisma.rentRequest.update({
      where: { id: bookingId },
      data: {
        signerName: trimmedSignerName,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('finalizeBookingContractInvite', error);
    if (contractId) {
      try {
        await prisma.bookingContracts.delete({ where: { id: contractId } });
      } catch (cleanupError) {
        console.error('finalizeBookingContractInvite cleanup', cleanupError);
      }
    }
    return { error: 'finalize_failed' };
  }

  return { success: 'returned' };
}
