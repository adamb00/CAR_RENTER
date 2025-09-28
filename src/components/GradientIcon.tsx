import React, { useId } from 'react';
import type { LucideIcon } from 'lucide-react';

type GradientIconProps = {
  icon: LucideIcon;
  className?: string;
  from?: string;
  to?: string;
  strokeWidth?: number;
  ariaHidden?: boolean;
};

export default function GradientIcon({
  icon: Icon,
  className,
  from = 'var(--sky-dark)',
  to = 'var(--amber-light)',
  strokeWidth = 2,
  ariaHidden = true,
}: GradientIconProps) {
  const gradId = useId().replace(/:/g, '');
  return (
    <Icon
      className={className}
      color={`url(#${gradId})`}
      strokeWidth={strokeWidth}
      aria-hidden={ariaHidden}
    >
      <defs>
        <linearGradient id={gradId} x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor={from} stopOpacity='0.7' />
          <stop offset='100%' stopColor={to} stopOpacity='0.7' />
        </linearGradient>
      </defs>
    </Icon>
  );
}

