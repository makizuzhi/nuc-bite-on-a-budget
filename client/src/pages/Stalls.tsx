import { useState } from 'react';
import { Async, EmptyState } from '../components/Feedback';
import { PageHeader } from '../components/Ui';
import { useDataVersion } from '../hooks/useDataVersion';
import { useDebounce } from '../hooks/useDebounce';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import { api, getErrorMessage } from '../lib/api';
import { money } from '../lib/format';
import type { FoodStall, StallList } from '../lib/types';

/** Browse the 11 campus food stalls and put any menu item on your Food Wheel. */
export default function Stalls() {
  const toast = useToast();
  const { bump } = useDataVersion();
  const [q, setQ] = useState('');
  const [budget, setBudget] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const search = useDebounce(q);
  const maxBudget = useDebounce(budget);
  const validBudget = Number(maxBudget) > 0 ? Number(maxBudget) : undefined;
  const stalls = useFetch<StallList>('/stalls', { q: search || undefined, maxBudget: validBudget });

  const addToWheel = async (stall: FoodStall, itemId: string, name: string) => {
    try {
      await api.post(`/stalls/${stall._id}/menu/${itemId}/wheel`);
      toast.success(`${name} added to your wheel`);
      bump();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Campus food" title="Food stalls" subtitle="Eleven campus and local stalls with sample menus and student-friendly prices." />

      <section className="card mb-6 grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">Search stalls or dishes</span>
          <input className="input" type="search" placeholder="e.g. siomai, coffee, Lola Ines" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="block"><span className="label">Show dishes up to (PHP)</span>
          <input className="input" type="number" inputMode="decimal" placeholder="No limit" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </label>
      </section>

      <Async state={stalls}>
        {(s) => (s.data.length === 0 ? (
          <EmptyState title="No stalls match" hint="Try a different search or a higher price limit." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {s.data.map((stall) => {
              const expanded = open === stall._id;
              return (
                <li key={stall._id} className="card flex flex-col !p-0">
                  <div className="flex items-start justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <p className="eyebrow">{stall.specialty}</p>
                      <h2 className="text-lg font-extrabold text-brand-800">{stall.name}</h2>
                      <p className="mt-1 text-sm text-ink-500">{stall.description}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-ink-500">
                      <p className="font-bold text-brand-700">{stall.itemCount} dishes</p>
                      {stall.cheapest !== null && <p>{money(stall.cheapest)} - {money(stall.priciest ?? 0)}</p>}
                    </div>
                  </div>
                  <button type="button" className="border-t border-ink-100 px-5 py-3 text-left text-sm font-bold text-brand-600 hover:bg-ink-50" aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : stall._id)}>{expanded ? 'Hide menu' : 'View menu'}</button>
                  {expanded && (
                    <ul className="divide-y divide-ink-100 border-t border-ink-100">
                      {stall.menu.map((item) => (
                        <li key={item._id} className="flex items-center gap-3 px-5 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{item.name}</p>
                            <p className="truncate text-xs text-ink-500">{item.description}</p>
                          </div>
                          <p className="shrink-0 text-sm font-extrabold text-brand-600">{money(item.price)}</p>
                          <button type="button" className="btn-soft btn-sm shrink-0" onClick={() => addToWheel(stall, item._id, item.name)}>Add to wheel</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        ))}
      </Async>
    </div>
  );
}
