import { Async, EmptyState } from '../components/Feedback';
import { PageHeader } from '../components/Ui';
import { useDataVersion } from '../hooks/useDataVersion';
import { useDeleteFlow } from '../hooks/useDeleteFlow';
import { useFetch } from '../hooks/useFetch';
import { useToast } from '../hooks/useToast';
import { api, getErrorMessage } from '../lib/api';
import { whenLabel } from '../lib/format';
import type { AppNotification, NotificationList } from '../lib/types';
import { NOTE_LABEL } from '../components/AppLayout';

export default function Notifications() {
  const list = useFetch<NotificationList>('/notifications');
  const toast = useToast();
  const { bump } = useDataVersion();
  const del = useDeleteFlow<AppNotification>({
    path: (n) => `/notifications/${n._id}`,
    title: 'Delete this notification?',
    message: (n) => `"${n.title}" will be removed.`,
    success: 'Notification deleted',
  });

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); bump(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div>
      <PageHeader eyebrow="Inbox" title="Notifications" subtitle="Budget alerts, low-allowance warnings and system updates."
        action={(
          <div className="flex flex-wrap gap-2 self-start">
            <button type="button" className="btn-secondary" onClick={() => run(() => api.post('/notifications/refresh'), 'Alerts checked')}>Check for alerts</button>
            {list.data && list.data.unread > 0 && <button type="button" className="btn-soft" onClick={() => run(() => api.patch('/notifications/read-all'), 'All marked as read')}>Mark all as read</button>}
            {list.data && list.data.data.length > 0 && <button type="button" className="btn-secondary text-red-600" onClick={() => run(() => api.delete('/notifications', { params: { readOnly: true } }), 'Read notifications cleared')}>Clear read</button>}
          </div>
        )} />
      <Async state={list}>
        {(l) => (l.data.length === 0 ? (
          <EmptyState title="You are all caught up" hint="Budget alerts, low-allowance warnings and system updates will show up here." />
        ) : (
          <ul className="space-y-3">
            {l.data.map((n) => (
              <li key={n._id} className={`card flex items-start gap-4 !p-4 ${n.isRead ? '' : 'border-brand-200 bg-brand-50/40'}`}>
                <span className="flex h-11 min-w-[4.5rem] shrink-0 items-center justify-center rounded-xl bg-brand-700 px-2 text-[11px] font-extrabold uppercase tracking-wide text-coral-400" aria-hidden>{NOTE_LABEL[n.type] ?? 'Update'}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{n.title} {!n.isRead && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-coral-500 align-middle" aria-label="unread" />}</p>
                  <p className="text-sm text-ink-500">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{whenLabel(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  {!n.isRead && <button type="button" className="btn-secondary btn-sm" onClick={() => run(() => api.patch(`/notifications/${n._id}/read`), 'Marked as read')}>Mark read</button>}
                  <button type="button" className="btn-secondary btn-sm text-red-600" onClick={() => del.ask(n)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        ))}
      </Async>
      {del.dialog}
    </div>
  );
}
