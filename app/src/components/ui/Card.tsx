import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const base = 'rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-sm overflow-hidden';
    const variants = {
      default: 'transition-colors hover:border-white/[0.12]',
      hover: 'transition-all cursor-pointer hover:border-red-500/40 hover:bg-white/[0.06]',
    };
    return (
      <div ref={ref} className={clsx(base, variants[variant], className)} {...props} />
    );
  }
);
Card.displayName = 'Card';
