// src/components/ui/photo-composition.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

export type Photo = {
  src: string;
  sizes?: string;
  alt: string;
};

type Props = {
  photos: Photo[];
};

export function PhotoComposition({ photos }: Props) {
  const [active, setActive] = useState<number | null>(null);

  // DESKTOP pozíciók és stílusok (egyedi minden képhez)
  const desktopPos = [
    'left-0 -top-8', // p1
    'right-0 top-8', // p2
    'left-[20%] top-40', // p3
  ];

  // Közös Image helper
  const Img = ({ photo, className }: { photo: Photo; className?: string }) => (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={photo.sizes ?? '(min-width: 1024px) 33vw, 90vw'}
      quality={85}
      className={className ?? 'object-cover'}
      draggable={false}
    />
  );

  return (
    <div
      className='composition relative lg:h-[28rem] xl:h-[32rem]'
      onMouseLeave={() => setActive(null)}
    >
      {/* Mobil/Tablet */}
      <div className='grid grid-cols-3 gap-3 lg:hidden'>
        {photos.map((p, i) => {
          const isActive = active === i;
          return (
            <button
              type='button'
              key={i}
              className={[
                'aspect-[4/5] relative',
                isActive ? 'z-20' : 'z-10',
              ].join(' ')}
              onClick={() => setActive(isActive ? null : i)}
            >
              <Img
                photo={p}
                className={[
                  'h-full w-full object-cover rounded-lg transition-transform duration-200',
                  'shadow-[0_1.5rem_3rem_rgba(0,0,0,0.2)]',
                  isActive
                    ? 'scale-105 -translate-y-1 shadow-[0_2.5rem_4rem_rgba(0,0,0,0.4)] ring-[1rem] ring-amber-light/70'
                    : '',
                ].join(' ')}
              />
            </button>
          );
        })}
      </div>

      {/* Desktop */}
      <div className='hidden lg:block'>
        {photos.map((p, i) => {
          const isActive = active === i;
          return (
            <button
              type='button'
              key={i}
              onMouseEnter={() => setActive(i)}
              onPointerDown={() => setActive(isActive ? null : i)}
              className={[
                'absolute w-[65%] aspect-[1] rounded-lg cursor-pointer',
                desktopPos[i] ?? '',
                'transition-transform duration-200 ease-in-out',
                isActive
                  ? 'z-20 scale-105 -translate-y-2 ring-[1rem] ring-amber-light/70'
                  : 'z-10 hover:scale-105 hover:-translate-y-2',
                active !== null && active !== i ? 'scale-95' : '',
                'shadow-[0_1.5rem_4rem_rgba(0,0,0,0.4)]',
              ].join(' ')}
            >
              <Img photo={p} className='object-cover rounded-lg' />
            </button>
          );
        })}
      </div>
    </div>
  );
}
