import { useState } from 'react';
import { Async, EmptyState } from '../components/Feedback';
import { BudgetModal } from '../components/FormModals';
import { CategoryIcon, PageHeader, ProgressBar } from '../components/Ui';
import { useDeleteFlow } from '../hooks/useDeleteFlow';
import { useFetch } from '../hooks/useFetch';
import { money } from '../lib/format';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import type { Budget, BudgetList, CategoryList } from '../lib/types';

const STATUS = {
  ok: { label: 'On track', badge: 'bg-brand-50 text-brand-700', bar: '#12356f' },
  warning: { label: 'Almost used', badge: 'bg-sun-100 text-amber-800', bar: '#d4a017' },
  over: { label: 'Over limit', badge: 'bg-red-50 text-red-700', bar: '#dc2626' },
} as const;

export default function Budgets() {
  const budgets = useFetch<BudgetList>('/budgets');
  const cats = useFetch<CategoryList>('/transactions/categories');
  const [editing, setEditing] = useState<Budget | 'new' | null>(null);
  const del = useDeleteFlow<Budget>({
    path: (b) => `/budgets/${b._id}`,
    title: 'Delete this budget?',
    message: (b) => `Your ${b.category} limit of ${money(b.limit)} will be removed. Your expenses are not affected.`,
    success: 'Budget deleted',
  });

  return (
    <div>
      <PageHeader eyebrow="Spending limits" title="Category budgets" subtitle="Set a limit per category and get a heads-up before you run out."
        action={<button type="button" className="btn-primary self-start" onClick={() => setEditing('new')}>Set a budget</button>} />

      <Async state={budgets}>
        {(b) => (
          <>
            {b.alerts.length > 0 && (
              <div className="mb-6 rounded-2xl bg-sun-100 p-4 text-sm text-amber-900" role="status">
                <p className="font-bold">Low-budget alert</p>
                <ul className="mt-1 list-inside list-disc">
                  {b.alerts.map((a) => <li key={a._id}>{a.category}: {money(a.spent)} of {money(a.limit)} used ({Math.round(a.percentUsed)}%)</li>)}
                </ul>
              </div>
            )}
            {b.data.length === 0 ? (
              <EmptyState title="No budgets yet" hint="Pick a category and a monthly limit to start." action={<button type="button" className="btn-primary btn-sm" onClick={() => setEditing('new')}>Set a budget</button>} />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {b.data.map((x) => {
                  const s = STATUS[x.status];
                  return (
                    <li key={x._id} className="card">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={x.category} />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold">{x.category}</p>
                          <p className="text-xs text-ink-500">Alert at {Math.round(x.alertThreshold * 100)}%</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${s.badge}`}>{s.label}</span>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <p className="text-2xl font-extrabold">{money(x.spent)} <span className="text-sm font-semibold text-ink-400">of {money(x.limit)}</span></p>
                        <p className="text-xs font-semibold text-ink-500">{x.remaining >= 0 ? `${money(x.remaining)} left` : `${money(-x.remaining)} over`}</p>
                      </div>
                      <div className="mt-3"><ProgressBar percent={x.percentUsed} color={s.bar} label={`${x.category} budget used`} /></div>
                      <div className="mt-4 flex justify-end gap-2">
                        <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(x)}>Edit</button>
                        <button type="button" className="btn-secondary btn-sm text-red-600" onClick={() => del.ask(x)}>Delete</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {editing && <BudgetModal budget={editing === 'new' ? undefined : editing} suggestions={(cats.data?.all ?? [...DEFAULT_CATEGORIES]).filter((c) => !b.data.some((x) => x.category === c))} onClose={() => setEditing(null)} />}
          </>
        )}
      </Async>
      {del.dialog}
    </div>
  );
}
