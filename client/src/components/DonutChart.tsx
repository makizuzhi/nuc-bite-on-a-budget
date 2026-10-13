import { categoryStyle } from '../lib/categories';
import { money } from '../lib/format';
import type { CategoryTotals } from '../lib/types';

/** Doughnut chart drawn with SVG circles. Slice sizes come straight from the data. */
export function DonutChart({ data }: { data: CategoryTotals }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={`Spending: ${money(data.total)} in total`}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="#eef2f5" strokeWidth="20" />
          {data.categories.map((c) => {
            const len = data.total > 0 ? (c.total / data.total) * C : 0;
            const el = (
              <circle key={c.category} cx="70" cy="70" r={R} fill="none" stroke={categoryStyle(c.category).color} strokeWidth="20"
                strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold">{money(data.total)}</span>
          <span className="text-xs text-ink-500">spent</span>
        </div>
      </div>
      <ul className="w-full max-w-xs space-y-3">
        {data.categories.map((c) => (
          <li key={c.category} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2.5 font-medium text-ink-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: categoryStyle(c.category).color }} />
              {c.category} <span className="text-xs text-ink-400">{c.percent}%</span>
            </span>
            <span className="font-bold">{money(c.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
