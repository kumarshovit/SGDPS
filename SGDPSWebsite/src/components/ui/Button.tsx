import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'maroon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-saffron-600 via-gold-600 to-saffron-700 hover:from-saffron-700 hover:to-gold-700 text-white shadow-gold focus:ring-gold-500',
    gradient:
      'bg-gradient-to-r from-maroon-800 via-saffron-600 to-gold-500 hover:opacity-95 text-white shadow-glow-saffron focus:ring-gold-500',
    maroon:
      'bg-maroon-800 hover:bg-maroon-900 text-white shadow-glow-maroon focus:ring-maroon-500',
    secondary:
      'bg-cream-100 dark:bg-charcoal-700 hover:bg-cream-200 dark:hover:bg-charcoal-600 text-charcoal-900 dark:text-cream-100 border border-cream-border dark:border-charcoal-600 focus:ring-gold-400',
    outline:
      'border border-gold-500/40 dark:border-gold-500/30 bg-transparent hover:bg-gold-500/10 text-charcoal-800 dark:text-cream-100 focus:ring-gold-500',
    ghost:
      'bg-transparent hover:bg-cream-100 dark:hover:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-cream-100',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-md focus:ring-rose-400',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
