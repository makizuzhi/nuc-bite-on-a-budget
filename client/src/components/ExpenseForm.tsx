import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, getErrorMessage, getFieldErrors } from '../lib/api';
import { CUSTOM_CATEGORY, DEFAULT_CATEGORIES } from '../lib/categories';
import { money, toDateInput, toTimeInput } from '../lib/format';
import type { Transaction } from '../lib/types';
import { expenseSchema, type ExpenseForm as ExpenseValues } from '../schemas';
import { FormError } from './Ui';

interface Props {
  existing?: Transaction; // present when editing
  remaining: number | null; // remaining allowance, shown under the amount (derived by the server)
  onSaved: () => void;
  onCancel: () => void;
}

const defaultsFor = (tx?: Transaction): ExpenseValues => {
  const when = tx ? new Date(tx.occurredAt) : new Date();
  const isCustom = Boolean(tx) && !(DEFAULT_CATEGORIES as readonly string[]).includes(tx!.category);
  return {
    amount: tx?.amount ?? (undefined as unknown as number),
    category: isCustom ? CUSTOM_CATEGORY : tx?.category ?? 'Food',
    customCategory: isCustom ? tx!.category : '',
    description: tx?.description ?? '',
    date: toDateInput(when),
    time: toTimeInput(when),
  };
};

/** One form for both "Add a new expense" and "Edit expense". */
export function ExpenseForm({ existing, remaining, onSaved, onCancel }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultsFor(existing),
  });
  const category = watch('category');

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const payload = {
      category: values.category === CUSTOM_CATEGORY ? values.customCategory : values.category,
      amount: values.amount,
      description: values.description,
      occurredAt: new Date(`${values.date}T${values.time}`).toISOString(),
    };
    try {
      if (existing) await api.put(`/transactions/${existing._id}`, payload);
      else await api.post('/transactions', payload);
      onSaved();
    } catch (err) {
      const fields = getFieldErrors(err);
      Object.entries(fields).forEach(([name, message]) => {
        if (name === 'amount' || name === 'description') setError(name, { message });
        if (name === 'category') setError(category === CUSTOM_CATEGORY ? 'customCategory' : 'category', { message });
      });
      setServerError(getErrorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="overflow-hidden rounded-[1.75rem] border border-ink-200/70 bg-white shadow-card">
      <div className="bg-brand-50 px-5 py-8 text-center sm:px-8">
        <label htmlFor="amount" className="text-sm font-semibold text-ink-700">How much did you spend?</label>
        <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2 border-b-2 border-brand-300 pb-1 focus-within:border-brand-600">
          <span className="text-3xl font-extrabold text-brand-600" aria-hidden>₱</span>
          <input id="amount" type="number" inputMode="decimal" step="0.01" placeholder="0.00" autoFocus
            aria-invalid={Boolean(errors.amount)} aria-describedby="amount-help"
            className="w-full bg-transparent text-center text-4xl font-extrabold text-ink-900 placeholder:text-ink-200 focus:outline-none"
            {...register('amount', { valueAsNumber: true })} />
        </div>
        <p id="amount-help" className="mt-3 text-xs text-ink-500">
          {errors.amount ? <span className="font-semibold text-red-600" role="alert">{errors.amount.message}</span>
            : remaining !== null ? `You have ${money(remaining)} remaining` : 'Checking your allowance…'}
        </p>
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-8">
        <fieldset>
          <legend className="label">Category</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[...DEFAULT_CATEGORIES, CUSTOM_CATEGORY].map((c) => (
              <label key={c} className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-sm font-semibold transition ${
                category === c ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50'}`}>
                <input type="radio" value={c} className="sr-only" {...register('category')} />
                {c === CUSTOM_CATEGORY ? 'Custom category' : c}
              </label>
            ))}
          </div>
          {errors.category && <p className="field-error" role="alert">{errors.category.message}</p>}
          {category === CUSTOM_CATEGORY && (
            <div className="mt-3">
              <input type="text" maxLength={30} placeholder="Type your own category, e.g. Laundry, Gifts, Org dues" aria-label="Custom category name"
                className={`input ${errors.customCategory ? 'input-error' : ''}`} {...register('customCategory')} />
              {errors.customCategory && <p className="field-error" role="alert">{errors.customCategory.message}</p>}
            </div>
          )}
        </fieldset>

        <div>
          <label className="block">
            <span className="label">Description <span className="font-normal text-ink-400">(optional)</span></span>
            <input type="text" placeholder="e.g. Lunch with classmates" className={`input ${errors.description ? 'input-error' : ''}`} {...register('description')} />
          </label>
          {errors.description && <p className="field-error" role="alert">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block"><span className="label">Date</span>
              <input type="date" className={`input ${errors.date ? 'input-error' : ''}`} {...register('date')} />
            </label>
            {errors.date && <p className="field-error" role="alert">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block"><span className="label">Time</span>
              <input type="time" className={`input ${errors.time ? 'input-error' : ''}`} {...register('time')} />
            </label>
            {errors.time && <p className="field-error" role="alert">{errors.time.message}</p>}
          </div>
        </div>

        <FormError message={serverError} />

        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : existing ? 'Save changes' : 'Save expense'}</button>
        </div>
      </div>
    </form>
  );
}
