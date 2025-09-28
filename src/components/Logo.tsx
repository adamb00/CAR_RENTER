import Image, { StaticImageData } from 'next/image';
import React from 'react';

export default function Logo({
  logo,
  size = 'sm',
}: {
  logo: StaticImageData;
  size?: string;
}) {
  const sm = 'h-24 sm:h-28 md:h-32 lg:h-44';
  const lg = 'h-44';
  return (
    <Image
      src={logo}
      alt='Logo'
      className={`w-auto ${size === 'sm' ? sm : lg}`}
      sizes='(min-width: 1280px) 256px, (min-width: 1024px) 224px, (min-width: 768px) 192px, (min-width: 640px) 160px, 128px'
      priority={false}
    />
  );
}
