import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  headerBorder?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  title,
  subtitle,
  action,
  headerBorder = true,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl border border-cream-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 shadow-festive dark:shadow-festive-dark transition-all duration-200',
          className
        )
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          className={clsx(
            'flex items-center justify-between px-6 py-4.5',
            headerBorder && 'border-b border-cream-100 dark:border-charcoal-700/80'
          )}
        >
          <div>
            {title && (
              <div className="text-base font-bold text-charcoal-900 dark:text-cream-50 tracking-tight">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-xs text-charcoal-500 dark:text-charcoal-300 mt-0.5 font-medium">
                {subtitle}
              </div>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
