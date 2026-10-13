# NUC: Bite On A Budget

A full-stack student budgeting and food-picking web app (college final project).
Students track their allowance, set budgets and savings, browse 11 campus food stalls, and spin a customizable
Food Wheel that only picks meals they can afford.

- **Frontend:** React (Vite) + TypeScript, Tailwind CSS (navy and gold theme), React Router (15 routes), React Hook Form + Zod, one shared Axios instance
- **Backend:** Node.js + Express REST API (`models`, `routes`, `middleware`, `services`), JWT login, custom request logger, error-handling middleware, JSON 404 catch-all
- **Database:** MongoDB Atlas via Mongoose (8 related collections, validation rules, timestamps)

## Project structure

```
nuc-bite-on-a-budget/
  server/
    models/        User, Transaction, FoodStall, WheelItem, CategoryBudget, SavingsGoal, SavingsEntry, Notification
    routes/        auth, users, transactions, stats, stalls, wheel, budgets, savings, notifications, health
    middleware/    logger.js, auth.js, errorHandler.js (error handler + JSON 404)
    services/      finance.js (all derived money numbers and automatic alerts)
    seed/          data.js (11 stalls, menus, demo student), seed.js
  client/
    src/pages/     Login, Signup, Dashboard, AddExpense, EditExpense, Transactions, CalendarPage, Budgets,
                   Savings, Stalls, Randomizer, Wheel, Notifications, Profile, NotFound
    src/schemas/   Zod schemas for every form
    src/lib/api.ts the single Axios instance (axios.create with baseURL)
```

## Setup (step by step)

### 1. Install the tools
- Node.js 20 or newer (check with `node -v`)
- A free MongoDB Atlas account: https://www.mongodb.com/cloud/atlas/register

### 2. Create the MongoDB Atlas database
1. In Atlas, create a free **M0** cluster.
2. **Database Access** -> *Add New Database User* -> choose a username and a simple password (letters and numbers only avoids URL-encoding problems). Give it *Read and write to any database*.
3. **Network Access** -> *Add IP Address* -> **Allow access from anywhere** (`0.0.0.0/0`). This is fine for a class project.
4. **Database** -> *Connect* -> **Drivers** -> copy the connection string. It looks like
   `mongodb+srv://<user>:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. Replace `<db_password>` with your password and add the database name before the `?`:
   `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/nuc-bite-on-a-budget?retryWrites=true&w=majority`
   - If `npm run seed` fails with `querySrv ECONNREFUSED`, in the Atlas connect dialog switch to the older **mongodb://** (non-SRV) connection string, or set your DNS to 8.8.8.8.

### 3. Start the API (Terminal 1)
```bash
cd server
npm install
cp .env.example .env        # on Windows: copy .env.example .env
```
Open `server/.env` and fill it in:
```
PORT=5000
MONGO_URI=<your Atlas connection string from step 2.5>
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=type-any-long-random-text-here
```
Load the sample data (11 stalls with menus, a demo student), then start the server:
```bash
npm run seed       # ends with "Seed complete."
npm run dev        # prints "API running on http://localhost:5000"
```
Check it: open http://localhost:5000/api/health. You should see `"database":"connected"`.
(`npm run seed:dry` validates all seed documents without touching a database.)

### 4. Start the website (Terminal 2)
```bash
cd client
npm install
cp .env.example .env        # default VITE_API_URL=http://localhost:5000/api is fine
npm run dev
```
Open **http://localhost:5173**. You land on the login page.

- **Demo account (with sample data):** `alex.mendoza@student.edu` / `password123` (created by `npm run seed`; the login page has a "Fill in demo login" button).
- **New account:** use *Create account*. A new account starts with an empty dashboard.

### Troubleshooting
| Problem | Fix |
|---|---|
| `MONGO_URI is not set` | `.env` is missing or not inside `server/` |
| `bad auth` | Wrong database username or password (use the *database user*, not your Atlas login) |
| `Server selection timed out` | Atlas Network Access must allow `0.0.0.0/0` |
| `querySrv ECONNREFUSED` | Use the non-SRV connection string (step 2.5) or change DNS to 8.8.8.8 |
| Site says "Cannot reach the server" | The API terminal is not running, or `VITE_API_URL` does not match the API port |
| Demo login fails | Run `npm run seed` again in `server/` |
| Dashboard looks empty or dates are old | Run `npm run seed` again (seed dates are relative to today) |
| Sent back to login | Your session expired or `JWT_SECRET` changed; log in again |

## Feature checklist (project brief)

| Requirement | Where |
|---|---|
| Navy and gold National University theme, no emojis | `client/tailwind.config.js`, all components |
| Persistent top navigation bar, no hamburger menu, no landing page | `components/AppLayout.tsx`, `App.tsx` (`/` redirects to the app) |
| Working notifications (budget alerts, low allowance, system updates) | `services/finance.js` (`syncAlerts`), `routes/notifications.js`, bell dropdown + Notifications page |
| Profile dropdown and Edit profile form (personal preferences, defaults) | `AppLayout.tsx` (ProfileMenu), `pages/Profile.tsx`, `ProfileModal` |
| "Set balance" updates the whole dashboard in real time | `PATCH /api/users/me/balance` + `useDataVersion` re-fetch |
| Daily and weekly budget derived from the monthly allowance | `services/finance.js` (`dailyBudget`, `weeklyBudget`, plus the planned `baseDaily`, `baseWeekly`) |
| Editable savings pocket | `PATCH /api/savings/pocket`, "Edit amount" on Dashboard and Savings |
| Custom expense category instead of "Other" | `components/ExpenseForm.tsx` (Custom category text input) |
| Customizable Food Wheel (add / edit / remove items) | `pages/Wheel.tsx`, `routes/wheel.js` |
| 11 food stalls with seeded menus | `server/seed/data.js`, `models/FoodStall.js`, `pages/Stalls.tsx` |

### How the numbers work
- **Total remaining** = allowance + income - spent - net savings (all for the current cycle).
- **Daily budget** = remaining / days left in the cycle. **Weekly budget** = daily budget x 7.
- **Plan** (shown under each) = total allowance / cycle length, i.e. the original monthly allowance spread evenly.
- Nothing like "remaining" is stored: it is always computed from the allowance and the transactions, so it cannot get out of sync.
- The spin only offers dishes that cost no more than your max budget **and** no more than your remaining allowance.

## API documentation

Base URL: `http://localhost:5000/api`. All routes except `/health` and `/auth/*` need the header `Authorization: Bearer <token>`.
Errors are always JSON: `{ "message": "...", "errors": { "field": "..." } }`. Unknown URLs return a JSON `404`.

| Method | Endpoint | Description | Success |
|---|---|---|---|
| GET | `/health` | API and database status | 200 / 503 |
| POST | `/auth/register` | Create an account `{ fullName, email, password, allowance?, cycleLengthDays? }` | 201 |
| POST | `/auth/login` | Log in `{ email, password }`, returns `{ token, user }` | 200 |
| GET | `/users/me` | Current profile | 200 |
| PUT | `/users/me` | Edit profile and preferences | 200 |
| PATCH | `/users/me/balance` | "Set balance": set total cycle allowance `{ allowance }` | 200 |
| POST | `/users/me/cycle` | Start a new allowance cycle | 201 |
| GET | `/transactions` | List with `q, category, type, from, to, minAmount, maxAmount, sort, page, limit` | 200 |
| GET | `/transactions/categories` | Default categories plus the custom ones you have used | 200 |
| GET | `/transactions/:id` | One transaction | 200 |
| POST | `/transactions` | Add an expense or income (any category text, 2-30 chars) | 201 |
| PUT | `/transactions/:id` | Edit a transaction | 200 |
| DELETE | `/transactions/:id` | Delete a transaction | 200 |
| GET | `/stats/summary` | Remaining, spent, daily and weekly budget, plan, savings pocket | 200 |
| GET | `/stats/categories` | Spending per category (`from`, `to` optional) | 200 |
| GET | `/stats/calendar?month=YYYY-MM` | Spending per day | 200 |
| GET | `/stats/day?date=YYYY-MM-DD` | One day's transactions | 200 |
| GET | `/stats/weekly` | Weekly summary and budget streak | 200 |
| GET | `/stats/profile` | Profile metric cards | 200 |
| GET | `/stalls` | The 11 stalls with menus (`q`, `maxBudget`) | 200 |
| GET | `/stalls/:id` | One stall | 200 |
| GET | `/stalls/:id/menu` | A stall's menu (`maxBudget`) | 200 |
| POST | `/stalls/:id/menu/:itemId/wheel` | Copy a menu item onto your wheel | 201 (409 if already there) |
| GET | `/wheel` | Your wheel items (`stall`, `maxBudget`, `q`) | 200 |
| POST | `/wheel` | Add a food `{ name, price, stall }` | 201 |
| GET | `/wheel/:id` | One wheel item | 200 |
| PUT | `/wheel/:id` | Edit a wheel item | 200 |
| DELETE | `/wheel/:id` | Remove a wheel item | 200 |
| POST | `/wheel/reset` | Restore the default stall menus | 201 |
| POST | `/wheel/spin` | Spin `{ maxBudget, stall }` (404 if nothing fits) | 200 |
| POST | `/wheel/:id/log` | Log the picked dish as a Food expense | 201 |
| GET | `/budgets` | Category budgets with live usage | 200 |
| POST | `/budgets` | Create a category budget | 201 |
| PUT | `/budgets/:id` | Edit a budget | 200 |
| DELETE | `/budgets/:id` | Delete a budget | 200 |
| GET | `/savings` | Pocket total, history, goals with progress | 200 |
| PATCH | `/savings/pocket` | Edit the pocket total `{ amount }` | 200 |
| POST | `/savings` | Deposit or withdraw `{ amount, kind, goal?, note? }` | 201 |
| DELETE | `/savings/:id` | Delete a savings entry | 200 |
| POST | `/savings/goals` | Create a savings goal | 201 |
| PUT | `/savings/goals/:id` | Edit a goal | 200 |
| DELETE | `/savings/goals/:id` | Delete a goal | 200 |
| GET | `/notifications` | List (`unread=true`, `type`) with unread count; due alerts are created first | 200 |
| POST | `/notifications/refresh` | Re-check the alert rules now | 200 / 201 |
| PATCH | `/notifications/read-all` | Mark all read | 200 |
| PATCH | `/notifications/:id/read` | Mark one read | 200 |
| DELETE | `/notifications` | Clear all (`readOnly=true` clears only read ones) | 200 |
| DELETE | `/notifications/:id` | Delete one | 200 |

Status codes used: `200`, `201`, `400` (validation), `401` (not logged in), `403`, `404`, `409` (duplicate), `500`.

### Automatic notifications
`syncAlerts` runs after every write and when the list is requested. Each alert is created once (unique `dedupeKey`):
low allowance (at your chosen percentage, at 10%, and when it hits zero), daily budget exceeded, category budget at its alert percentage or over its limit, plus system updates such as the welcome message.

## Notes
- All stall and menu names/prices are made-up sample data for the project.
- Passwords are hashed with bcrypt; the hash is never returned by the API.
- `node_modules`, `.env` and `dist` are git-ignored.
