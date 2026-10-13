/**
 * Seed script.
 *   npm run seed            -> wipes the collections and inserts sample data into MONGO_URI
 *   npm run seed:dry        -> builds + validates every document WITHOUT touching a database
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  User, Transaction, FoodStall, WheelItem, CategoryBudget, SavingsGoal, SavingsEntry, Notification,
} = require('../models');
const data = require('./data');

const DRY_RUN = process.argv.includes('--dry-run');
const oid = () => new mongoose.Types.ObjectId();

// Local date `daysAgo` days before today at HH:MM.
function at(daysAgo, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
}

function build() {
  const userId = oid();
  const cycleStart = at(20, '00:00'); // today = day 21 of a 30-day cycle

  const stalls = data.stalls.map((s) => ({
    name: s.name, specialty: s.specialty, description: s.description,
    menu: s.menu.map(([name, price, description]) => ({ name, price, description })),
  }));
  // The demo student's wheel = every stall menu item + one custom food.
  const wheel = [
    ...data.stalls.flatMap((s) => s.menu.map(([name, price]) => ({ user: userId, stall: s.name, name, price, isCustom: false }))),
    ...data.customWheelItems.map(([stall, name, price]) => ({ user: userId, stall, name, price, isCustom: true })),
  ];

  const goals = data.savingsGoals.map((g) => ({ _id: oid(), user: userId, ...g }));

  return {
    users: [{ _id: userId, ...data.user, wheelSeeded: true, passwordHash: bcrypt.hashSync(data.demoPassword, 10), cycleStart }],
    transactions: data.expenses.map(([daysAgo, time, category, amount, description]) => ({
      user: userId, type: 'expense', category, amount, description, occurredAt: at(daysAgo, time),
    })),
    stalls,
    wheel,
    budgets: data.categoryBudgets.map((b) => ({ user: userId, ...b })),
    goals,
    savings: data.savingsEntries.map((s) => ({ user: userId, goal: goals[0]._id, ...s })),
    notifications: data.notifications.map((n) => ({ user: userId, ...n })),
  };
}

// Sanity-check the demo numbers.
function summarize(docs) {
  const byCat = {};
  let spent = 0;
  for (const t of docs.transactions) {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    spent += t.amount;
  }
  const allowance = docs.users[0].allowance;
  console.log('Spent by category:', byCat);
  console.log(`Spent ${spent} of ${allowance} -> remaining ${allowance - spent}`);
  if (spent !== 7500) throw new Error(`Seed totals drifted: expected 7500 spent, got ${spent}`);
}

function validateAll(docs) {
  const pairs = [
    [User, docs.users], [Transaction, docs.transactions], [FoodStall, docs.stalls], [WheelItem, docs.wheel],
    [CategoryBudget, docs.budgets], [SavingsGoal, docs.goals], [SavingsEntry, docs.savings],
    [Notification, docs.notifications],
  ];
  for (const [Model, list] of pairs) {
    list.forEach((raw, i) => {
      const err = new Model(raw).validateSync();
      if (err) throw new Error(`${Model.modelName}[${i}] failed validation: ${err.message}`);
    });
    console.log(`  ok  ${Model.modelName.padEnd(15)} ${list.length} docs`);
  }
}

async function run() {
  const docs = build();
  console.log('Validating seed documents...');
  validateAll(docs);
  summarize(docs);
  if (DRY_RUN) return console.log('Dry run complete. Nothing was written.');

  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set. Copy .env.example to .env first.');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to ${mongoose.connection.name}. Clearing old data...`);

  const models = [User, Transaction, FoodStall, WheelItem, CategoryBudget, SavingsGoal, SavingsEntry, Notification];
  await Promise.all(models.map((M) => M.deleteMany({})));
  await Promise.all(models.map((M) => M.syncIndexes())); // make sure unique indexes exist

  await User.insertMany(docs.users);
  await Promise.all([
    Transaction.insertMany(docs.transactions),
    FoodStall.insertMany(docs.stalls),
    WheelItem.insertMany(docs.wheel),
    CategoryBudget.insertMany(docs.budgets),
    SavingsGoal.insertMany(docs.goals),
    SavingsEntry.insertMany(docs.savings),
    Notification.insertMany(docs.notifications),
  ]);
  console.log('Seed complete.');
}

run()
  .catch((err) => { console.error('Seed failed:', err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
