import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Async, EmptyState } from '../components/Feedback';
import { TransactionRow } from '../components/TransactionRow';
import { PageHeader } from '../components/Ui';
import { useDebounce } from '../hooks/useDebounce';
import { useDeleteFlow } from '../hooks/useDeleteFlow';
import { useFetch } from '../hooks/useFetch';
import { money } from '../lib/format';
import type { CategoryList, Transaction, TransactionList } from '../lib/types';

const PAGE_SIZE = 10;

export default function Transactions() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(q);
  const cats = useFetch<CategoryList>('/transactions/categories');

  const list = useFetch<TransactionList>('/transactions', {
    q: search || undefined, category: category || undefined, sort, from: from || undefined, to: to || undefined, page, limit: PAGE_SIZE,
  });
  const del = useDeleteFlow<Transaction>({
    path: (t) => `/transactions/${t._id}`,
    title: 'Delete this expense?',
    message: (t) => `"${t.description || t.category}" (${money(t.amount)}) will be removed and your allowance updated. This cannot be undone.`,
    success: 'Expense deleted',
  });

  // Changing any filter jumps back to page 1.
  const filter = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const hasFilters = Boolean(q || category || from || to);
  const clear = () => { setQ(''); setCategory(''); setFrom(''); setTo(''); setSort('newest'); setPage(1); };

  return (
    <div>
      <PageHeader eyebrow="History" title="Transactions" subtitle="Search, filter and sort everything you have logged." />

      <section className="card mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block lg:col-span-2"><span className="label">Search</span>
            <input className="input" type="search" placeholder="e.g. lunch, notebook" value={q} onChange={(e) => filter(setQ)(e.target.value)} />
          </label>
          <label className="block"><span className="label">Category</span>
            <select className="input" value={category} onChange={(e) => filter(setCategory)(e.target.value)}>
              <option value="">All categories</option>
              {(cats.data?.all ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">From</span>
            <input className="input" type="date" value={from} max={to || undefined} onChange={(e) => filter(setFrom)(e.target.value)} />
          </label>
          <label className="block"><span className="label">To</span>
            <input className="input" type="date" value={to} min={from || undefined} onChange={(e) => filter(setTo)(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <label className="block w-full sm:w-56"><span className="label">Sort by</span>
            <select className="input" value={sort} onChange={(e) => filter(setSort)(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>
          </label>
          {hasFilters && <button type="button" className="btn-secondary btn-sm" onClick={clear}>Clear filters</button>}
        </div>
      </section>

      <Async state={list}>
        {(l) => (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[['Matches', String(l.total)], ['Total', money(l.summary.sum)], ['Average', money(l.summary.average)]].map(([label, value]) => (
                <div key={label} className="card !p-4"><p className="text-xs text-ink-500">{label}</p><p className="text-lg font-extrabold sm:text-xl">{value}</p></div>
              ))}
            </div>
            <section className="card">
              {l.data.length === 0 ? (
                <EmptyState title={hasFilters ? 'No transactions match' : 'No transactions yet'}
                  hint={hasFilters ? 'Try a different search or clear the filters.' : 'Use Add Expense in the top menu to log your first expense.'}
                  action={hasFilters ? <button type="button" className="btn-secondary btn-sm" onClick={clear}>Clear filters</button> : undefined} />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {l.data.map((t) => (
                    <TransactionRow key={t._id} tx={t} actions={
                      <span className="flex shrink-0 gap-1">
                        <Link to={`/expenses/${t._id}/edit`} className="btn-secondary btn-sm" aria-label={`Edit ${t.description || t.category}`}>Edit</Link>
                        <button type="button" className="btn-secondary btn-sm text-red-600" onClick={() => del.ask(t)} aria-label={`Delete ${t.description || t.category}`}>Delete</button>
                      </span>
                    } />
                  ))}
                </ul>
              )}
              {l.pages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4 text-sm">
                  <button type="button" className="btn-secondary btn-sm" disabled={l.page <= 1} onClick={() => setPage(l.page - 1)}>Previous</button>
                  <span className="font-semibold text-ink-500">Page {l.page} of {l.pages}</span>
                  <button type="button" className="btn-secondary btn-sm" disabled={l.page >= l.pages} onClick={() => setPage(l.page + 1)}>Next →</button>
                </div>
              )}
            </section>
          </>
        )}
      </Async>
      {del.dialog}
    </div>
  );
}
