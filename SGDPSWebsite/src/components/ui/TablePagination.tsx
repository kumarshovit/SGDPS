import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number | 'all';
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number | 'all') => void;
  pageSizeOptions?: Array<number | 'all'>;
  itemLabel?: string;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200, 'all'],
  itemLabel = 'records',
  className = '',
}) => {
  if (totalItems === 0) return null;

  const startItem = pageSize === 'all' ? 1 : Math.min((currentPage - 1) * (pageSize as number) + 1, totalItems);
  const endItem = pageSize === 'all' ? totalItems : Math.min(currentPage * (pageSize as number), totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t border-cream-200 dark:border-charcoal-700/80 text-xs text-charcoal-600 dark:text-charcoal-300 ${className}`}
    >
      {/* Showing item range and page size selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span>
          Showing <strong className="font-bold text-charcoal-900 dark:text-cream-50 font-mono">{startItem} - {endItem}</strong> of{' '}
          <strong className="font-bold text-charcoal-900 dark:text-cream-50 font-mono">{totalItems.toLocaleString('en-IN')}</strong> {itemLabel}
        </span>
        <span className="text-charcoal-300 dark:text-charcoal-600">|</span>
        <div className="flex items-center gap-1.5">
          <label htmlFor="table-page-size" className="text-charcoal-500 dark:text-charcoal-400">Rows per page:</label>
          <select
            id="table-page-size"
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value;
              onPageSizeChange(val === 'all' ? 'all' : Number(val));
            }}
            aria-label="Rows per page"
            className="px-2 py-1 rounded-lg bg-white dark:bg-charcoal-800 border border-cream-border dark:border-charcoal-700 text-charcoal-800 dark:text-cream-100 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-saffron-500 cursor-pointer text-xs"
          >
            {pageSizeOptions.map((opt) => (
              <option key={String(opt)} value={opt}>
                {opt === 'all' ? 'All' : opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pagination controls */}
      {pageSize !== 'all' && totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 h-7.5 w-7.5 min-w-0"
            title="First Page"
            aria-label="First Page"
          >
            <ChevronsLeft size={13} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 h-7.5 w-7.5 min-w-0"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft size={13} />
          </Button>

          <div className="px-2.5 py-1 font-mono font-bold text-xs bg-cream-100 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 rounded-lg text-charcoal-800 dark:text-cream-100">
            Page {currentPage} of {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 h-7.5 w-7.5 min-w-0"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight size={13} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 h-7.5 w-7.5 min-w-0"
            title="Last Page"
            aria-label="Last Page"
          >
            <ChevronsRight size={13} />
          </Button>
        </div>
      )}
    </div>
  );
};
