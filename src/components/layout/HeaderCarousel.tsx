import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
export default function HeaderCarousel() {
  return (
    <Carousel
      className='h-full w-full'
      plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
    >
      <CarouselContent className='h-full'>
        <CarouselItem className='h-full'>
          <picture>
            <source
              media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
              srcSet={'/header_image.webp'}
            />
            <img
              src={'/header_image.webp'}
              alt='Zodiacs Rent a Car'
              className='h-full w-full object-cover object-center min-h-[95vh] min-w-full'
            />
          </picture>
        </CarouselItem>
        <CarouselItem className='h-full'>
          <picture>
            <source
              media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
              srcSet={'/DSC00603.jpg'}
            />
            <img
              src={'/DSC00603.jpg'}
              alt='Zodiacs Rent a Car'
              className='h-full w-full object-cover object-center min-h-[95vh] min-w-full'
            />
          </picture>
        </CarouselItem>
        <CarouselItem className='h-full'>
          <picture>
            <source
              media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
              srcSet={'/BETANCURIA.jpg'}
            />
            <img
              src={'/BETANCURIA.jpg'}
              alt='Zodiacs Rent a Car'
              className='h-full w-full object-cover object-center min-h-[95vh] min-w-full'
            />
          </picture>
        </CarouselItem>
        <CarouselItem className='h-full'>
          <picture>
            <source
              media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
              srcSet={'/AJUY2.jpg'}
            />
            <img
              src={'/AJUY2.jpg'}
              alt='Zodiacs Rent a Car'
              className='h-full w-full object-cover object-center min-h-[95vh] min-w-full'
            />
          </picture>
        </CarouselItem>
        <CarouselItem className='h-full'>
          <picture>
            <source
              media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
              srcSet={'/DSC00201.jpg'}
            />
            <img
              src={'/DSC00201.jpg'}
              alt='Zodiacs Rent a Car'
              className='h-full w-full object-cover object-center min-h-[95vh] min-w-full'
            />
          </picture>
        </CarouselItem>
        <CarouselItem className='h-full'>
          <picture>
            <source
              media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
              srcSet={'/DSC00425.jpg'}
            />
            <img
              src={'/DSC00425.jpg'}
              alt='Zodiacs Rent a Car'
              className='h-full w-full object-cover object-center min-h-[95vh] min-w-full'
            />
          </picture>
        </CarouselItem>
        <CarouselItem className='h-full'>
          <picture>
            <source
              media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
              srcSet={'/DSC00495.jpg'}
            />
            <img
              src={'/DSC00495.jpg'}
              alt='Zodiacs Rent a Car'
              className='h-full w-full object-cover object-center min-h-[95vh] min-w-full'
            />
          </picture>
        </CarouselItem>
        <CarouselItem className='h-full'>
          <picture>
            <source
              media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
              srcSet={'/DSC00587.jpg'}
            />
            <img
              src={'/DSC00587.jpg'}
              alt='Zodiacs Rent a Car'
              className='h-full w-full object-cover object-center min-h-[95vh] min-w-full'
            />
          </picture>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious className='z-20' />
      <CarouselNext className='z-20' />
    </Carousel>
  );
}
