'use client';
import { useTheme } from 'next-themes';
import Image, { StaticImageData } from 'next/image';
import React, { useEffect, useState } from 'react';
import logo_dark from '../../public/logo_black.png';
import logo_light from '../../public/logo_white.png';

export default function Logo({
  logo,
  size = 'sm',
}: {
  logo?: StaticImageData;
  size?: string;
}) {
  const xs = 'h-12';
  const sm = 'h-24 sm:h-28 md:h-32 lg:h-44';
  const lg = 'h-44';
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatches by waiting until mounted
  if (!mounted) {
    return (
      <Image
        src={logo ?? logo_light}
        alt='Logo'
        className={`w-auto ${size === 'sm' ? sm : size === 'xs' ? xs : lg}`}
        sizes='(min-width: 1280px) 256px, (min-width: 1024px) 224px, (min-width: 768px) 192px, (min-width: 640px) 160px, 128px'
        priority={false}
      />
    );
  }

  const image = logo ?? (resolvedTheme === 'light' ? logo_dark : logo_light);

  return (
    <Image
      src={image}
      alt='Logo'
      className={`w-auto ${size === 'sm' ? sm : size === 'xs' ? xs : lg}`}
      sizes='(min-width: 1280px) 256px, (min-width: 1024px) 224px, (min-width: 768px) 192px, (min-width: 640px) 160px, 128px'
      priority={false}
    />
  );
}
