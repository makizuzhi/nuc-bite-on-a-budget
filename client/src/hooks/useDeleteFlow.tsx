import { useState } from 'react';
import { ConfirmDialog } from '../components/Modal';
import { api, getErrorMessage } from '../lib/api';
import { useDataVersion } from './useDataVersion';
import { useToast } from './useToast';

interface Options<T> {
  path: (item: T) => string; // DELETE url for the item
  title: string;
  message: (item: T) => string;
  success: string;
}

/**
 * Custom hook: the delete flow used on every page.
 * ask(item) opens a confirmation dialog -> confirm calls DELETE -> toast + refresh.
 */
export function useDeleteFlow<T>({ path, title, message, success }: Options<T>) {
  const [target, setTarget] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const { bump } = useDataVersion();
  const toast = useToast();

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await api.delete(path(target));
      toast.success(success);
      bump();
      setTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const dialog = target ? (
    <ConfirmDialog title={title} message={message(target)} busy={busy} onConfirm={confirm} onCancel={() => setTarget(null)} />
  ) : null;

  return { ask: (item: T) => setTarget(item), dialog };
}
