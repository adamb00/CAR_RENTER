import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

const HERO_IMAGES = [
  {
    src: '/header_image.webp',
    alt: 'Naplemente Corralejo dűnéi fölött bérautóval',
  },
  {
    src: '/DSC00603.jpg',
    alt: 'Lanzarote part menti út bérautóval',
  },
  {
    src: '/BETANCURIA.jpg',
    alt: 'Kilátás Betancuria hegyvidéki útjára',
  },
  {
    src: '/AJUY.jpg',
    alt: 'Ajuy fekete homokos strandja autóval a háttérben',
  },
  {
    src: '/DSC00201.jpg',
    alt: 'Zodiacs bérautó Puerto del Rosario kikötőjénél',
  },
  {
    src: '/DSC00425.jpg',
    alt: 'Off-road kilátás Lanzarote tűzhányóira',
  },
  {
    src: '/DSC00495.jpg',
    alt: 'Part menti szerpentin Costa Calma közelében',
  },
  {
    src: '/DSC00587.jpg',
    alt: 'Timanfaya vulkanikus táj naplementében',
  },
  {
    src: '/DSC00179.jpg',
    alt: 'Bérautó út közben a Kanári-szigeteken',
  },
];

export default function HeaderCarousel() {
  return (
    <Carousel
      className='h-full w-full'
      plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
    >
      <CarouselContent className='h-full'>
        {HERO_IMAGES.map((image, index) => (
          <CarouselItem className='h-full' key={image.src}>
            <picture>
              <source
                media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
                srcSet={image.src}
              />
              <img
                src={image.src}
                alt={image.alt}
                className='h-full w-full object-cover object-center min-h-[95vh] min-w-full'
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </picture>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className='z-20' />
      <CarouselNext className='z-20' />
    </Carousel>
  );
}
