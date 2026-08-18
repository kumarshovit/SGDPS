import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

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
  type,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
          type={effectiveType}
          className={twMerge(
            clsx(
              'w-full rounded-xl border border-cream-border dark:border-charcoal-700 bg-cream-50/70 dark:bg-charcoal-900 px-3.5 py-2.5 text-sm text-charcoal-900 dark:text-cream-50 placeholder-charcoal-400 dark:placeholder-charcoal-400 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 dark:focus:ring-gold-400/50 dark:focus:border-gold-400',
              icon && 'pl-10',
              (rightElement || isPassword) && 'pr-10',
              error && 'border-maroon-600 focus:ring-maroon-500/50 focus:border-maroon-600',
              className
            )
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:text-charcoal-400 dark:hover:text-cream-200 focus:outline-none transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : rightElement ? (
          <div className="absolute right-3 text-charcoal-400 flex items-center">{rightElement}</div>
        ) : null}
      </div>
      {error && <p className="mt-1 text-xs text-maroon-600 dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
};
