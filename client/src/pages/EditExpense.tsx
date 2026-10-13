import { Link, useNavigate, useParams } from 'react-router-dom';
import { Async } from '../components/Feedback';
import { ExpenseForm } from '../components/ExpenseForm';
import { useDataVersion } from '../hooks/useDataVersion';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import type { Summary, Transaction } from '../lib/types';

export default function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { bump } = useDataVersion();
  const tx = useFetch<Transaction>(`/transactions/${id}`); // a bad / missing id shows the server's 400 / 404 message
  const summary = useFetch<Summary>('/stats/summary');

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <p className="eyebrow mb-2">Fix a mistake</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Edit expense</h1>
      </div>
      <Async state={tx}>
        {(t) => (
          <ExpenseForm
            existing={t}
            remaining={summary.data ? summary.data.remaining + (t.type === 'expense' ? t.amount : 0) : null}
            onSaved={() => { toast.success('Expense updated'); bump(); navigate('/transactions'); }}
            onCancel={() => navigate(-1)}
          />
        )}
      </Async>
      {tx.error && <p className="mt-4 text-center text-sm"><Link to="/transactions" className="font-bold text-brand-600">Back to transactions</Link></p>}
    </div>
  );
}
