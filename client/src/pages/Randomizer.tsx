import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FoodWheel } from '../components/FoodWheel';
import { Modal } from '../components/Modal';
import { FormError } from '../components/Ui';
import { useDataVersion } from '../hooks/useDataVersion';
import { useDebounce } from '../hooks/useDebounce';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import { api, getErrorMessage } from '../lib/api';
import { money } from '../lib/format';
import { STALL_FILTERS } from '../lib/stalls';
import type { SpinResult, Summary, User, WheelItem, WheelList } from '../lib/types';
import { spinSchema, type SpinForm } from '../schemas';

const MAX_SLICES = 10;
const SPIN_MS = 4300;

/** Pick up to MAX_SLICES items spread evenly across the price range. */
const sample = (items: WheelItem[]) => {
  if (items.length <= MAX_SLICES) return items;
  const stride = items.length / MAX_SLICES;
  return Array.from({ length: MAX_SLICES }, (_, i) => items[Math.floor(i * stride)]);
};

export default function Randomizer() {
  const toast = useToast();
  const { bump } = useDataVersion();
  const me = useFetch<User>('/users/me');
  const summary = useFetch<Summary>('/stats/summary');

  const spinForm = useForm<SpinForm>({
    resolver: zodResolver(spinSchema),
    defaultValues: { maxBudget: 150, stall: 'All stalls' },
    values: me.data ? { maxBudget: me.data.preferences.defaultMaxBudget, stall: me.data.preferences.defaultStall } : undefined,
  });
  const maxBudget = spinForm.watch('maxBudget');
  const stall = spinForm.watch('stall');
  const debouncedBudget = useDebounce(maxBudget);
  const validBudget = Number.isFinite(debouncedBudget) && debouncedBudget > 0;

  // Items on YOUR wheel that currently fit the filters (the server applies the same rules as the spin).
  const fits = useFetch<WheelList>(validBudget ? '/wheel' : null, { maxBudget: validBudget ? debouncedBudget : undefined, stall });

  const [wheelOverride, setWheelOverride] = useState<WheelItem[] | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);

  const eligible = fits.data?.data ?? [];
  const slices = wheelOverride ?? sample(eligible); // derived while rendering
  const remaining = summary.data?.remaining;

  const onSpin = spinForm.handleSubmit(async (values) => {
    setSpinError(null);
    setWheelOverride(null);
    try {
      const { data } = await api.post<SpinResult>('/wheel/spin', values);
      // Make sure the winning item is on the wheel (it may not be in the sampled slices).
      const base = sample(eligible);
      const shown = base.some((m) => m._id === data.item._id) ? base : [...base.slice(0, -1), data.item];
      const index = shown.findIndex((m) => m._id === data.item._id);
      const step = 360 / shown.length;
      const target = (360 - (index + 0.5) * step) % 360;
      const delta = (target - (rotation % 360) + 360) % 360;
      setWheelOverride(shown);
      setSpinning(true);
      setRotation(rotation + 360 * 5 + delta);
      setTimeout(() => { setSpinning(false); setResult(data); }, SPIN_MS);
    } catch (err) {
      setSpinError(getErrorMessage(err));
    }
  });

  const acceptMeal = async () => {
    if (!result) return;
    setLogging(true);
    try {
      await api.post(`/wheel/${result.item._id}/log`);
      toast.success(`${result.item.name} logged as an expense`);
      bump();
      setResult(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <p className="eyebrow mb-2">Craving randomizer</p>
        <h1 className="text-3xl font-extrabold text-brand-800 sm:text-4xl">What are you craving?</h1>
        <p className="mt-2 text-ink-500">Pick a campus stall and a budget, then let the wheel choose an affordable meal.</p>
      </div>

      <section className="card space-y-6">
        <FoodWheel meals={slices} rotation={rotation} spinning={spinning} />

        <form onSubmit={onSpin} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block"><span className="label">Max budget (PHP)</span>
                <input type="number" inputMode="decimal" className={`input ${spinForm.formState.errors.maxBudget ? 'input-error' : ''}`} {...spinForm.register('maxBudget', { valueAsNumber: true })} />
              </label>
              {spinForm.formState.errors.maxBudget && <p className="field-error" role="alert">{spinForm.formState.errors.maxBudget.message}</p>}
            </div>
            <label className="block"><span className="label">Food stall</span>
              <select className="input" {...spinForm.register('stall')}>
                {STALL_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <p className="rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-500">
            {fits.error ? fits.error
              : fits.loading ? 'Checking which foods fit...'
              : validBudget ? `${eligible.length} item${eligible.length === 1 ? '' : 's'} on your wheel fit ${stall === 'All stalls' ? 'any stall' : stall} within ${money(debouncedBudget)}. Add, edit or remove items on the My Wheel page.`
              : 'Enter a max budget to see which foods fit.'}
          </p>

          <FormError message={spinError} />
          {!fits.loading && validBudget && eligible.length === 0 && !spinError && (
            <p className="rounded-xl bg-sun-100 px-4 py-3 text-sm font-semibold text-amber-800" role="status">Nothing fits this budget yet. Raise the max budget, pick another stall, or add a cheaper food to your wheel.</p>
          )}

          <button type="submit" className="btn-accent w-full" disabled={spinning || spinForm.formState.isSubmitting}>
            {spinning ? 'Spinning...' : 'Spin the wheel'}
          </button>
          <p className="text-center text-xs text-ink-500">Available allowance: {remaining !== undefined ? money(remaining) : '...'}</p>
        </form>
      </section>

      {result && (
        <Modal title="Your meal is" onClose={() => setResult(null)}>
          <div className="text-center">
            <p className="eyebrow">{result.item.stall}</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-800">{result.item.name}</p>
            <p className="mt-1 text-xl font-bold text-coral-600">{money(result.item.price)}</p>
            <p className="mt-3 text-sm text-ink-500">
              {money(result.underBudgetBy)} under your {money(result.maxBudget)} budget - you would have {money(result.remainingAfter)} left
            </p>
            <p className="mt-1 text-xs text-ink-400">Picked from {result.candidates} matching item{result.candidates === 1 ? '' : 's'}</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" className="btn-secondary" onClick={() => setResult(null)} disabled={logging}>Try again</button>
            <button type="button" className="btn-primary" onClick={acceptMeal} disabled={logging}>{logging ? 'Logging...' : 'Accept and log meal'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
