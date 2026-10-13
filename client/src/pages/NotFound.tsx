import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span className="text-6xl font-extrabold text-coral-500" aria-hidden>404</span>
      <p className="eyebrow">Page not found</p>
      <h1 className="text-3xl font-extrabold">This page does not exist</h1>
      <p className="text-ink-500">The page you are looking for does not exist or was moved.</p>
      <Link to="/dashboard" className="btn-primary mt-3">Back to dashboard</Link>
    </div>
  );
}
