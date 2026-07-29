'use client';

import { Info } from 'lucide-react';
import { FormLabel } from '../ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

type TimeFieldLabelProps = {
  label: string;
  tooltip: string;
};

export default function TimeFieldLabel({
  label,
  tooltip,
}: TimeFieldLabelProps) {
  return (
    <div className='inline-flex items-center gap-1.5'>
      <FormLabel>{label}</FormLabel>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              aria-label={tooltip}
              className='inline-flex text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            >
              <Info aria-hidden='true' className='h-3.5 w-3.5' />
            </button>
          </TooltipTrigger>
          <TooltipContent side='top' sideOffset={6}>
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
