import React from 'react';
import SectionCard from '../SectionCard';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { RentFormValues } from '@/schemas/RentSchema';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

export default function Children({
  form,
}: {
  form: UseFormReturn<RentFormValues>;
}) {
  const t = useTranslations('RentForm');

  const {
    fields: childFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({
    control: form.control,
    name: 'children',
  });

  const handleAddChild = () => {
    appendChild({ age: '', height: undefined });
  };

  return (
    <SectionCard
      title={t('sections.children.title')}
      description={t('sections.children.description')}
      action={
        <Button
          type='button'
          variant='outline'
          onClick={handleAddChild}
          className='hover:bg-foreground hover:text-background cursor-pointer'
        >
          {t('buttons.addChild')}
        </Button>
      }
    >
      {childFields.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border/60 bg-muted/40 px-6 py-10 text-center text-sm text-muted-foreground'>
          {t('sections.children.empty')}
        </div>
      ) : (
        <div className='space-y-4'>
          {childFields.map((child, index) => (
            <div
              key={child.id}
              className='flex flex-col gap-4 rounded-lg border border-border/60 bg-background/80 p-4 transition hover:border-border sm:flex-row sm:items-end sm:gap-6'
            >
              <FormField
                control={form.control}
                name={`children.${index}.age`}
                render={({ field }) => (
                  <FormItem className='sm:flex-1'>
                    <FormLabel>
                      {t('sections.children.ageLabel', {
                        index: index + 1,
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        inputMode='numeric'
                        min={0}
                        max={17}
                        value={field.value || ''}
                        onChange={(event) =>
                          field.onChange(+event.target.value)
                        }
                        onWheel={(e) =>
                          (e.currentTarget as HTMLInputElement).blur()
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`children.${index}.height`}
                render={({ field }) => (
                  <FormItem className='sm:flex-1'>
                    <FormLabel>{t('sections.children.heightLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ''
                              ? undefined
                              : Number(event.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type='button'
                variant='ghost'
                onClick={() => removeChild(index)}
                className='sm:self-center'
              >
                {t('buttons.removeChild')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
