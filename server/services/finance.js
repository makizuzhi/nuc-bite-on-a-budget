/**
 * Business logic: every total / balance in the app is DERIVED here from the raw
 * transactions + savings entries. Nothing like "remaining" is ever stored in MongoDB.
 */
const { Transaction, SavingsEntry, CategoryBudget, Notification } = require('../models');
const { DAY_MS, round2, startOfDay, dayKey } = require('../lib/helpers');

// The allowance cycle window [start, end) and where "today" falls inside it.
function getCycle(user, now = new Date()) {
  const start = startOfDay(user.cycleStart);
  const length = user.cycleLengthDays;
  const end = new Date(start.getTime() + length * DAY_MS);
  const rawDay = Math.floor((startOfDay(now) - start) / DAY_MS) + 1;
  const dayNumber = Math.min(Math.max(rawDay, 1), length);
  return { start, end, length, dayNumber, daysLeft: length - dayNumber + 1, isOver: now >= end };
}

const totalOf = (rows, key) => rows.find((r) => r._id === key)?.total || 0;

/** Allowance, spent, remaining, savings pocket, daily & weekly budget for the current cycle. */
async function getFinancials(user, now = new Date()) {
  const cycle = getCycle(user, now);
  const inCycle = { $gte: cycle.start, $lt: cycle.end };
  const today = startOfDay(now);
  const group = (field) => ({ $group: { _id: field, total: { $sum: '$amount' } } });

  const [tx, savedInCycle, pocketRows, todayRows] = await Promise.all([
    Transaction.aggregate([{ $match: { user: user._id, occurredAt: inCycle } }, group('$type')]),
    SavingsEntry.aggregate([{ $match: { user: user._id, savedAt: inCycle } }, group('$kind')]),
    SavingsEntry.aggregate([{ $match: { user: user._id } }, group('$kind')]),
    Transaction.aggregate([
      { $match: { user: user._id, type: 'expense', occurredAt: { $gte: today, $lt: new Date(today.getTime() + DAY_MS) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const spent = totalOf(tx, 'expense');
  const income = totalOf(tx, 'income');
  const deposited = totalOf(savedInCycle, 'deposit');
  const withdrawn = totalOf(savedInCycle, 'withdrawal');
  const totalBudget = user.allowance + income; // what the student had to work with this cycle
  const remaining = round2(totalBudget - spent - deposited + withdrawn);
  // Adaptive pace: what is left, spread over the days that are left.
  const dailyBudget = round2(Math.max(remaining, 0) / cycle.daysLeft);
  // Planned pace: the whole cycle allowance spread evenly over the cycle (the "monthly allowance" view).
  const baseDaily = round2(totalBudget / cycle.length);

  return {
    allowance: user.allowance,
    income: round2(income),
    spent: round2(spent),
    spentToday: round2(todayRows[0]?.total || 0),
    remaining,
    percentSpent: totalBudget > 0 ? Math.min(100, Math.round((spent / totalBudget) * 100)) : 0,
    percentRemaining: totalBudget > 0 ? Math.max(0, Math.round((remaining / totalBudget) * 100)) : 0,
    dailyBudget,
    weeklyBudget: round2(dailyBudget * 7),
    baseDaily,
    baseWeekly: round2(baseDaily * 7),
    totalBudget: round2(totalBudget),
    savingsPocket: round2(totalOf(pocketRows, 'deposit') - totalOf(pocketRows, 'withdrawal')),
    savedThisCycle: round2(deposited - withdrawn),
    cycle: { start: cycle.start, end: cycle.end, length: cycle.length, dayNumber: cycle.dayNumber, daysLeft: cycle.daysLeft, isOver: cycle.isOver },
  };
}

/** Spending per category inside [from, to). */
async function getCategoryTotals(user, from, to) {
  const expenses = await Transaction.find({ user: user._id, type: 'expense', occurredAt: { $gte: from, $lt: to } }).select('category amount').lean();
  const byCat = {};
  expenses.forEach((t) => {
    byCat[t.category] ||= { category: t.category, total: 0, count: 0 };
    byCat[t.category].total += t.amount;
    byCat[t.category].count += 1;
  });
  const rows = Object.values(byCat).sort((a, b) => b.total - a.total);
  const grand = rows.reduce((s, r) => s + r.total, 0);
  return {
    total: round2(grand),
    categories: rows.map((r) => ({ ...r, total: round2(r.total), percent: grand > 0 ? Math.round((r.total / grand) * 100) : 0 })),
  };
}

/** Atomic "create once" helper: the unique (user, dedupeKey) index guarantees no duplicate alerts. */
async function notifyOnce(user, dedupeKey, type, title, message) {
  const res = await Notification.updateOne(
    { user: user._id, dedupeKey },
    { $setOnInsert: { user: user._id, dedupeKey, type, title, message, isRead: false } },
    { upsert: true }
  );
  return res.upsertedCount > 0;
}

/**
 * Evaluates the student's current numbers and creates any alert that is due:
 *   - low allowance (at the student's threshold, at 10%, and when it is used up)
 *   - daily budget exceeded
 *   - category budget warning / over
 * Safe to call as often as we like (every write route does): each alert is created only once.
 * Returns how many NEW notifications were created.
 */
async function syncAlerts(user) {
  const f = await getFinancials(user);
  const cycleKey = dayKey(f.cycle.start);
  let created = 0;
  const bump = async (...args) => { if (await notifyOnce(user, ...args)) created += 1; };

  // Low-allowance warnings
  if (f.totalBudget > 0) {
    const ratio = f.remaining / f.totalBudget;
    const threshold = (user.preferences?.lowAllowanceAlertPercent ?? 20) / 100;
    if (f.remaining <= 0) {
      await bump(`empty:${cycleKey}`, 'low_allowance', 'Allowance used up', 'You have no allowance left for this cycle. Avoid new spending or add income.');
    } else if (ratio <= 0.1) {
      await bump(`low10:${cycleKey}`, 'low_allowance', 'Allowance critically low', `Only ${money(f.remaining)} left (${Math.round(ratio * 100)}% of your allowance).`);
    } else if (ratio <= threshold) {
      await bump(`low${Math.round(threshold * 100)}:${cycleKey}`, 'low_allowance', 'Low allowance warning', `You have ${money(f.remaining)} left, ${Math.round(ratio * 100)}% of your allowance.`);
    }
  }

  // Daily budget exceeded (compared with the planned daily pace so the alert is stable during the day)
  if (f.baseDaily > 0 && f.spentToday > f.baseDaily) {
    await bump(`daily:${dayKey(new Date())}`, 'daily_budget', 'Daily budget exceeded', `You spent ${money(f.spentToday)} today, above your planned ${money(f.baseDaily)} per day.`);
  }

  // Category budgets
  const budgets = await CategoryBudget.find({ user: user._id });
  if (budgets.length) {
    const rows = await Transaction.aggregate([
      { $match: { user: user._id, type: 'expense', occurredAt: { $gte: f.cycle.start, $lt: f.cycle.end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    for (const b of budgets) {
      const spent = rows.find((r) => r._id === b.category)?.total || 0;
      const base = `cat:${b.category}:${cycleKey}`;
      if (spent >= b.limit) {
        await bump(`${base}:over`, 'budget_alert', `${b.category} budget exceeded`, `You spent ${money(spent)} of your ${money(b.limit)} ${b.category} budget.`);
      } else if (spent >= b.limit * b.alertThreshold) {
        await bump(`${base}:warn`, 'budget_alert', `${b.category} budget at ${Math.round((spent / b.limit) * 100)}%`, `You used ${money(spent)} of your ${money(b.limit)} ${b.category} budget.`);
      }
    }
  }
  return created;
}

const money = (n) => `PHP ${round2(n).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

module.exports = { getCycle, getFinancials, getCategoryTotals, syncAlerts, notifyOnce };
