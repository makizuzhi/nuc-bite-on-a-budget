import type { ReactNode } from 'react';
import { whenLabel, money } from '../lib/format';
import type { Transaction } from '../lib/types';
import { CategoryIcon } from './Ui';

export function TransactionRow({ tx, actions }: { tx: Transaction; actions?: ReactNode }) {
  const isIncome = tx.type === 'income';
  return (
    <li className="flex items-center gap-3 py-3.5">
      <CategoryIcon category={tx.category} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{tx.description || tx.category}</p>
        <p className="truncate text-xs text-ink-500">{tx.category} · {whenLabel(tx.occurredAt)}</p>
      </div>
      <p className={`shrink-0 font-bold ${isIncome ? 'text-brand-600' : 'text-ink-900'}`}>{isIncome ? '+' : '-'} {money(tx.amount)}</p>
      {actions}
    </li>
  );
}
