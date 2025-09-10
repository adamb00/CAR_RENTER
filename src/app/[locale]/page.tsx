'use client';

import AboutSection from '@/components/layout/AboutSection';
import { Header } from '@/components/layout/Header';

export default function HomePage() {
  return (
    <div className='flex flex-col gap-y-0 md:gap-y-[5rem]'>
      <Header />
      <AboutSection />
    </div>
  );
}
