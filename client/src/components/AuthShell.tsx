import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Ui';

/** Shared frame for the Login and Sign up pages. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-50">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-100/70" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-coral-100/80" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <Link to="/login" className="mb-8 self-center" aria-label="NUC: Bite On A Budget"><Logo /></Link>
        <div className="card !p-6 sm:!p-8">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          <p className="mb-6 mt-1.5 text-sm text-ink-500">{subtitle}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-ink-500">{footer}</p>
      </div>
    </div>
  );
}
