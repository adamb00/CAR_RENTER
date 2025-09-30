import Logo from '@/components/Logo';
import React from 'react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Car = {
  id: string;
  name: string;
  image: string;
  pricePerDay: number;
  seats: number;
  transmission: 'manual' | 'automatic';
};

export default async function CarsPage() {
  const t = await getTranslations('Cars');
  const cars: Car[] = Array.from({ length: 8 }).map((_, i) => ({
    id: `car-${i + 1}`,
    name: `Autó ${i + 1}`,
    image: '/cars.webp',
    pricePerDay: 35 + i * 5,
    seats: i % 3 === 0 ? 7 : 5,
    transmission: i % 2 === 0 ? 'manual' : 'automatic',
  }));
  return (
    <div className='relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-18 sm:pt-18 md:pt-22 lg:pt-28'>
      <Link
        href='/'
        className='absolute -left-8 sm:left-0 md:-left-8 -top-4 sm:top-0 md:-top-8 z-[1200]'
      >
        <Logo size='sm' />
      </Link>
      <h2 className='text-2xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-normal md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
        {t('title')}
      </h2>
      <div className='mt-10 text-grey-dark-3 text-base md:text-lg tracking-wider'>
        <p className='mb-4'>
          {t.rich('p1', { strong: (c) => <strong>{c}</strong> })}
        </p>
        <p className='mb-6'>
          {t.rich('p2', { strong: (c) => <strong>{c}</strong> })}
        </p>
      </div>
      <div className='mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 mb-20'>
        {cars.map((car) => (
          <div
            key={car.id}
            className='group rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200'
          >
            <div className='relative aspect-square md:aspect-[4/3] lg:aspect-[16/10] bg-muted/30 overflow-hidden'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={car.image}
                alt={car.name}
                className='h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300'
                loading='lazy'
              />
            </div>
            <div className='p-4 sm:p-5 border shadow-xl'>
              <h3 className='text-lg font-semibold mb-1'>{car.name}</h3>
              <p className='text-sm text-muted-foreground mb-3'>
                {car.seats} {t('labels.seats')} •{' '}
                {car.transmission === 'manual'
                  ? t('labels.manual')
                  : t('labels.automatic')}
              </p>
              <div className='flex items-center justify-end'>
                <span className='text-xl font-bold'>
                  {t('labels.from_price', { price: car.pricePerDay })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
