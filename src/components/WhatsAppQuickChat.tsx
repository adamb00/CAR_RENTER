// src/components/whatsapp/WhatsappQuickChat.tsx
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SocialIcon } from 'react-social-icons';
import 'react-social-icons/wa.me';
import { useTranslations } from 'next-intl';

type Option = { id: string; label: string; text: string };

type Props = {
  phoneDigits?: string;
  options: Option[];
  utm?: Record<string, string>;
  label?: string;
  size?: 'icon' | 'sm' | 'default' | 'lg';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
};

function buildWaHref(
  phoneDigits: string,
  msg: string,
  utm?: Record<string, string>
) {
  const base = `https://wa.me/${phoneDigits}`;
  const params = new URLSearchParams({ text: msg });
  if (utm) for (const [k, v] of Object.entries(utm)) params.set(k, v);
  return `${base}?${params.toString()}`;
}

export function WhatsappQuickChat({
  phoneDigits = process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.replace(/[^\d]/g, '') ||
    '',
  options,
  utm,
  size = 'icon',
  variant = 'default',
}: Props) {
  const t = useTranslations('WhatsApp');
  const validPhone = useMemo(
    () => phoneDigits.replace(/[^\d]/g, ''),
    [phoneDigits]
  );

  function sendQuick(option: Option) {
    if (!validPhone) return;
    const href = buildWaHref(validPhone, option.text, utm);
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          variant={variant}
          className={
            size === 'icon' ? 'rounded-full h-14 w-14' : 'gap-2 rounded-full'
          }
          aria-label={t('aria_label')}
          disabled={!validPhone}
          style={{
            backgroundColor: 'var(--color-bg)',
            color: 'var(--navy)',
          }}
        >
          <SocialIcon url='https://www.whatsapp.com/' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuLabel>{t('choose_option')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => sendQuick(opt)}
            className='cursor-pointer hover:!bg-grey-dark-1 hover:!text-grey-light-1 transition-all duration-200'
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
