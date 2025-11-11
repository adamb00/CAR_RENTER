import type { ReactNode } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export type LegalConsentItem<T extends FieldValues> = {
  name: Path<T>;
  label: ReactNode;
};

export type LegalConsentsProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  items: LegalConsentItem<T>[];
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
};

export default function LegalConsents<T extends FieldValues>({
  form,
  items,
  title,
  description,
  className,
}: LegalConsentsProps<T>) {
  return (
    <div className={cn('space-y-4', className)}>
      {title ? (
        <h3 className='text-lg font-semibold text-sky-dark dark:text-amber-light'>
          {title}
        </h3>
      ) : null}
      {description ? (
        <p className='text-sm text-muted-foreground'>{description}</p>
      ) : null}
      <div className='space-y-3'>
        {items.map((item) => (
          <FormField
            key={item.name as string}
            control={form.control}
            name={item.name}
            render={({ field }) => (
              <FormItem className='flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm'>
                <FormControl>
                  <Checkbox
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
                  />
                </FormControl>
                <div>
                  <FormLabel className='font-medium leading-snug'>
                    {item.label}
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
