'use client';

import AboutSection from '@/components/layout/AboutSection';
import Explore from '@/components/layout/Explore';
import { Header } from '@/components/layout/Header';
import Inquire from '@/components/layout/InquireSection';
import WhatsAppContainer from '@/components/WhatsAppContainer';

export default function HomePage() {
  return (
    <div className='flex flex-col gap-y-0 md:gap-y-[5rem]'>
      <Header />
      <AboutSection />
      <Explore />
      <Inquire />
      <WhatsAppContainer />
    </div>
  );
}
