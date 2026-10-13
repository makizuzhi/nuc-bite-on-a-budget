import { z } from 'zod';
import { CUSTOM_CATEGORY } from '../lib/categories';
import { STALL_FILTERS, STALL_NAMES } from '../lib/stalls';

// Zod schemas live OUTSIDE the components. Each form gets its type from z.infer.

const number = (label: string) => ({ invalid_type_error: `${label} is required`, required_error: `${label} is required` });

const amount = (label = 'Amount') =>
  z.number(number(label)).positive(`${label} must be greater than 0`).max(1_000_000, `${label} is too large`);

const categoryText = z.string().trim().min(2, 'Category must be at least 2 characters').max(30, 'Category must be at most 30 characters');

// ---------- Expenses ----------
// `category` holds a default category name OR the CUSTOM_CATEGORY marker; when it is the marker the
// student must type their own category in `customCategory`.
export const expenseSchema = z.object({
  amount: amount(),
  category: z.string().min(1, 'Pick a category'),
  customCategory: z.string().trim().max(30, 'Category must be at most 30 characters'),
  description: z.string().trim().max(120, 'Keep it under 120 characters'),
  date: z.string().min(1, 'Pick a date'),
  time: z.string().min(1, 'Pick a time'),
}).superRefine((v, ctx) => {
  if (v.category === CUSTOM_CATEGORY && v.customCategory.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customCategory'], message: 'Type your own category (at least 2 characters)' });
  }
  if (new Date(`${v.date}T${v.time}`).getTime() > Date.now() + 60_000) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'The date cannot be in the future' });
  }
});
export type ExpenseForm = z.infer<typeof expenseSchema>;

// ---------- Allowance / balance ----------
export const balanceSchema = z.object({
  allowance: z.number(number('Allowance')).min(0, 'Allowance cannot be negative').max(1_000_000, 'Allowance is too large'),
});
export type BalanceForm = z.infer<typeof balanceSchema>;

export const pocketSchema = z.object({
  amount: z.number(number('Savings pocket')).min(0, 'Savings pocket cannot be negative').max(10_000_000, 'Amount is too large'),
});
export type PocketForm = z.infer<typeof pocketSchema>;

// ---------- Savings ----------
export const savingsSchema = z.object({
  amount: amount(),
  kind: z.enum(['deposit', 'withdrawal']),
  goal: z.string(),
  note: z.string().trim().max(120, 'Keep it under 120 characters'),
});
export type SavingsForm = z.infer<typeof savingsSchema>;

export const goalSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be at most 60 characters'),
  targetAmount: amount('Target'),
});
export type GoalForm = z.infer<typeof goalSchema>;

// ---------- Food wheel ----------
export const wheelItemSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be at most 60 characters'),
  price: z.number(number('Cost')).min(1, 'Cost must be at least 1').max(5000, 'That is too expensive for a student meal'),
  stall: z.enum(STALL_NAMES, { errorMap: () => ({ message: 'Pick a stall' }) }),
});
export type WheelItemForm = z.infer<typeof wheelItemSchema>;

export const spinSchema = z.object({
  maxBudget: z.number(number('Max budget')).positive('Max budget must be greater than 0').max(5000, 'Max budget is too high'),
  stall: z.enum(STALL_FILTERS),
});
export type SpinForm = z.infer<typeof spinSchema>;

// ---------- Budgets ----------
export const budgetSchema = z.object({
  category: categoryText,
  limit: amount('Limit'),
  alertPercent: z.number(number('Percentage')).int('Use a whole number').min(10, 'At least 10%').max(100, 'At most 100%'),
});
export type BudgetForm = z.infer<typeof budgetSchema>;

// ---------- Profile ----------
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  role: z.enum(['Student', 'Working Student']),
  program: z.string().trim().max(80, 'Program must be at most 80 characters'),
  studentNumber: z.string().trim().max(20, 'At most 20 characters').regex(/^[A-Za-z0-9-]*$/, 'Letters, numbers and dashes only'),
  defaultMaxBudget: z.number(number('Number')).min(1, 'At least 1').max(5000, 'At most 5,000'),
  defaultStall: z.enum(STALL_FILTERS),
  lowAllowanceAlertPercent: z.number(number('Number')).int('Use a whole number').min(5, 'At least 5%').max(50, 'At most 50%'),
  cycleLengthDays: z.number(number('Number')).int('Use a whole number').min(7, 'At least 7 days').max(62, 'At most 62 days'),
});
export type ProfileForm = z.infer<typeof profileSchema>;

// ---------- Accounts ----------
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
  allowance: z.number(number('Allowance (0 if none yet)')).min(0, 'Allowance cannot be negative').max(1_000_000, 'Allowance is too large'),
  cycleLengthDays: z.number(number('Number of days')).int('Use a whole number').min(7, 'At least 7 days').max(62, 'At most 62 days'),
}).refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
export type SignupForm = z.infer<typeof signupSchema>;
