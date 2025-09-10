import { useState } from 'react';

export type Photo = {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
};

export function PhotoComposition({
  p1,
  p2,
  p3,
}: {
  p1: Photo;
  p2: Photo;
  p3: Photo;
}) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div
      className='composition relative lg:h-[28rem] xl:h-[32rem]'
      onMouseLeave={() => setActive(null)}
    >
      {/* Mobil/Tablet: 3 oszlop egymás mellett */}
      <div className='grid grid-cols-3 gap-3 lg:hidden'>
        {[p1, p2, p3].map((p, i) => {
          const isActive = active === i;
          return (
            <div
              key={i}
              className={[
                'aspect-[4/5] relative cursor-pointer', // relative -> z-index működni fog
                isActive ? 'z-20' : 'z-10', // wrapperre tesszük a z-indexet
              ].join(' ')}
              onClick={() => setActive(isActive ? null : i)}
            >
              <img
                src={p.src}
                srcSet={p.srcSet}
                sizes={p.sizes}
                alt={p.alt}
                className={[
                  'h-full w-full object-cover rounded-lg transition-transform duration-200',
                  'shadow-[0_1.5rem_3rem_rgba(0,0,0,0.2)]',
                  isActive
                    ? [
                        'scale-105 -translate-y-1',
                        'shadow-[0_2.5rem_4rem_rgba(0,0,0,0.4)]',
                        // használj alap színt, hacsak nincs amber-light a configban
                        'ring-[1rem] ring-amber-light/70',
                      ].join(' ')
                    : '',
                ].join(' ')}
              />
            </div>
          );
        })}
      </div>

      {/* Desktop: egymásra húzott képek */}
      <div className='hidden lg:block'>
        {/* P1 */}
        <img
          src={p1.src}
          srcSet={p1.srcSet}
          sizes={p1.sizes}
          alt={p1.alt}
          onMouseEnter={() => setActive(0)}
          onPointerDown={() => setActive(active === 0 ? null : 0)}
          draggable={false}
          className={[
            'absolute w-[55%] rounded-lg cursor-pointer',
            'left-0 -top-8',
            'transition-transform duration-200 ease-in-out',
            active !== null && active !== 0 ? 'scale-95' : '',
            // hover effektek egérre
            'hover:scale-105 hover:-translate-y-2',
            // ALAP árnyék
            'shadow-[0_1.5rem_4rem_rgba(0,0,0,0.4)]',
            // AKTÍV (tap/klikknél is)
            active === 0
              ? 'z-20 scale-105 -translate-y-2 ring-[1rem] ring-amber-light/70  shadow-[0_2.5rem_4rem_rgba(0,0,0,0.5)]'
              : 'z-10',
          ].join(' ')}
        />

        {/* P2 */}
        <img
          src={p2.src}
          srcSet={p2.srcSet}
          sizes={p2.sizes}
          alt={p2.alt}
          onMouseEnter={() => setActive(1)}
          onPointerDown={() => setActive(active === 2 ? null : 2)}
          draggable={false}
          className={[
            'absolute w-[55%] rounded-lg cursor-pointer',
            'right-0 top-8',
            'transition-transform duration-200 ease-in-out',
            active !== null && active !== 1 ? 'scale-95' : '',
            // hover effektek egérre
            'hover:scale-105 hover:-translate-y-2',
            // ALAP árnyék
            'shadow-[0_1.5rem_4rem_rgba(0,0,0,0.4)]',
            // AKTÍV (tap/klikknél is)
            active === 1
              ? 'z-20 scale-105 -translate-y-2 ring-[1rem] ring-amber-light/70  shadow-[0_2.5rem_4rem_rgba(0,0,0,0.5)]'
              : 'z-10',
          ].join(' ')}
        />

        {/* P3 */}
        <img
          src={p3.src}
          srcSet={p3.srcSet}
          sizes={p3.sizes}
          alt={p3.alt}
          onMouseEnter={() => setActive(2)}
          onPointerDown={() => setActive(active === 1 ? null : 1)}
          draggable={false}
          className={[
            'absolute w-[55%] rounded-lg cursor-pointer',
            'left-[20%] top-40',
            'transition-transform duration-200 ease-in-out',
            active !== null && active !== 2 ? 'scale-95' : '',
            // hover effektek egérre
            'hover:scale-105 hover:-translate-y-2',
            // ALAP árnyék
            'shadow-[0_1.5rem_4rem_rgba(0,0,0,0.4)]',
            // AKTÍV (tap/klikknél is)
            active === 2
              ? 'z-20 scale-105 -translate-y-2 ring-[1rem] ring-amber-light/70  shadow-[0_2.5rem_4rem_rgba(0,0,0,0.5)]'
              : 'z-10',
          ].join(' ')}
        />
      </div>
    </div>
  );
}
