import type { ReactNode } from 'react';
import type { FetchState } from '../hooks/useFetch';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-brand-600 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center gap-3 text-sm font-medium text-ink-500" role="status">
      <Spinner /> {label}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl bg-red-50 p-5 text-center" role="alert">
      <p className="text-sm font-semibold text-red-700">{message}</p>
      {onRetry && <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-200 px-4 py-10 text-center">
      <span className="h-1.5 w-10 rounded-full bg-coral-500" aria-hidden />
      <p className="mt-1 font-bold text-ink-900">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-500">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Shows loading / error UI for a fetch, otherwise hands the data to its children. */
export function Async<T>({ state, children }: { state: FetchState<T>; children: (data: T) => ReactNode }) {
  if (state.loading) return <LoadingBlock />;
  if (state.error && !state.data) return <ErrorBlock message={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  return <>{children(state.data)}</>;
}
