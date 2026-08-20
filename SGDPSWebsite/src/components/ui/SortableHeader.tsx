import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { SortDirection } from '../../hooks/useTableSort';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string;
  currentSortDir: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

/**
 * A clickable table header cell (`<th>`) with sort direction indicator.
 *
 * Renders ▲ for ascending, ▼ for descending, and a neutral ⇅ icon when
 * the column is not the active sort column.
 */
export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onSort,
  className = '',
}) => {
  const isActive = currentSortKey === sortKey;

  return (
    <th
      className={`py-3 px-3 cursor-pointer select-none group hover:text-gold-500 dark:hover:text-gold-400 transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-shrink-0">
          {isActive && currentSortDir === 'asc' ? (
            <ChevronUp size={13} className="text-gold-500" />
          ) : isActive && currentSortDir === 'desc' ? (
            <ChevronDown size={13} className="text-gold-500" />
          ) : (
            <ChevronsUpDown
              size={13}
              className="text-charcoal-400/50 group-hover:text-gold-400/70 transition-colors"
            />
          )}
        </span>
      </span>
    </th>
  );
};
