import { useState } from 'react';
import { ConfirmDialog } from '../components/Modal';
import { Async, EmptyState } from '../components/Feedback';
import { WheelItemModal } from '../components/FormModals';
import { PageHeader } from '../components/Ui';
import { useDataVersion } from '../hooks/useDataVersion';
import { useDebounce } from '../hooks/useDebounce';
import { useDeleteFlow } from '../hooks/useDeleteFlow';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import { api, getErrorMessage } from '../lib/api';
import { money } from '../lib/format';
import { ALL_STALLS, STALL_FILTERS } from '../lib/stalls';
import type { WheelItem, WheelList } from '../lib/types';

/** "My Wheel": add, edit and remove the foods the randomizer can land on. */
export default function Wheel() {
  const toast = useToast();
  const { bump } = useDataVersion();
  const [q, setQ] = useState('');
  const [stall, setStall] = useState<string>(ALL_STALLS);
  const search = useDebounce(q);
  const items = useFetch<WheelList>('/wheel', { q: search || undefined, stall });
  const [editing, setEditing] = useState<WheelItem | 'new' | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const del = useDeleteFlow<WheelItem>({
    path: (m) => `/wheel/${m._id}`,
    title: 'Remove this food?',
    message: (m) => `"${m.name}" from ${m.stall} will no longer appear on your food wheel.`,
    success: 'Removed from your wheel',
  });

  const reset = async () => {
    setBusy(true);
    try {
      await api.post('/wheel/reset');
      toast.success('Wheel reset to the default stall menus');
      bump();
      setConfirmReset(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Food wheel" title="My Wheel" subtitle="The foods the randomizer can pick from. Add your own, change prices, or remove what you do not like."
        action={(
          <div className="flex flex-wrap gap-2 self-start">
            <button type="button" className="btn-secondary" onClick={() => setConfirmReset(true)}>Reset to defaults</button>
            <button type="button" className="btn-primary" onClick={() => setEditing('new')}>Add food</button>
          </div>
        )} />

      <section className="card mb-6 grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">Search</span>
          <input className="input" type="search" placeholder="Search foods" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="block"><span className="label">Stall</span>
          <select className="input" value={stall} onChange={(e) => setStall(e.target.value)}>
            {STALL_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </section>

      <Async state={items}>
        {(m) => (m.data.length === 0 ? (
          <EmptyState title="No foods found" hint="Try another search or stall, or add a food of your own." action={<button type="button" className="btn-primary btn-sm" onClick={() => setEditing('new')}>Add food</button>} />
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-500">{m.total} item{m.total === 1 ? '' : 's'} on your wheel, cheapest first</p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {m.data.map((item) => (
                <li key={item._id} className="card flex flex-col gap-3 !p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{item.name}</p>
                      <p className="truncate text-xs text-ink-500">{item.stall}</p>
                    </div>
                    <p className="font-extrabold text-brand-600">{money(item.price)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.isCustom ? 'bg-coral-100 text-coral-600' : 'bg-ink-100 text-ink-500'}`}>{item.isCustom ? 'Added by you' : 'From stall menu'}</span>
                    <span className="flex gap-1">
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`}>Edit</button>
                      <button type="button" className="btn-secondary btn-sm text-red-600" onClick={() => del.ask(item)} aria-label={`Remove ${item.name}`}>Remove</button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ))}
      </Async>

      {editing && <WheelItemModal item={editing === 'new' ? undefined : editing} defaultStall={stall} onClose={() => setEditing(null)} />}
      {confirmReset && (
        <ConfirmDialog title="Reset your wheel?" message="Every item you added or edited will be replaced by the original stall menus." busy={busy} onConfirm={reset} onCancel={() => setConfirmReset(false)} />
      )}
      {del.dialog}
    </div>
  );
}
