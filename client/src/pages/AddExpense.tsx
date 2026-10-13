import { useNavigate } from 'react-router-dom';
import { ExpenseForm } from '../components/ExpenseForm';
import { useDataVersion } from '../hooks/useDataVersion';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import type { Summary } from '../lib/types';

export default function AddExpense() {
  const navigate = useNavigate();
  const toast = useToast();
  const { bump } = useDataVersion();
  const summary = useFetch<Summary>('/stats/summary');

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <p className="eyebrow mb-2">Keep your budget on track</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Add a new expense</h1>
        <p className="mt-2 text-ink-500">Small entries now make planning easier later.</p>
      </div>
      <ExpenseForm
        remaining={summary.data?.remaining ?? null}
        onSaved={() => { toast.success('Expense saved'); bump(); navigate('/dashboard'); }}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
