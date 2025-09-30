import Logo from '@/components/Logo';

export default function ContactPage() {
  return (
    <>
      <div className='relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40'>
        <a
          href='/'
          className='absolute -left-8 sm:left-0 md:-left-8 -top-4 sm:top-0 md:-top-8 z-[1200]'
        >
          <Logo size='sm' />
        </a>
        <h2 className='text-3xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-wide md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          Kérdésed van az autóbérléssel kapcsolatban Fuerteventurán vagy
          Lanzarotén?
        </h2>
        <div className='mt-10 text-grey-dark-3 text-base md:text-lg tracking-wider'>
          <p className='mb-4'>
            Vedd fel velünk a kapcsolatot, és segítünk megtalálni{' '}
            <strong>a számodra legjobb megoldást!</strong> Legyen szó
            előfoglalásról, reptéri kiszállításról vagy szállodához történő
            autóátadásról, ügyfélszolgálatunk{' '}
            <strong>gyorsan és rugalmasan</strong> válaszol.
          </p>
          <p className='mb-6'>
            Töltsd ki az alábbi űrlapot, írj nekünk e-mailt, messenger, whatsapp
            vagy viber üzenetet, vagy hívj telefonon! strong Örömmel állunk
            rendelkezésedre, hogy nyaralásod gondtalanul teljen.
          </p>
        </div>
      </div>
    </>
  );
}
