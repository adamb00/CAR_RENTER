'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { completeContractInviteAction } from '@/actions/CompleteContractInviteAction';
import SignatureCanvas, {
  type SignatureCanvasHandle,
} from '@/components/rent/contract/SignatureCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ContractPublicFormProps = {
  token: string;
  locale: string;
  signerName?: string | null;
  renterEmail?: string | null;
  contractText: string;
  pdfHref: string;
  isCompleted: boolean;
  completedSignerName?: string | null;
  completedAt?: string | null;
};

export default function ContractPublicForm({
  token,
  locale,
  signerName,
  renterEmail,
  contractText,
  pdfHref,
  isCompleted,
  completedSignerName,
  completedAt,
}: ContractPublicFormProps) {
  const t = useTranslations('RentContract');
  const router = useRouter();
  const signatureRef = useRef<SignatureCanvasHandle | null>(null);
  const [name, setName] = useState(signerName ?? '');
  const [signatureData, setSignatureData] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const currentSignature = signatureData || signatureRef.current?.getDataUrl() || '';
    if (!name.trim()) {
      setError(t('validation.signerNameRequired'));
      return;
    }

    if (!currentSignature || signatureRef.current?.isEmpty()) {
      setError(t('validation.signatureRequired'));
      return;
    }

    startTransition(async () => {
      const result = await completeContractInviteAction({
        token,
        locale,
        signerName: name,
        renterSignatureData: currentSignature,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      triggerPdfDownload(pdfHref);
      setStatus(result.success ?? t('actionSuccess.returned'));
      router.refresh();
    });
  };

  const completedSignerLabel =
    completedSignerName ?? t('completed.unknownSigner');
  const formattedCompletedAt = completedAt
    ? new Intl.DateTimeFormat(mapLocaleToDateLocale(locale), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(completedAt))
    : null;

  return (
    <div className='space-y-6'>
      {isCompleted ? (
        <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
          <h2 className='text-xl font-semibold text-slate-900'>
            {t('completed.title')}
          </h2>
          <p className='mt-2 text-sm text-slate-600'>
            {formattedCompletedAt
              ? t('completed.summaryWithDate', {
                  name: completedSignerLabel,
                  date: formattedCompletedAt,
                })
              : t('completed.summary', { name: completedSignerLabel })}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className='space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'
        >
          <div className='space-y-2'>
            <label className='text-sm font-medium text-slate-700'>
              {t('form.signerName')}
            </label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-slate-700'>{t('form.email')}</label>
            <Input value={renterEmail ?? '—'} disabled />
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-slate-700'>
                {t('form.signature')}
              </span>
              <Button
                type='button'
                variant='secondary'
                onClick={() => {
                  signatureRef.current?.clear();
                  setSignatureData('');
                }}
              >
                {t('form.clear')}
              </Button>
            </div>
            <SignatureCanvas
              ref={signatureRef}
              onChange={(dataUrl) => setSignatureData(dataUrl)}
            />
          </div>

          {error ? <p className='text-sm text-red-600'>{error}</p> : null}
          {status ? <p className='text-sm text-emerald-700'>{status}</p> : null}

          <div className='flex justify-end'>
            <Button type='submit' disabled={isPending}>
              {isPending ? t('form.submitPending') : t('form.submitIdle')}
            </Button>
          </div>
        </form>
      )}

      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <p className='text-sm font-medium text-slate-700'>{t('contractText')}</p>
        <pre className='mt-4 whitespace-pre-wrap text-xs leading-6 text-slate-600'>
          {contractText}
        </pre>
      </div>
    </div>
  );
}

function mapLocaleToDateLocale(locale: string): string {
  const locales: Record<string, string> = {
    hu: 'hu-HU',
    en: 'en-US',
    de: 'de-DE',
    ro: 'ro-RO',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    sk: 'sk-SK',
    cz: 'cs-CZ',
    se: 'sv-SE',
    no: 'nb-NO',
    dk: 'da-DK',
    pl: 'pl-PL',
  };

  return locales[locale] ?? 'en-US';
}

function triggerPdfDownload(href: string) {
  const link = document.createElement('a');
  link.href = href;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
