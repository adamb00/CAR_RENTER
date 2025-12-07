import type { CreateSubmitHandler } from '@/app/[locale]/cars/[id]/rent/create-submit-handler';
import { RentFormValues } from '@/schemas/RentSchema';
import { useTranslations } from 'next-intl';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

type RentDialogProps = {
  form: UseFormReturn<RentFormValues>;
  isPending: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createSubmitHandler: CreateSubmitHandler;
};

export default function RentDialog({
  form,
  isPending,
  open,
  onOpenChange,
  createSubmitHandler,
}: RentDialogProps) {
  const t = useTranslations('RentForm');

  const arrivalFlightValue = form.watch('delivery.arrivalFlight');
  const departureFlightValue = form.watch('delivery.departureFlight');
  const areFlightNumbersProvided =
    typeof arrivalFlightValue === 'string' &&
    arrivalFlightValue.trim().length > 0 &&
    typeof departureFlightValue === 'string' &&
    departureFlightValue.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('missingFlightsDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('missingFlightsDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name={'delivery.arrivalFlight'}
            render={({ field }) => {
              const value = typeof field.value === 'string' ? field.value : '';
              return (
                <FormItem>
                  <FormLabel>
                    {t('sections.delivery.fields.arrivalFlight.label')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'sections.delivery.fields.arrivalFlight.placeholder'
                      )}
                      value={value}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name={'delivery.departureFlight'}
            render={({ field }) => {
              const value = typeof field.value === 'string' ? field.value : '';
              return (
                <FormItem>
                  <FormLabel>
                    {t('sections.delivery.fields.departureFlight.label')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'sections.delivery.fields.departureFlight.placeholder'
                      )}
                      value={value}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
        <DialogFooter className='sm:justify-between'>
          <Button
            type='button'
            variant='outline'
            disabled={isPending}
            onClick={() => {
              createSubmitHandler({ bypassFlightCheck: true })();
            }}
          >
            {t('buttons.flightNumberUnknown')}
          </Button>
          <Button
            type='button'
            disabled={!areFlightNumbersProvided || isPending}
            onClick={() => {
              createSubmitHandler()();
            }}
          >
            {t('buttons.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
