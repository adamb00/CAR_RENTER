import Link from 'next/link';
import type { useTranslations } from 'next-intl';
import type { FieldValues, Path } from 'react-hook-form';

import type { LegalConsentItem } from '@/components/rent/LegalConsents';

import type { RentFormValues } from './rent.types';

type RentFormTranslator = ReturnType<typeof useTranslations>;

type BuildConsentItemsParams<TFormValues extends FieldValues> = {
  locale: string;
  t: RentFormTranslator;
  privacyTranslationKey?: string;
  termsTranslationKey?: string;
};

const DEFAULT_PRIVACY_KEY = 'sections.consents.privacyLabel';
const DEFAULT_TERMS_KEY = 'sections.consents.termsLabel';

export function buildConsentItems<
  TFormValues extends FieldValues = RentFormValues
>({
  locale,
  t,
  privacyTranslationKey = DEFAULT_PRIVACY_KEY,
  termsTranslationKey = DEFAULT_TERMS_KEY,
}: BuildConsentItemsParams<TFormValues>): LegalConsentItem<TFormValues>[] {
  return [
    {
      name: 'consents.privacy' as Path<TFormValues>,
      label: t.rich(privacyTranslationKey, {
        link: (chunks) => (
          <Link
            href={`/${locale}/gdpr`}
            target='_blank'
            rel='noreferrer'
            className='underline underline-offset-2'
          >
            {chunks}
          </Link>
        ),
      }),
    },
    {
      name: 'consents.terms' as Path<TFormValues>,
      label: t.rich(termsTranslationKey, {
        link: (chunks) => (
          <Link
            href={`/${locale}/gtc`}
            target='_blank'
            rel='noreferrer'
            className='underline underline-offset-2'
          >
            {chunks}
          </Link>
        ),
      }),
    },
  ];
}
