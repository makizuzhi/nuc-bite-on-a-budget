import { useState } from 'react';
import { Async } from '../components/Feedback';
import { ProfileModal } from '../components/FormModals';
import { Avatar, ProgressBar } from '../components/Ui';
import { useFetch } from '../hooks/useFetch';
import { initials, money, shortDate } from '../lib/format';
import type { ProfileStats, User, WeeklySummary } from '../lib/types';

const STATUS_STYLE = {
  'On Track': 'bg-brand-50 text-brand-700',
  'Watch Out': 'bg-sun-100 text-amber-800',
  'Over Budget': 'bg-red-50 text-red-700',
} as const;
const STATUS_BAR = { 'On Track': '#12356f', 'Watch Out': '#d4a017', 'Over Budget': '#dc2626' } as const;

export default function Profile() {
  const user = useFetch<User>('/users/me');
  const stats = useFetch<ProfileStats>('/stats/profile');
  const weekly = useFetch<WeeklySummary>('/stats/weekly');
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-6">
      <Async state={user}>
        {(u) => (
          <>
            <section className="card flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <Avatar text={initials(u.fullName)} size="xl" />
                <div className="min-w-0">
                  <p className="eyebrow">Student profile</p>
                  <h1 className="truncate text-3xl font-extrabold">{u.fullName}</h1>
                  <p className="truncate text-sm text-ink-500">{u.email}</p>
                </div>
              </div>
              <button type="button" className="btn-primary self-start sm:self-auto" onClick={() => setEditing(true)}>Edit profile</button>
            </section>

            <Async state={stats}>
              {(s) => (
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Meals logged from the wheel" value={String(s.mealsLogged)} />
                  <StatCard label="Saved this month" value={money(s.savedThisMonth)} />
                  <Async state={weekly}>{(w) => <StatCard label="Budget streak" value={`${w.streakWeeks} week${w.streakWeeks === 1 ? '' : 's'}`} />}</Async>
                </div>
              )}
            </Async>

            <section className="card">
              <h2 className="text-xl font-extrabold">Personal preferences</h2>
              <p className="mb-5 text-sm text-ink-500">Your account defaults. Use Edit profile above to change them.</p>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Full name', u.fullName], ['Student email', u.email], ['Status', u.role],
                  ['Program', u.program || 'Not set'], ['Student number', u.studentNumber || 'Not set'],
                  ['Allowance', money(u.allowance)], ['Cycle length', `${u.cycleLengthDays} days`],
                  ['Default max budget', money(u.preferences.defaultMaxBudget)], ['Default food stall', u.preferences.defaultStall],
                  ['Low allowance alert', `${u.preferences.lowAllowanceAlertPercent ?? 20}% remaining`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-ink-50 px-4 py-3"><dt className="text-xs text-ink-500">{k}</dt><dd className="truncate font-semibold">{v}</dd></div>
                ))}
              </dl>
            </section>
            {editing && <ProfileModal user={u} onClose={() => setEditing(false)} />}
          </>
        )}
      </Async>

      <Async state={weekly}>
        {(w) => (
          <section className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{shortDate(w.from)} - {shortDate(w.to)}</p>
                <h2 className="text-xl font-extrabold">Weekly summary</h2>
                <p className="text-sm text-ink-500">A clear view of this week&apos;s budget progress</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${STATUS_STYLE[w.status]}`}>{w.status}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-ink-50 p-4"><p className="text-xs text-ink-500">Total spent</p><p className="text-xl font-extrabold">{money(w.totalSpent)}</p></div>
              <div className="rounded-xl bg-ink-50 p-4"><p className="text-xs text-ink-500">Weekly target</p><p className="text-xl font-extrabold">{money(w.weeklyTarget)}</p></div>
            </div>
            <div className="mt-4"><ProgressBar percent={w.percentOfTarget} color={STATUS_BAR[w.status]} label="Share of weekly target spent" /></div>
            <p className="mt-2 text-xs text-ink-500">{Math.round(w.percentOfTarget)}% of your weekly target</p>
            <div className="mt-5 border-t border-ink-100 pt-4">
              <p className="mb-3 text-sm font-bold">Spending this week</p>
              {w.byCategory.length === 0 ? <p className="text-sm text-ink-500">No spending recorded this week.</p> : (
                <ul className="flex flex-wrap gap-2">
                  {w.byCategory.map((c) => (
                    <li key={c.category} className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-700">
                      {c.category} <span className="font-extrabold">{money(c.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </Async>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card flex items-center gap-4 !p-5">
      <span className="h-12 w-1.5 rounded-full bg-coral-500" aria-hidden />
      <div><p className="text-xs text-ink-500">{label}</p><p className="text-2xl font-extrabold text-brand-800">{value}</p></div>
    </div>
  );
}
