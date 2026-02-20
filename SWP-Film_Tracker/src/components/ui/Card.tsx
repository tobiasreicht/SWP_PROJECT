import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseStyles = 'rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden';
    const variants = {
      default: 'hover:border-white/20',
      hover: 'hover:border-red-500/50 transition-all cursor-pointer',
    };

    return (
      <div
        ref={ref}
        className={clsx(baseStyles, variants[variant], className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
