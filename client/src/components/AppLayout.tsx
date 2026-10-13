import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useDataVersion } from '../hooks/useDataVersion';
import { whenLabel, initials } from '../lib/format';
import type { AppNotification, NotificationList, User } from '../lib/types';
import { Avatar, Logo } from './Ui';

// Every main page is always one click away: the bar is persistent (no hamburger menu). On narrow
// screens the same bar scrolls sideways instead of collapsing.
const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/expenses/new', label: 'Add Expense' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/savings', label: 'Savings' },
  { to: '/stalls', label: 'Food Stalls' },
  { to: '/randomizer', label: 'Randomizer' },
  { to: '/wheel', label: 'My Wheel' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative shrink-0 whitespace-nowrap px-3 py-3.5 text-sm font-semibold transition ${
    isActive ? 'text-coral-400 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-coral-400' : 'text-brand-200 hover:text-white'}`;

/** Closes a dropdown when the user clicks outside of it. */
function useOutsideClose<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);
  return ref;
}

export const NOTE_LABEL: Record<string, string> = {
  budget_alert: 'Budget',
  low_allowance: 'Allowance',
  daily_budget: 'Daily',
  savings: 'Savings',
  weekly_summary: 'Weekly',
  system: 'System',
};

function Bell() {
  const [open, setOpen] = useState(false);
  const { bump } = useDataVersion();
  const notes = useFetch<NotificationList>('/notifications');
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));
  const unread = notes.data?.unread ?? 0; // derived from the list, never stored

  const markAll = async () => { await api.patch('/notifications/read-all'); bump(); };
  const markOne = async (n: AppNotification) => { if (!n.isRead) { await api.patch(`/notifications/${n._id}/read`); bump(); } };

  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Zm4 10a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-extrabold text-brand-900">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-ink-200 bg-white p-4 text-ink-900 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">Notifications</p>
            {unread > 0 && <span className="rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-bold text-coral-600">{unread} NEW</span>}
          </div>
          {notes.loading && <p className="py-4 text-sm text-ink-500">Loading...</p>}
          {notes.error && !notes.data && <p className="py-4 text-sm text-red-600">{notes.error}</p>}
          {notes.data && notes.data.data.length === 0 && <p className="py-4 text-sm text-ink-500">You are all caught up.</p>}
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {notes.data?.data.slice(0, 6).map((n) => (
              <li key={n._id}>
                <button type="button" onClick={() => markOne(n)} className="flex w-full gap-3 rounded-xl p-2 text-left hover:bg-ink-50">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-ink-200' : 'bg-coral-500'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    <span className="block text-xs text-ink-500">{n.message}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-400">{NOTE_LABEL[n.type] ?? 'Update'} - {whenLabel(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 text-xs font-bold text-brand-600">
            <button type="button" onClick={markAll} disabled={unread === 0} className="disabled:text-ink-400">Mark all read</button>
            <Link to="/notifications" onClick={() => setOpen(false)}>View all</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: user } = useFetch<User>('/users/me');
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));
  const name = user?.fullName ?? 'Student';
  const short = user ? `${user.fullName.split(' ')[0]} ${user.fullName.split(' ')[1]?.[0] ?? ''}.`.trim() : '...';

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 rounded-xl p-1 pr-2 hover:bg-white/10" aria-haspopup="menu" aria-expanded={open}>
        <Avatar text={initials(name)} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-bold text-white">{short}</span>
          <span className="block text-xs text-brand-200">{user?.role ?? 'Student'}</span>
        </span>
        <svg viewBox="0 0 20 20" className="hidden h-4 w-4 text-brand-200 sm:block" fill="currentColor" aria-hidden><path d="M5.5 7.5 10 12l4.5-4.5z" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-40 w-56 rounded-2xl border border-ink-200 bg-white p-2 text-ink-900 shadow-card" role="menu">
          <div className="border-b border-ink-100 px-3 pb-2 pt-1">
            <p className="truncate text-sm font-bold">{user?.fullName ?? 'Student'}</p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)} className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50">My profile</Link>
          <Link to="/notifications" role="menuitem" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50">Notifications</Link>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); logout(); navigate('/login'); }}
            className="mt-1 block w-full rounded-xl border-t border-ink-100 px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50">Log out</button>
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-brand-800 shadow-lift">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Link to="/dashboard" aria-label="NUC: Bite On A Budget home"><Logo tone="light" /></Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Bell />
            <ProfileMenu />
          </div>
        </div>
        <nav className="border-t border-white/10 bg-brand-900/60" aria-label="Main">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-2 sm:px-5">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} className={linkClass}>{n.label}</NavLink>)}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-ink-200/70 py-6 text-center text-xs text-ink-500">NUC: Bite On A Budget - student project</footer>
    </div>
  );
}
