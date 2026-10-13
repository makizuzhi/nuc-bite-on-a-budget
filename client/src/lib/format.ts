const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** 7500 -> ₱7,500 ; 12.5 -> ₱12.50 */
export const money = (n: number) => peso.format(n).replace('PHP', '₱').replace(/\s/g, '');

/** Local YYYY-MM-DD from a Date */
export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const toTimeInput = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const timeFmt = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' });
const shortFmt = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' });
const longFmt = new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

/** "Today, 12:40 PM" / "Yesterday, ..." / "May 20, 4:10 PM" */
export function whenLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => toDateInput(a) === toDateInput(b);
  const day = same(d, today) ? 'Today' : same(d, yesterday) ? 'Yesterday' : shortFmt.format(d);
  return `${day}, ${timeFmt.format(d)}`;
}
export const shortDate = (iso: string) => shortFmt.format(new Date(iso));
export const longDate = (iso: string) => longFmt.format(new Date(iso));
/** "2026-10-10" -> Date at local midnight */
export const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
