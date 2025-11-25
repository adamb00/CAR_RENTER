"use client";

import React from 'react';
import Autoplay from 'embla-carousel-autoplay';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

type CarImageCarouselProps = {
  images: string[];
  name: string;
  className?: string;
  imageClassName?: string;
};

export default function CarImageCarousel({
  images,
  name,
  className,
  imageClassName,
}: CarImageCarouselProps) {
  const plugins = React.useMemo(
    () => (images.length > 1 ? [Autoplay({ delay: 3500, stopOnInteraction: false })] : []),
    [images]
  );

  const hasMultiple = images.length > 1;

  return (
    <Carousel
      className={cn('h-full w-full', className)}
      opts={{ loop: hasMultiple }}
      plugins={plugins}
    >
      <CarouselContent className='h-full'>
        {images.map((src, index) => (
          <CarouselItem key={`${name}-${src}`} className='h-full'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={name}
              className={cn('h-full w-full object-contain bg-background', imageClassName)}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {hasMultiple ? (
        <>
          <CarouselPrevious className='-left-6 sm:-left-10' />
          <CarouselNext className='-right-6 sm:-right-10' />
        </>
      ) : null}
    </Carousel>
  );
}
