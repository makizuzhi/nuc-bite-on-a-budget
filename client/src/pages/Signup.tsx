import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Field, FormError } from '../components/Ui';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../lib/api';
import { signupSchema, type SignupForm } from '../schemas';

export default function Signup() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', allowance: undefined as unknown as number, cycleLengthDays: 30 },
  });

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null);
    try {
      await createAccount(v);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const fields = getFieldErrors(err);
      (['fullName', 'email', 'password', 'allowance', 'cycleLengthDays'] as const).forEach((name) => {
        if (fields[name]) setError(name, { message: fields[name] });
      });
      setServerError(getErrorMessage(err));
    }
  });

  const cls = (bad: boolean) => `input ${bad ? 'input-error' : ''}`;

  return (
    <AuthShell title="Create your account" subtitle="Set your allowance once and we will do the math from there."
      footer={<>Already have an account? <Link to="/login" className="font-bold text-brand-600">Log in</Link></>}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Full name" error={errors.fullName?.message}>
          <input autoComplete="name" className={cls(Boolean(errors.fullName))} placeholder="Alex Mendoza" {...register('fullName')} />
        </Field>
        <Field label="Student email" error={errors.email?.message}>
          <input type="email" autoComplete="email" className={cls(Boolean(errors.email))} placeholder="you@student.edu" {...register('email')} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Password" error={errors.password?.message}>
            <input type="password" autoComplete="new-password" className={cls(Boolean(errors.password))} placeholder="At least 8 characters" {...register('password')} />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <input type="password" autoComplete="new-password" className={cls(Boolean(errors.confirmPassword))} placeholder="Type it again" {...register('confirmPassword')} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Allowance (₱)" error={errors.allowance?.message}>
            <input type="number" inputMode="decimal" className={cls(Boolean(errors.allowance))} placeholder="15000" {...register('allowance', { valueAsNumber: true })} />
          </Field>
          <Field label="Cycle length (days)" error={errors.cycleLengthDays?.message}>
            <input type="number" inputMode="numeric" className={cls(Boolean(errors.cycleLengthDays))} {...register('cycleLengthDays', { valueAsNumber: true })} />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-ink-500">The cycle is how long one allowance has to last (30 days for a monthly allowance). You can change both later in your profile.</p>
        <FormError message={serverError} />
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
