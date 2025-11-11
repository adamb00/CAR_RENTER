'use client';

import AboutSection from '@/components/layout/AboutSection';
import Explore from '@/components/layout/Explore';
import HomeIntro from '@/components/layout/HomeIntro';
import { Header } from '@/components/layout/Header';
import Inquire from '@/components/layout/InquireSection';
import { CookieConsent } from '@/components/cookie-consent';

export default function HomeClient() {
  return (
    <div className='flex flex-col gap-y-0'>
      <Header />
      <AboutSection />
      <HomeIntro />
      <Explore />
      <Inquire />
    </div>
  );
}
