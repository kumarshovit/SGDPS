import { useState, useMemo, useEffect } from 'react';

export interface UsePaginationOptions<T> {
  initialPageSize?: number | 'all';
  data: T[];
}

export function usePagination<T>({ initialPageSize = 50, data }: UsePaginationOptions<T>) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(initialPageSize);

  const totalItems = data.length;

  const totalPages = useMemo(() => {
    if (pageSize === 'all' || totalItems === 0) return 1;
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  // If current page is out of bounds due to filtering, adjust page
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    if (pageSize === 'all') return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  const handlePageSizeChange = (newSize: number | 'all') => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const resetPage = () => setCurrentPage(1);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    resetPage,
  };
}
