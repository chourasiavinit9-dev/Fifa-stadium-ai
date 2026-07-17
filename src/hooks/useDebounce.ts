// src/hooks/useDebounce.ts
import { useState, useEffect } from "react";

/**
 * Debounces a value — only updates the returned value after `delay` ms
 * of no changes. Use for search inputs to avoid re-running expensive
 * useMemo on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
