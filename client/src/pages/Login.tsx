import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Field, FormError } from '../components/Ui';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../lib/api';
import { loginSchema, type LoginForm } from '../schemas';

const DEMO = { email: 'alex.mendoza@student.edu', password: 'password123' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/dashboard';
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null);
    try {
      await login(v.email, v.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  });

  return (
    <AuthShell title="Welcome back" subtitle="Log in to NUC: Bite On A Budget to see where your allowance stands."
      footer={<>New here? <Link to="/signup" className="font-bold text-brand-600">Create an account</Link></>}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@school.edu" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input type="password" autoComplete="current-password" className={`input ${errors.password ? 'input-error' : ''}`} placeholder="Your password" {...register('password')} />
        </Field>
        <FormError message={serverError} />
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Log in'}</button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-4 text-sm">
        <p className="font-bold text-brand-800">Try the demo student (loaded by npm run seed)</p>
        <p className="mt-1 text-xs text-ink-500">{DEMO.email} · {DEMO.password}</p>
        <button type="button" className="btn-soft btn-sm mt-3" onClick={() => { setValue('email', DEMO.email); setValue('password', DEMO.password); }}>Fill in demo login</button>
      </div>
    </AuthShell>
  );
}
