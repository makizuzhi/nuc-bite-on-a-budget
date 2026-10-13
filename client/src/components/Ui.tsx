import type { ReactNode } from 'react';
import { categoryStyle } from '../lib/categories';
import type { Category } from '../lib/types';

export function Logo({ size = 'md', tone = 'dark' }: { size?: 'md' | 'lg'; tone?: 'dark' | 'light' }) {
  const box = size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm';
  const light = tone === 'light';
  return (
    <span className="flex items-center gap-3">
      <span className={`${box} flex items-center justify-center rounded-xl bg-coral-500 font-extrabold tracking-tight text-brand-900 shadow-lift`} aria-hidden>NUC</span>
      <span className="leading-tight">
        <span className={`block text-[15px] font-extrabold ${light ? 'text-white' : 'text-brand-800'}`}>NUC: Bite On A Budget</span>
        <span className={`block text-[9px] font-bold uppercase tracking-[0.2em] ${light ? 'text-coral-400' : 'text-ink-500'}`}>Student food and allowance planner</span>
      </span>
    </span>
  );
}

export function Avatar({ text, size = 'md' }: { text: string; size?: 'md' | 'xl' }) {
  const cls = size === 'xl' ? 'h-20 w-20 rounded-2xl bg-brand-700 text-2xl text-coral-400' : 'h-10 w-10 rounded-full bg-coral-500 text-sm text-brand-900';
  return <span className={`${cls} flex shrink-0 items-center justify-center font-extrabold`}>{text}</span>;
}

/** A small coloured badge showing the first letter of the category (works for custom categories too). */
export function CategoryIcon({ category, size = 'md' }: { category: Category; size?: 'sm' | 'md' }) {
  const s = categoryStyle(category);
  const box = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm';
  return <span className={`${box} ${s.soft} ${s.text} flex shrink-0 items-center justify-center rounded-xl font-extrabold uppercase`} aria-hidden>{category.slice(0, 1)}</span>;
}

export function ProgressBar({ percent, color = '#12356f', track = 'bg-ink-100', label }: { percent: number; color?: string; track?: string; label: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full ${track}`} role="progressbar" aria-label={label} aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, error, optional, children }: { label: string; error?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="label">{label}{optional && <span className="font-normal text-ink-400"> (optional)</span>}</span>
        {children}
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{message}</p>;
}
