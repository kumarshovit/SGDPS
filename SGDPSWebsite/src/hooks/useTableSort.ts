import { useState, useCallback } from 'react';
import { parseDateTime } from '../utils/formatters';

export type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  key: string;
  direction: SortDirection;
}

/**
 * Generic hook for managing table sort state and sorting data arrays.
 *
 * Usage:
 *   const { sortKey, sortDirection, handleSort, sortData } = useTableSort<MyType>();
 *
 * - Call `handleSort('fieldName')` from column headers.
 * - Call `sortData(filteredItems, getters)` before rendering, where `getters`
 *   maps sort keys to value-extractor functions.
 *
 * Clicking the same column cycles: asc → desc → none (reset to default order).
 */
export function useTableSort<T>() {
  const [sort, setSort] = useState<SortState>({ key: '', direction: null });

  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: '', direction: null };
    });
  }, []);

  /**
   * Sort an array of items according to the current sort state.
   *
   * @param items    The array to sort (not mutated).
   * @param getters  A record mapping sort keys to value-extractor functions.
   *                 The extracted value can be string | number | boolean | null | undefined.
   *                 Strings that look like dates/times are compared chronologically.
   */
  const sortData = useCallback(
    (
      items: T[],
      getters: Record<string, (item: T) => string | number | boolean | null | undefined>
    ): T[] => {
      if (!sort.key || !sort.direction || !getters[sort.key]) return items;

      const getter = getters[sort.key];
      const dir = sort.direction === 'asc' ? 1 : -1;

      return [...items].sort((a, b) => {
        const va = getter(a);
        const vb = getter(b);

        // Handle nulls — push them to the end regardless of direction
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;

        // Numbers
        if (typeof va === 'number' && typeof vb === 'number') {
          return (va - vb) * dir;
        }

        // Booleans
        if (typeof va === 'boolean' && typeof vb === 'boolean') {
          return ((va === vb ? 0 : va ? -1 : 1)) * dir;
        }

        // Strings — try date parsing first
        const sa = String(va);
        const sb = String(vb);

        const da = parseDateTime(sa);
        const db = parseDateTime(sb);
        if (da && db) {
          return (da.getTime() - db.getTime()) * dir;
        }

        // Pure string comparison (locale-aware)
        return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' }) * dir;
      });
    },
    [sort]
  );

  return {
    sortKey: sort.key,
    sortDirection: sort.direction,
    handleSort,
    sortData,
  };
}
