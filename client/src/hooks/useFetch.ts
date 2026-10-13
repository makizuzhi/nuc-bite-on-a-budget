import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../lib/api';
import { useDataVersion } from './useDataVersion';

export interface FetchState<T> {
  data: T | null;
  loading: boolean; // true only while there is nothing to show yet
  refreshing: boolean; // true while re-loading with old data still on screen
  error: string | null;
  reload: () => void;
}

/**
 * Custom hook: GET `url` through the shared axios instance and track loading / error state.
 * Pass `null` as the url to skip the request. Re-runs when params change or when
 * any mutation elsewhere calls bump().
 */
export function useFetch<T>(url: string | null, params?: Record<string, string | number | undefined>): FetchState<T> {
  const { version } = useDataVersion();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(Boolean(url));
  const [tick, setTick] = useState(0);
  const paramKey = JSON.stringify(params ?? {});

  useEffect(() => {
    if (!url) return undefined;
    const controller = new AbortController();
    setPending(true);
    api
      .get<T>(url, { params: JSON.parse(paramKey), signal: controller.signal })
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => { if (!controller.signal.aborted) setError(getErrorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setPending(false); });
    return () => controller.abort();
  }, [url, paramKey, version, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading: pending && data === null && !error, refreshing: pending && data !== null, error, reload };
}
