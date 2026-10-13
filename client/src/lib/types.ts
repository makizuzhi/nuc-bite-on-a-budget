import type { StallFilter, StallName } from './stalls';

// Categories are free text: the four defaults plus anything the student types.
export type Category = string;

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'Student' | 'Working Student';
  program: string;
  studentNumber: string;
  allowance: number;
  cycleStart: string;
  cycleLengthDays: number;
  preferences: { defaultMaxBudget: number; defaultStall: StallFilter; lowAllowanceAlertPercent: number };
}

export interface Transaction {
  _id: string;
  type: 'expense' | 'income';
  category: Category;
  amount: number;
  description: string;
  occurredAt: string;
  meal: string | null;
  stall?: string;
}

export interface CategoryList { defaults: string[]; custom: string[]; all: string[] }

export interface TransactionList {
  data: Transaction[];
  total: number;
  page: number;
  pages: number;
  summary: { sum: number; average: number; highest: number };
}

export interface Summary {
  allowance: number;
  income: number;
  spent: number;
  spentToday: number;
  remaining: number;
  dailyBudget: number;
  weeklyBudget: number;
  baseDaily: number;
  baseWeekly: number;
  totalBudget: number;
  savingsPocket: number;
  savedThisCycle: number;
  cycle: { start: string; end: string; length: number; dayNumber: number; daysLeft: number; isOver: boolean };
}

export interface CategoryTotals {
  total: number;
  categories: { category: Category; total: number; count: number; percent: number }[];
}

export interface CalendarDay { date: string; spent: number; saved: number; count: number }
export interface CalendarData {
  month: string;
  daysInMonth: number;
  firstWeekday: number;
  totalSpent: number;
  highestDay: CalendarDay | null;
  days: CalendarDay[];
}
export interface DayDetail { date: string; spent: number; saved: number; transactions: Transaction[] }

export interface WeeklySummary {
  from: string;
  to: string;
  totalSpent: number;
  weeklyTarget: number;
  percentOfTarget: number;
  status: 'On Track' | 'Watch Out' | 'Over Budget';
  streakWeeks: number;
  byCategory: { category: Category; total: number }[];
}

export interface ProfileStats { mealsLogged: number; savedThisMonth: number }

export interface MenuItem { _id: string; name: string; price: number; description: string; available: boolean }
export interface FoodStall {
  _id: string;
  name: StallName;
  description: string;
  specialty: string;
  itemCount: number;
  cheapest: number | null;
  priciest: number | null;
  average: number | null;
  menu: MenuItem[];
}
export interface StallList { total: number; data: FoodStall[] }

export interface WheelItem {
  _id: string;
  stall: StallName;
  name: string;
  price: number;
  isCustom: boolean;
}
export interface WheelList { total: number; data: WheelItem[] }
export interface SpinResult {
  item: WheelItem;
  maxBudget: number;
  effectiveBudget: number;
  underBudgetBy: number;
  remainingAfter: number;
  candidates: number;
}

export interface Budget {
  _id: string;
  category: Category;
  limit: number;
  alertThreshold: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'ok' | 'warning' | 'over';
}
export interface BudgetList { data: Budget[]; alerts: Budget[] }

export interface SavingsEntry {
  _id: string;
  goal: string | null;
  kind: 'deposit' | 'withdrawal';
  amount: number;
  note: string;
  savedAt: string;
}
export interface SavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  deadline: string | null;
  status: 'active' | 'achieved' | 'archived';
  saved: number;
  percent: number;
  left: number;
}
export interface SavingsData { pocket: number; entries: SavingsEntry[]; goals: SavingsGoal[] }

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
export interface NotificationList { data: AppNotification[]; unread: number }
