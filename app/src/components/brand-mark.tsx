import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground',
        className
      )}
    >
      <DollarSign className="size-3/5" strokeWidth={2.5} />
    </span>
  );
}
