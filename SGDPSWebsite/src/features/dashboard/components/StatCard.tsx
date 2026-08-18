import React from 'react';
import { clsx } from 'clsx';

export interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  accentColor?: 'maroon' | 'gold' | 'green' | 'blue' | 'purple' | 'red';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  accentColor = 'maroon',
}) => {
  const borderColors = {
    maroon: 'border-l-maroon',
    gold: 'border-l-gold',
    green: 'border-l-forest',
    blue: 'border-l-blue-600',
    purple: 'border-l-purple-600',
    red: 'border-l-red-600',
  };

  return (
    <div
      className={clsx(
        'bg-white border border-cream-border rounded-xl p-4 shadow-card border-l-4 transition-transform hover:-translate-y-0.5',
        borderColors[accentColor]
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-ink-subtle uppercase tracking-wider">{label}</div>
        <div className="p-2 rounded-lg bg-cream-track/60 text-maroon">{icon}</div>
      </div>
      <div className="mt-2">
        <div className="font-serif font-bold text-2xl text-ink leading-tight">{value}</div>
        {subValue && <div className="text-xs text-ink-subtle mt-1">{subValue}</div>}
      </div>
    </div>
  );
};
