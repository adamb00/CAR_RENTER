import Image from 'next/image';
import clsx from 'clsx';

type BlogImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  caption?: string;
};

export function BlogImage({
  src,
  alt,
  priority,
  className,
  caption,
}: BlogImageProps) {
  return (
    <figure className={clsx('space-y-3', className)}>
      <div className='overflow-hidden rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/80 dark:bg-grey-dark-3/60'>
        <Image
          src={src}
          alt={alt}
          width={1280}
          height={720}
          priority={priority}
          className='w-full h-auto object-cover'
        />
      </div>
      {caption ? (
        <figcaption className='text-sm text-grey-dark-2 dark:text-grey-light-2'>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
