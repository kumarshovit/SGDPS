import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'maroon' | 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'cash' | 'upi' | 'bank' | 'cheque';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'brand',
  size = 'md',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-bold',
  };

  const variantStyles = {
    brand:
      'bg-saffron-500/10 text-saffron-700 dark:text-saffron-300 border border-saffron-500/30',
    maroon:
      'bg-maroon-700/10 text-maroon-800 dark:text-maroon-300 border border-maroon-700/30',
    gold:
      'bg-gold-500/15 text-gold-800 dark:text-gold-300 border border-gold-500/35',
    success:
      'bg-leaf-500/15 text-leaf-700 dark:text-leaf-300 border border-leaf-500/30',
    warning:
      'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30',
    danger:
      'bg-maroon-900/15 text-maroon-800 dark:text-rose-400 border border-maroon-800/30',
    info:
      'bg-gold-500/10 text-gold-700 dark:text-gold-300 border border-gold-500/25',
    neutral:
      'bg-charcoal-500/10 text-charcoal-700 dark:text-charcoal-300 border border-charcoal-500/20',
    cash:
      'bg-leaf-500/15 text-leaf-800 dark:text-leaf-300 border border-leaf-500/35',
    upi:
      'bg-saffron-500/15 text-saffron-800 dark:text-saffron-300 border border-saffron-500/35',
    bank:
      'bg-gold-500/15 text-gold-800 dark:text-gold-300 border border-gold-500/35',
    cheque:
      'bg-maroon-700/15 text-maroon-800 dark:text-maroon-300 border border-maroon-700/35',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 rounded-full transition-colors',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
