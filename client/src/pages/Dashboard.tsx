import { useState } from 'react';
import { DonutChart } from '../components/DonutChart';
import { ExpenseCalendar } from '../components/ExpenseCalendar';
import { Async, EmptyState } from '../components/Feedback';
import { BalanceModal, PocketModal } from '../components/FormModals';
import { TransactionRow } from '../components/TransactionRow';
import { ProgressBar } from '../components/Ui';
import { useFetch } from '../hooks/useFetch';
import { money } from '../lib/format';
import type { CategoryTotals, Summary, TransactionList, User } from '../lib/types';

const greeting = (hour: number) => (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

// Every number on this page comes from GET /stats/summary. Any create / edit / delete elsewhere calls bump()
// (see hooks/useDataVersion), so the amounts and progress bars re-render in real time without a page refresh.
export default function Dashboard() {
  const user = useFetch<User>('/users/me');
  const summary = useFetch<Summary>('/stats/summary');
  const cats = useFetch<CategoryTotals>('/stats/categories');
  const recent = useFetch<TransactionList>('/transactions', { limit: 4 });
  const [modal, setModal] = useState<'balance' | 'pocket' | null>(null);

  const now = new Date();
  const firstName = user.data?.fullName.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">{now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-3xl font-extrabold text-brand-800 sm:text-4xl">{greeting(now.getHours())}, {firstName}</h1>
        <p className="mt-1.5 text-ink-500">Here is how your allowance is looking today.</p>
      </div>

      {/* Allowance banner */}
      <Async state={summary}>
        {(s) => {
          const percentUsed = s.totalBudget > 0 ? Math.min((s.spent / s.totalBudget) * 100, 100) : 0;
          const cycleMonth = new Date(s.cycle.start).toLocaleDateString('en-PH', { month: 'long' });
          return (
            <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-lift sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-coral-500/15" aria-hidden />
              <div className="relative grid gap-8 lg:grid-cols-2 lg:items-end">
                <div>
                  <p className="text-sm font-semibold text-coral-400">Total remaining allowance</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <p className="text-5xl font-extrabold sm:text-6xl">{money(s.remaining)}</p>
                    <button type="button" className="btn btn-sm border border-coral-400/60 bg-coral-500 text-brand-900 hover:bg-coral-400" onClick={() => setModal('balance')}>Set balance</button>
                  </div>
                  <p className="mt-2 text-xs text-brand-200">Total allowance this cycle: {money(s.totalBudget)}</p>
                  <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-xs text-brand-200">Daily budget</p>
                      <p className="text-lg font-bold">{money(s.dailyBudget)}</p>
                      <p className="text-[11px] text-brand-300">Plan: {money(s.baseDaily)} per day</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-200">Weekly budget</p>
                      <p className="text-lg font-bold">{money(s.weeklyBudget)}</p>
                      <p className="text-[11px] text-brand-300">Plan: {money(s.baseWeekly)} per week</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs font-semibold text-brand-200">
                    <span>{cycleMonth} allowance - day {s.cycle.dayNumber} of {s.cycle.length}</span>
                    <span>{Math.round(100 - percentUsed)}% remaining</span>
                  </div>
                  <ProgressBar percent={percentUsed} color="#e8b923" track="bg-white/20" label="Allowance used" />
                  <p className="mt-2 text-right text-xs text-brand-200">{money(s.spent)} spent of {money(s.totalBudget)}</p>
                  <p className="mt-3 text-xs text-brand-300">Daily and weekly budgets spread your remaining {money(s.remaining)} over the {s.cycle.daysLeft} day{s.cycle.daysLeft === 1 ? '' : 's'} left in this cycle.</p>
                </div>
              </div>
            </section>
          );
        }}
      </Async>

      {/* Savings pocket */}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-brand-800">Savings pocket</h2>
            <p className="text-xs text-ink-500">Keep savings separate from spending money. Editing it updates your remaining allowance.</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-extrabold text-brand-600">{summary.data ? money(summary.data.savingsPocket) : '...'}</p>
            <button type="button" className="btn-soft btn-sm" onClick={() => setModal('pocket')} disabled={!summary.data}>Edit amount</button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-xl font-extrabold text-brand-800">Spending overview</h2>
          <p className="mb-5 text-sm text-ink-500">This allowance cycle</p>
          <Async state={cats}>
            {(c) => (c.total === 0
              ? <EmptyState title="No spending yet" hint="Log your first expense from the Add Expense page to see where your money goes." />
              : <DonutChart data={c} />)}
          </Async>
        </section>

        <section className="card">
          <h2 className="text-xl font-extrabold text-brand-800">Recent transactions</h2>
          <p className="mb-3 text-sm text-ink-500">Your latest activity</p>
          <Async state={recent}>
            {(r) => (r.data.length === 0
              ? <EmptyState title="No transactions yet" hint="Expenses you add will show up here." />
              : <ul className="divide-y divide-ink-100">{r.data.map((t) => <TransactionRow key={t._id} tx={t} />)}</ul>)}
          </Async>
        </section>
      </div>

      <ExpenseCalendar />

      {modal === 'balance' && summary.data && <BalanceModal allowance={summary.data.allowance} remaining={summary.data.remaining} onClose={() => setModal(null)} />}
      {modal === 'pocket' && summary.data && <PocketModal pocket={summary.data.savingsPocket} remaining={summary.data.remaining} onClose={() => setModal(null)} />}
    </div>
  );
}
