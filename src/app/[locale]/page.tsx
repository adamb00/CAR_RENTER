'use client';

import AboutSection from '@/components/layout/AboutSection';
import { Header } from '@/components/layout/Header';
import Inquire from '@/components/layout/Inquire';
import WhatsAppContainer from '@/components/WhatsAppContainer';

import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('WhatsApp');
  return (
    <div className='flex flex-col gap-y-0 md:gap-y-[5rem]'>
      <Header />
      <AboutSection />
      <Inquire />
      <WhatsAppContainer />
    </div>
  );
}
