import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightElement,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-cream-200 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-gold-600 dark:text-gold-400 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={twMerge(
            clsx(
              'w-full rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 px-3.5 py-2.5 text-sm text-charcoal-900 dark:text-cream-50 placeholder-charcoal-400 dark:placeholder-charcoal-400 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 dark:focus:ring-gold-400/50 dark:focus:border-gold-400',
              icon && 'pl-10',
              rightElement && 'pr-10',
              error && 'border-maroon-600 focus:ring-maroon-500/50 focus:border-maroon-600',
              className
            )
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 text-charcoal-400 flex items-center">{rightElement}</div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-maroon-600 dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
};
