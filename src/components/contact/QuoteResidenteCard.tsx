import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '../ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { QuoteRequestValues } from './QuoteRequestForm';
import {
  normalizeResidentCardMimeType,
  RESIDENT_CARD_INPUT_ACCEPT,
  RESIDENT_CARD_MAX_SIZE_BYTES,
  RESIDENT_CARD_MAX_SIZE_MB,
} from './quote.types';

const readFileAsBase64 = async (file: File): Promise<string> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to read file as data URL'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'));
    reader.readAsDataURL(file);
  });

  const [, content = ''] = dataUrl.split(',', 2);
  return content;
};

export default function QuoteResidenteCard({
  form,
}: {
  form: UseFormReturn<QuoteRequestValues>;
}) {
  const t = useTranslations('Contact');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const residentCard = form.watch('residentCard');

  useEffect(() => {
    if (!residentCard && inputRef.current) {
      inputRef.current.value = '';
    }
  }, [residentCard]);

  return (
    <FormField
      control={form.control}
      name='residentCard'
      render={({ field }) => {
        const isImagePreview = field.value?.type.startsWith('image/');
        const previewSrc =
          isImagePreview && field.value
            ? `data:${field.value.type};base64,${field.value.content}`
            : null;

        return (
          <FormItem className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
            <FormLabel>{t('form.fields.residentCard.label')}</FormLabel>
            <FormDescription>
              {t('form.fields.residentCard.description', {
                maxSizeMb: RESIDENT_CARD_MAX_SIZE_MB,
              })}
            </FormDescription>
            <FormControl>
              <Input
                ref={inputRef}
                type='file'
                accept={RESIDENT_CARD_INPUT_ACCEPT}
                onChange={async (event) => {
                  const target = event.target;
                  const file = target.files?.[0] ?? null;

                  if (!file) {
                    field.onChange(undefined);
                    form.clearErrors('residentCard');
                    return;
                  }

                  const normalizedType = normalizeResidentCardMimeType(
                    file.type,
                    file.name,
                  );

                  if (!normalizedType) {
                    form.setError('residentCard', {
                      type: 'validate',
                      message: t('form.errors.residentCardInvalidType'),
                    });
                    field.onChange(undefined);
                    target.value = '';
                    return;
                  }

                  if (file.size > RESIDENT_CARD_MAX_SIZE_BYTES) {
                    form.setError('residentCard', {
                      type: 'validate',
                      message: t('form.errors.residentCardTooLarge', {
                        maxSizeMb: RESIDENT_CARD_MAX_SIZE_MB,
                      }),
                    });
                    field.onChange(undefined);
                    target.value = '';
                    return;
                  }

                  try {
                    const content = await readFileAsBase64(file);
                    form.clearErrors('residentCard');
                    field.onChange({
                      name: file.name,
                      type: normalizedType,
                      content,
                      size: file.size,
                    });
                  } catch {
                    form.setError('residentCard', {
                      type: 'validate',
                      message: t('form.errors.residentCardReadFailed'),
                    });
                    field.onChange(undefined);
                    target.value = '';
                  }
                }}
              />
            </FormControl>
            {field.value ? (
              <div className='space-y-3 rounded-xl  border border-border/60 bg-background/70 p-3 text-sm'>
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={field.value.name}
                    className='h-56 rounded-lg border  border-border/60 object-contain bg-muted/40'
                  />
                ) : null}
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    className='cursor-pointer'
                    size='sm'
                    onClick={() => {
                      field.onChange(undefined);
                      form.clearErrors('residentCard');
                      if (inputRef.current) {
                        inputRef.current.value = '';
                      }
                    }}
                  >
                    {t('form.fields.residentCard.remove')}
                  </Button>
                </div>
              </div>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
