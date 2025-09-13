'use client';
import { useTranslations } from 'next-intl';
import { WhatsappQuickChat } from './WhatsAppQuickChat';

export default function WhatsAppContainer() {
  const t = useTranslations('WhatsApp');
  return (
    <div className='fixed bottom-4 right-4 z-[2000]'>
      <WhatsappQuickChat
        options={[
          {
            id: 'transfer_quote',
            label: t('options.transfer_quote.label'),
            text: t('options.transfer_quote.text'),
          },
          {
            id: 'car_availability',
            label: t('options.car_availability.label'),
            text: t('options.car_availability.text'),
          },
          {
            id: 'interested_in',
            label: t('options.interested_in.label'),
            text: t('options.interested_in.text'),
          },
          {
            id: 'custom_message',
            label: t('options.custom_message.label'),
            text: t('options.custom_message.text'),
          },
        ]}
        utm={{
          utm_source: 'site',
          utm_medium: 'button',
          utm_campaign: 'whatsapp-quick',
        }}
        size='icon'
        variant='default'
      />
    </div>
  );
}
