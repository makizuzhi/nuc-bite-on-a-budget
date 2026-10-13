import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, getErrorMessage, getFieldErrors } from '../lib/api';
import { useDataVersion } from '../hooks/useDataVersion';
import { useToast } from '../hooks/useToast';
import { money } from '../lib/format';
import { STALL_FILTERS, STALL_NAMES } from '../lib/stalls';
import type { Budget, SavingsGoal, User, WheelItem } from '../lib/types';
import {
  balanceSchema, budgetSchema, goalSchema, pocketSchema, profileSchema, savingsSchema, wheelItemSchema,
  type BalanceForm, type BudgetForm, type GoalForm, type PocketForm, type ProfileForm, type SavingsForm, type WheelItemForm,
} from '../schemas';
import { Modal } from './Modal';
import { Field, FormError } from './Ui';

/** Shared submit plumbing: runs the request, shows a toast, refreshes data, maps server errors. */
function useSubmit(successText: string, onClose: () => void) {
  const { bump } = useDataVersion();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const run = async (request: () => Promise<unknown>, setFieldError?: (name: string, message: string) => void) => {
    setServerError(null);
    try {
      await request();
      toast.success(successText);
      bump();
      onClose();
    } catch (err) {
      Object.entries(getFieldErrors(err)).forEach(([k, v]) => setFieldError?.(k, v));
      setServerError(getErrorMessage(err));
    }
  };
  return { run, serverError };
}

const Actions = ({ onClose, busy, label }: { onClose: () => void; busy: boolean; label: string }) => (
  <div className="mt-6 grid grid-cols-2 gap-3">
    <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
    <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving...' : label}</button>
  </div>
);

// ---------- Set balance (total allowance for the cycle) ----------
export function BalanceModal({ allowance, remaining, onClose }: { allowance: number; remaining: number; onClose: () => void }) {
  const { run, serverError } = useSubmit('Allowance updated', onClose);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<BalanceForm>({ resolver: zodResolver(balanceSchema), defaultValues: { allowance } });
  return (
    <Modal title="Set balance" subtitle={`Your total allowance is ${money(allowance)} and ${money(remaining)} is still available.`} onClose={onClose}>
      <form noValidate onSubmit={handleSubmit((v) => run(() => api.patch('/users/me/balance', v), (n, m) => n === 'allowance' && setError('allowance', { message: m })))} className="space-y-4">
        <Field label="Total allowance for this cycle (PHP)" error={errors.allowance?.message}>
          <input type="number" step="0.01" inputMode="decimal" autoFocus className={`input ${errors.allowance ? 'input-error' : ''}`} {...register('allowance', { valueAsNumber: true })} />
        </Field>
        <p className="text-xs text-ink-500">Your remaining balance, daily budget, weekly budget and progress bars are recalculated from this amount.</p>
        <FormError message={serverError} />
        <Actions onClose={onClose} busy={isSubmitting} label="Update allowance" />
      </form>
    </Modal>
  );
}

// ---------- Edit savings pocket ----------
export function PocketModal({ pocket, remaining, onClose }: { pocket: number; remaining: number; onClose: () => void }) {
  const { run, serverError } = useSubmit('Savings pocket updated', onClose);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<PocketForm>({ resolver: zodResolver(pocketSchema), defaultValues: { amount: pocket } });
  return (
    <Modal title="Edit savings pocket" subtitle={`Saved now: ${money(pocket)}. Available to move into savings: ${money(remaining)}.`} onClose={onClose}>
      <form noValidate onSubmit={handleSubmit((v) => run(() => api.patch('/savings/pocket', v), (n, m) => n === 'amount' && setError('amount', { message: m })))} className="space-y-4">
        <Field label="Savings pocket amount (PHP)" error={errors.amount?.message}>
          <input type="number" step="0.01" inputMode="decimal" autoFocus className={`input ${errors.amount ? 'input-error' : ''}`} {...register('amount', { valueAsNumber: true })} />
        </Field>
        <p className="text-xs text-ink-500">Raising the amount takes money from your remaining allowance. Lowering it returns money to your remaining allowance.</p>
        <FormError message={serverError} />
        <Actions onClose={onClose} busy={isSubmitting} label="Save pocket" />
      </form>
    </Modal>
  );
}

// ---------- Add savings ----------
export function SavingsModal({ goals, pocket, onClose }: { goals: SavingsGoal[]; pocket: number; onClose: () => void }) {
  const { run, serverError } = useSubmit('Savings updated', onClose);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<SavingsForm>({
    resolver: zodResolver(savingsSchema), defaultValues: { kind: 'deposit', goal: goals[0]?._id ?? '', note: '' },
  });
  return (
    <Modal title="Add savings" subtitle={`Saving moves money out of your allowance. Pocket: ${money(pocket)}`} onClose={onClose}>
      <form noValidate className="space-y-4"
        onSubmit={handleSubmit((v) => run(() => api.post('/savings', { ...v, goal: v.goal || null }), (n, m) => n === 'amount' && setError('amount', { message: m })))}>
        <Field label="Type">
          <select className="input" {...register('kind')}><option value="deposit">Add to savings</option><option value="withdrawal">Take from savings</option></select>
        </Field>
        <Field label="Amount (₱)" error={errors.amount?.message}>
          <input type="number" step="0.01" inputMode="decimal" autoFocus className={`input ${errors.amount ? 'input-error' : ''}`} {...register('amount', { valueAsNumber: true })} />
        </Field>
        <Field label="Goal" optional>
          <select className="input" {...register('goal')}><option value="">No specific goal</option>{goals.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}</select>
        </Field>
        <Field label="Note" optional error={errors.note?.message}>
          <input type="text" placeholder="e.g. Weekly save" className="input" {...register('note')} />
        </Field>
        <FormError message={serverError} />
        <Actions onClose={onClose} busy={isSubmitting} label="Save" />
      </form>
    </Modal>
  );
}

// ---------- Savings goal (create / edit) ----------
export function GoalModal({ goal, onClose }: { goal?: SavingsGoal; onClose: () => void }) {
  const { run, serverError } = useSubmit(goal ? 'Goal updated' : 'Goal created', onClose);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema), defaultValues: goal ? { name: goal.name, targetAmount: goal.targetAmount } : { name: '' },
  });
  return (
    <Modal title={goal ? 'Edit goal' : 'New savings goal'} onClose={onClose}>
      <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => run(() => (goal ? api.put(`/savings/goals/${goal._id}`, v) : api.post('/savings/goals', v))))}>
        <Field label="Goal name" error={errors.name?.message}><input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. New laptop" {...register('name')} /></Field>
        <Field label="Target amount (₱)" error={errors.targetAmount?.message}>
          <input type="number" step="0.01" inputMode="decimal" className={`input ${errors.targetAmount ? 'input-error' : ''}`} {...register('targetAmount', { valueAsNumber: true })} />
        </Field>
        <FormError message={serverError} />
        <Actions onClose={onClose} busy={isSubmitting} label={goal ? 'Save changes' : 'Create goal'} />
      </form>
    </Modal>
  );
}

// ---------- Wheel item (create / edit) ----------
export function WheelItemModal({ item, defaultStall, onClose }: { item?: WheelItem; defaultStall?: string; onClose: () => void }) {
  const { run, serverError } = useSubmit(item ? 'Wheel item updated' : 'Food added to the wheel', onClose);
  const initialStall = (STALL_NAMES as readonly string[]).includes(defaultStall ?? '') ? (defaultStall as WheelItemForm['stall']) : STALL_NAMES[0];
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<WheelItemForm>({
    resolver: zodResolver(wheelItemSchema),
    defaultValues: item ? { name: item.name, price: item.price, stall: item.stall } : { name: '', stall: initialStall },
  });
  return (
    <Modal title={item ? 'Edit wheel item' : 'Add a food to your wheel'} onClose={onClose}>
      <form noValidate className="space-y-4"
        onSubmit={handleSubmit((v) => run(() => (item ? api.put(`/wheel/${item._id}`, v) : api.post('/wheel', v)), (n, m) => (n === 'name' || n === 'price' || n === 'stall') && setError(n, { message: m })))}>
        <Field label="Stall" error={errors.stall?.message}>
          <select className="input" {...register('stall')}>{STALL_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </Field>
        <Field label="Food name" error={errors.name?.message}><input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Tapsilog, Siomai Rice" {...register('name')} /></Field>
        <Field label="Estimated cost (PHP)" error={errors.price?.message}>
          <input type="number" step="1" inputMode="decimal" className={`input ${errors.price ? 'input-error' : ''}`} {...register('price', { valueAsNumber: true })} />
        </Field>
        <FormError message={serverError} />
        <Actions onClose={onClose} busy={isSubmitting} label={item ? 'Save changes' : 'Add to wheel'} />
      </form>
    </Modal>
  );
}

// ---------- Category budget (create / edit) ----------
export function BudgetModal({ budget, suggestions, onClose }: { budget?: Budget; suggestions: string[]; onClose: () => void }) {
  const { run, serverError } = useSubmit(budget ? 'Budget updated' : 'Budget created', onClose);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget ? { category: budget.category, limit: budget.limit, alertPercent: Math.round(budget.alertThreshold * 100) } : { category: '', alertPercent: 80 },
  });
  return (
    <Modal title={budget ? `Edit ${budget.category} budget` : 'New category budget'} subtitle="You get an alert once spending reaches the alert percentage." onClose={onClose}>
      <form noValidate className="space-y-4"
        onSubmit={handleSubmit((v) => run(() => {
          const body = { category: v.category, limit: v.limit, alertThreshold: v.alertPercent / 100 };
          return budget ? api.put(`/budgets/${budget._id}`, body) : api.post('/budgets', body);
        }, (n, m) => n === 'category' && setError('category', { message: m })))}>
        <Field label="Category" error={errors.category?.message}>
          <input list="budget-categories" disabled={Boolean(budget)} maxLength={30} placeholder="Pick one or type your own" className={`input ${errors.category ? 'input-error' : ''}`} {...register('category')} />
          <datalist id="budget-categories">{suggestions.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Spending limit (PHP)" error={errors.limit?.message}>
          <input type="number" step="1" inputMode="decimal" className={`input ${errors.limit ? 'input-error' : ''}`} {...register('limit', { valueAsNumber: true })} />
        </Field>
        <Field label="Alert at (% of limit)" error={errors.alertPercent?.message}>
          <input type="number" step="1" inputMode="numeric" className={`input ${errors.alertPercent ? 'input-error' : ''}`} {...register('alertPercent', { valueAsNumber: true })} />
        </Field>
        <FormError message={serverError} />
        <Actions onClose={onClose} busy={isSubmitting} label={budget ? 'Save changes' : 'Create budget'} />
      </form>
    </Modal>
  );
}

// ---------- Edit profile ----------
export function ProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { run, serverError } = useSubmit('Profile updated', onClose);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName, email: user.email, role: user.role, program: user.program ?? '', studentNumber: user.studentNumber ?? '',
      defaultMaxBudget: user.preferences.defaultMaxBudget, defaultStall: user.preferences.defaultStall,
      lowAllowanceAlertPercent: user.preferences.lowAllowanceAlertPercent ?? 20, cycleLengthDays: user.cycleLengthDays,
    },
  });
  const err = (name: keyof ProfileForm) => (errors[name] ? 'input-error' : '');
  return (
    <Modal title="Edit profile" subtitle="Manage your profile, personal preferences and account defaults." onClose={onClose}>
      <form noValidate className="space-y-4"
        onSubmit={handleSubmit((v) => run(
          () => api.put('/users/me', {
            fullName: v.fullName, email: v.email, role: v.role, program: v.program, studentNumber: v.studentNumber, cycleLengthDays: v.cycleLengthDays,
            preferences: { defaultMaxBudget: v.defaultMaxBudget, defaultStall: v.defaultStall, lowAllowanceAlertPercent: v.lowAllowanceAlertPercent },
          }),
          (n, m) => (n === 'email' || n === 'fullName' || n === 'studentNumber') && setError(n, { message: m }),
        ))}>
        <Field label="Full name" error={errors.fullName?.message}><input className={`input ${err('fullName')}`} {...register('fullName')} /></Field>
        <Field label="Student email" error={errors.email?.message}><input type="email" className={`input ${err('email')}`} {...register('email')} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Program" optional error={errors.program?.message}><input className={`input ${err('program')}`} placeholder="e.g. BS Information Technology" {...register('program')} /></Field>
          <Field label="Student number" optional error={errors.studentNumber?.message}><input className={`input ${err('studentNumber')}`} {...register('studentNumber')} /></Field>
        </div>
        <Field label="Status"><select className="input" {...register('role')}><option>Student</option><option>Working Student</option></select></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Default max budget (PHP)" error={errors.defaultMaxBudget?.message}><input type="number" className={`input ${err('defaultMaxBudget')}`} {...register('defaultMaxBudget', { valueAsNumber: true })} /></Field>
          <Field label="Cycle length (days)" error={errors.cycleLengthDays?.message}><input type="number" className={`input ${err('cycleLengthDays')}`} {...register('cycleLengthDays', { valueAsNumber: true })} /></Field>
          <Field label="Low allowance alert (%)" error={errors.lowAllowanceAlertPercent?.message}><input type="number" className={`input ${err('lowAllowanceAlertPercent')}`} {...register('lowAllowanceAlertPercent', { valueAsNumber: true })} /></Field>
        </div>
        <Field label="Default food stall"><select className="input" {...register('defaultStall')}>{STALL_FILTERS.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <FormError message={serverError} />
        <Actions onClose={onClose} busy={isSubmitting} label="Save profile" />
      </form>
    </Modal>
  );
}
