import { useState } from 'react';
import { Async, EmptyState } from '../components/Feedback';
import { GoalModal, PocketModal, SavingsModal } from '../components/FormModals';
import { PageHeader, ProgressBar } from '../components/Ui';
import { useDeleteFlow } from '../hooks/useDeleteFlow';
import { useFetch } from '../hooks/useFetch';
import { money, shortDate } from '../lib/format';
import type { SavingsData, SavingsEntry, SavingsGoal, Summary } from '../lib/types';

export default function Savings() {
  const savings = useFetch<SavingsData>('/savings');
  const summary = useFetch<Summary>('/stats/summary');
  const [modal, setModal] = useState<'entry' | 'goal' | 'pocket' | SavingsGoal | null>(null);
  const delGoal = useDeleteFlow<SavingsGoal>({
    path: (g) => `/savings/goals/${g._id}`,
    title: 'Delete this goal?',
    message: (g) => `"${g.name}" will be removed. The money you saved stays in your pocket.`,
    success: 'Goal deleted',
  });
  const delEntry = useDeleteFlow<SavingsEntry>({
    path: (e) => `/savings/${e._id}`,
    title: 'Delete this savings entry?',
    message: (e) => `This ${e.kind} of ${money(e.amount)} will be removed and your pocket and allowance will be recalculated.`,
    success: 'Savings entry deleted',
  });

  return (
    <div>
      <PageHeader eyebrow="Savings pocket" title="Savings & goals" subtitle="Set money aside so it does not get spent by accident."
        action={<button type="button" className="btn-primary self-start" onClick={() => setModal('entry')}>Add savings</button>} />

      <Async state={savings}>
        {(s) => (
          <div className="space-y-6">
            <section className="card flex items-center justify-between gap-4">
              <div><p className="text-sm font-semibold text-ink-500">In your pocket</p><p className="text-4xl font-extrabold text-brand-600">{money(s.pocket)}</p></div>
              <button type="button" className="btn-soft btn-sm" onClick={() => setModal('pocket')} disabled={!summary.data}>Edit amount</button>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-extrabold">Goals</h2>
                <button type="button" className="btn-soft btn-sm" onClick={() => setModal('goal')}>New goal</button>
              </div>
              {s.goals.length === 0 ? (
                <EmptyState title="No goals yet" hint="Give your savings a purpose, like a laptop or an emergency fund." action={<button type="button" className="btn-primary btn-sm" onClick={() => setModal('goal')}>Create a goal</button>} />
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {s.goals.map((g) => (
                    <li key={g._id} className="card">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-extrabold">{g.name}</p>
                          <p className="text-xs text-ink-500">Target {money(g.targetAmount)}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${g.status === 'achieved' ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500'}`}>{g.status === 'achieved' ? 'Achieved' : 'In progress'}</span>
                      </div>
                      <p className="mt-4 text-2xl font-extrabold">{money(g.saved)} <span className="text-sm font-semibold text-ink-400">saved</span></p>
                      <div className="mt-2"><ProgressBar percent={g.percent} label={`${g.name} progress`} /></div>
                      <p className="mt-2 text-xs text-ink-500">{Math.round(g.percent)}% · {g.left > 0 ? `${money(g.left)} to go` : 'Goal reached'}</p>
                      <div className="mt-4 flex justify-end gap-2">
                        <button type="button" className="btn-secondary btn-sm" onClick={() => setModal(g)}>Edit</button>
                        <button type="button" className="btn-secondary btn-sm text-red-600" onClick={() => delGoal.ask(g)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2 className="mb-1 text-xl font-extrabold">History</h2>
              <p className="mb-3 text-sm text-ink-500">Every deposit and withdrawal</p>
              {s.entries.length === 0 ? (
                <EmptyState title="Nothing saved yet" hint="Your deposits and withdrawals will be listed here." />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {s.entries.map((e) => (
                    <li key={e._id} className="flex items-center gap-3 py-3.5">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${e.kind === 'deposit' ? 'bg-brand-50 text-brand-600' : 'bg-coral-100 text-coral-600'}`} aria-hidden>{e.kind === 'deposit' ? '+' : '-'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{e.note || (e.kind === 'deposit' ? 'Deposit' : 'Withdrawal')}</p>
                        <p className="text-xs text-ink-500">{shortDate(e.savedAt)}{e.goal ? ` · ${s.goals.find((g) => g._id === e.goal)?.name ?? 'Goal'}` : ''}</p>
                      </div>
                      <p className={`font-bold ${e.kind === 'deposit' ? 'text-brand-600' : 'text-coral-600'}`}>{e.kind === 'deposit' ? '+' : '-'} {money(e.amount)}</p>
                      <button type="button" className="btn-secondary btn-sm text-red-600" onClick={() => delEntry.ask(e)} aria-label="Delete entry">Delete</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {modal === 'entry' && <SavingsModal goals={s.goals} pocket={s.pocket} onClose={() => setModal(null)} />}
            {modal === 'pocket' && summary.data && <PocketModal pocket={s.pocket} remaining={summary.data.remaining} onClose={() => setModal(null)} />}
            {modal === 'goal' && <GoalModal onClose={() => setModal(null)} />}
            {modal && typeof modal === 'object' && <GoalModal goal={modal} onClose={() => setModal(null)} />}
          </div>
        )}
      </Async>
      {delGoal.dialog}
      {delEntry.dialog}
    </div>
  );
}
