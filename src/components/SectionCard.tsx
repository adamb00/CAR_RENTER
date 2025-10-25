import React from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { cn } from '@/lib/utils';

type SectionCardProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

const SectionCard = ({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SectionCardProps) => (
  <Card className={cn('bg-background/60 backdrop-blur-sm', className)}>
    <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6'>
      <div className='space-y-1'>
        <CardTitle className='text-xl font-semibold tracking-tight'>
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className='max-w-4xl text-sm leading-relaxed'>
            {description}
          </CardDescription>
        ) : null}
      </div>
      {action ? (
        <CardAction className='sm:justify-self-end'>{action}</CardAction>
      ) : null}
    </CardHeader>
    <CardContent className={cn('space-y-6', contentClassName)}>
      {children}
    </CardContent>
  </Card>
);

export default SectionCard;
