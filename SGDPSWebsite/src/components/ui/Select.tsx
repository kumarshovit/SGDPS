import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: { label: string; value: string | number; disabled?: boolean }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  placeholder,
  options,
  className,
  id,
  value,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-cream-200 mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        className={twMerge(
          clsx(
            'w-full rounded-xl border border-cream-border dark:border-charcoal-700 bg-white/95 dark:bg-charcoal-900 px-3.5 py-2.5 text-sm text-slate-900 font-semibold dark:text-cream-50 transition-all duration-150',
            (!value || value === '') && 'text-charcoal-500 font-normal dark:text-charcoal-400',
            'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 dark:focus:ring-gold-400/50 dark:focus:border-gold-400',
            error && 'border-maroon-600 focus:ring-maroon-500/50 focus:border-maroon-600',
            className
          )
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden className="text-charcoal-400 dark:text-charcoal-500 bg-white dark:bg-charcoal-900">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className="text-slate-900 bg-white dark:bg-charcoal-900 dark:text-cream-50 font-semibold py-1.5"
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-maroon-600 dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
};
