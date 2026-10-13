import { ExpenseCalendar } from '../components/ExpenseCalendar';
import { PageHeader } from '../components/Ui';

export default function CalendarPage() {
  return (
    <div>
      <PageHeader eyebrow="Daily view" title="Expense calendar" subtitle="Tap a day to see what you spent and saved." />
      <ExpenseCalendar />
    </div>
  );
}
