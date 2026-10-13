import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { longDate, money, parseKey, toDateInput } from '../lib/format';
import type { CalendarData, DayDetail } from '../lib/types';
import { Async, EmptyState, ErrorBlock, LoadingBlock } from './Feedback';
import { TransactionRow } from './TransactionRow';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (d: Date) => d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

/** Monthly grid with daily spending badges + a "Selected day" panel. */
export function ExpenseCalendar() {
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(() => toDateInput(new Date()));
  const cal = useFetch<CalendarData>('/stats/calendar', { month: monthKey(cursor) });
  const day = useFetch<DayDetail>('/stats/day', { date: selected });

  const move = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  const todayKey = toDateInput(new Date());

  return (
    <section className="card overflow-hidden !p-0 lg:flex">
      <div className="min-w-0 flex-1 p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Expense calendar</h2>
            <p className="text-sm text-ink-500">Daily spending at a glance</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-ink-200 p-1">
            <button type="button" aria-label="Previous month" className="h-9 w-9 rounded-lg hover:bg-ink-100" onClick={() => move(-1)}>‹</button>
            <span className="min-w-[110px] text-center text-xs font-bold">{monthLabel(cursor)}</span>
            <button type="button" aria-label="Next month" className="h-9 w-9 rounded-lg hover:bg-ink-100" onClick={() => move(1)}>›</button>
          </div>
        </div>

        <Async state={cal}>
          {(c) => {
            const byDate = new Map(c.days.map((d) => [d.date, d])); // lookup derived while rendering
            const cells = [...Array(c.firstWeekday).fill(null), ...Array.from({ length: c.daysInMonth }, (_, i) => i + 1)];
            return (
              <>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {WEEKDAYS.map((w) => <div key={w} className="pb-1 text-center text-[10px] font-bold tracking-wider text-ink-400">{w}</div>)}
                  {cells.map((n, i) => {
                    if (n === null) return <div key={`blank-${i}`} />;
                    const key = `${c.month}-${String(n).padStart(2, '0')}`;
                    const info = byDate.get(key);
                    const isSel = key === selected;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelected(key)}
                        aria-pressed={isSel}
                        aria-label={`${key}${info ? `, spent ${money(info.spent)}` : ', no spending'}`}
                        className={`flex min-h-[48px] flex-col items-start justify-between rounded-lg p-1.5 text-left text-[11px] font-semibold transition sm:min-h-[58px] sm:rounded-xl sm:p-2 ${
                          isSel ? 'bg-brand-600 text-white shadow-lift' : 'bg-ink-50 text-ink-700 hover:bg-brand-50'
                        } ${key === todayKey && !isSel ? 'ring-2 ring-brand-300' : ''}`}
                      >
                        <span>{n}</span>
                        {info && info.spent > 0 && (
                          <span className={`text-[9px] font-bold sm:text-[10px] ${isSel ? 'text-white' : 'text-coral-600'}`}>-{money(info.spent)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-ink-500">
                  {c.days.length === 0 ? 'No spending recorded this month.' : `${money(c.totalSpent)} spent this month · highest day ${c.highestDay ? `${longDate(parseKey(c.highestDay.date).toISOString())} (${money(c.highestDay.spent)})` : '—'}`}
                </p>
              </>
            );
          }}
        </Async>
      </div>

      <aside className="border-t border-ink-100 bg-ink-50/60 p-5 sm:p-6 lg:w-80 lg:border-l lg:border-t-0">
        <p className="eyebrow">Selected day</p>
        <h3 className="mb-4 mt-1 text-xl font-extrabold">{longDate(parseKey(selected).toISOString())}</h3>
        {day.loading && <LoadingBlock />}
        {day.error && !day.data && <ErrorBlock message={day.error} onRetry={day.reload} />}
        {day.data && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-3 shadow-card"><p className="text-[11px] text-ink-500">Spent</p><p className="text-lg font-extrabold text-coral-600">{money(day.data.spent)}</p></div>
              <div className="rounded-xl bg-white p-3 shadow-card"><p className="text-[11px] text-ink-500">Saved</p><p className="text-lg font-extrabold text-brand-600">+{money(day.data.saved)}</p></div>
            </div>
            {day.data.transactions.length === 0 ? (
              <div className="mt-4"><EmptyState title="Nothing logged" hint="No spending on this day." /></div>
            ) : (
              <ul className="mt-3 divide-y divide-ink-100">
                {day.data.transactions.map((t) => <TransactionRow key={t._id} tx={t} />)}
              </ul>
            )}
          </>
        )}
      </aside>
    </section>
  );
}
