'use client';

import AboutSection from '@/components/layout/AboutSection';
import Explore from '@/components/layout/Explore';
import { Header } from '@/components/layout/Header';
import HomeIntro from '@/components/layout/HomeIntro';
import HomePopupOrchestrator from '@/components/layout/HomePopupOrchestrator';
import Inquire from '@/components/layout/InquireSection';

export default function HomeClient() {
  return (
    <div className='flex flex-col gap-y-0'>
      <HomePopupOrchestrator />
      <Header />
      <AboutSection />
      <Explore />
      <HomeIntro />
      <Inquire />
    </div>
  );
}
