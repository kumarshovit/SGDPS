import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  gradient?: 'gold' | 'saffron' | 'maroon' | 'leaf';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendUp = true,
  icon: Icon,
  gradient = 'gold',
}) => {
  const ambientGradients = {
    gold: 'from-gold-500/25 via-gold-500/5 to-transparent',
    saffron: 'from-saffron-500/25 via-saffron-500/5 to-transparent',
    maroon: 'from-maroon-700/25 via-maroon-700/5 to-transparent',
    leaf: 'from-leaf-500/25 via-leaf-500/5 to-transparent',
  };

  const iconStyles = {
    gold: 'bg-gold-500/15 text-gold-700 dark:text-gold-300 border-gold-500/30 shadow-gold',
    saffron: 'bg-saffron-500/15 text-saffron-700 dark:text-saffron-300 border-saffron-500/30 shadow-glow-saffron',
    maroon: 'bg-maroon-700/15 text-maroon-800 dark:text-maroon-300 border-maroon-700/30 shadow-glow-maroon',
    leaf: 'bg-leaf-500/15 text-leaf-700 dark:text-leaf-300 border-leaf-500/30 shadow-glow-leaf',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cream-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 p-5 shadow-festive dark:shadow-festive-dark transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
      {/* Subtle Warm Ambient Glow */}
      <div
        className={clsx(
          'absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-100',
          ambientGradients[gradient]
        )}
      />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-300">
          {title}
        </span>
        <div
          className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110',
            iconStyles[gradient]
          )}
        >
          <Icon size={20} />
        </div>
      </div>

      <div className="relative z-10 mt-3">
        <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50">
          {value}
        </div>

        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md',
                trendUp
                  ? 'bg-leaf-500/15 text-leaf-700 dark:text-leaf-300'
                  : 'bg-maroon-700/15 text-maroon-800 dark:text-maroon-300'
              )}
            >
              {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-charcoal-500 dark:text-charcoal-400 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
