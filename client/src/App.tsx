import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { GuestOnly, RequireAuth } from './components/RequireAuth';
import AddExpense from './pages/AddExpense';
import Budgets from './pages/Budgets';
import CalendarPage from './pages/CalendarPage';
import Dashboard from './pages/Dashboard';
import EditExpense from './pages/EditExpense';
import Login from './pages/Login';
import Stalls from './pages/Stalls';
import Wheel from './pages/Wheel';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Randomizer from './pages/Randomizer';
import Savings from './pages/Savings';
import Signup from './pages/Signup';
import Transactions from './pages/Transactions';

// 15 routes: login and signup are public; everything else needs an account and shares the top navigation bar.
// "/" goes straight to the app (RequireAuth sends signed-out visitors to /login), so there is no landing page.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses/new" element={<AddExpense />} />
          <Route path="/expenses/:id/edit" element={<EditExpense />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/randomizer" element={<Randomizer />} />
          <Route path="/stalls" element={<Stalls />} />
          <Route path="/wheel" element={<Wheel />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
