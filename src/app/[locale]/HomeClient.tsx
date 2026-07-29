import AboutSection from '@/components/layout/AboutSection';

import Explore from '@/components/layout/Explore';
import { Header } from '@/components/layout/Header';
import HomeIntro from '@/components/layout/HomeIntro';
import HomePopupOrchestrator from '@/components/layout/HomePopupOrchestrator';
import Inquire from '@/components/layout/InquireSection';
import RentSection from '@/components/layout/RentSection';
import type { CarActionPromotion } from '@/lib/cars';

type HomeClientProps = {
  locale: string;
  actions: CarActionPromotion[][];
};

export default function HomeClient({ locale, actions }: HomeClientProps) {
  return (
    <div className='flex flex-col gap-y-0'>
      <HomePopupOrchestrator promotions={actions} />
      <Header />
      <RentSection locale={locale} />
      <AboutSection />
      <Explore />
      <HomeIntro />
      <Inquire />
    </div>
  );
}
