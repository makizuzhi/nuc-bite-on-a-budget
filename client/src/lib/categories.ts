// One place that decides each category's colour and badge. The four default categories have fixed
// colours; any custom category the student types gets a stable colour from the palette below.
export const DEFAULT_CATEGORIES = ['Food', 'Transport', 'School', 'Supplies'] as const;
export const CUSTOM_CATEGORY = '__custom__'; // value of the "Custom category" radio in the expense form

export interface CategoryStyle { color: string; soft: string; text: string }

const FIXED: Record<string, CategoryStyle> = {
  Food: { color: '#d4a017', soft: 'bg-coral-100', text: 'text-coral-600' },
  Transport: { color: '#12356f', soft: 'bg-brand-100', text: 'text-brand-700' },
  School: { color: '#4f98cf', soft: 'bg-sky-100', text: 'text-sky-500' },
  Supplies: { color: '#7f9fd2', soft: 'bg-brand-50', text: 'text-brand-600' },
};
const PALETTE: CategoryStyle[] = [
  { color: '#8a5a9e', soft: 'bg-purple-100', text: 'text-purple-700' },
  { color: '#2f8f6b', soft: 'bg-emerald-100', text: 'text-emerald-700' },
  { color: '#c2563a', soft: 'bg-orange-100', text: 'text-orange-700' },
  { color: '#5f6f86', soft: 'bg-slate-100', text: 'text-slate-700' },
  { color: '#b0447a', soft: 'bg-pink-100', text: 'text-pink-700' },
];

export function categoryStyle(category: string): CategoryStyle {
  if (FIXED[category]) return FIXED[category];
  let hash = 0;
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return PALETTE[hash % PALETTE.length];
}
