import React from 'react';

export function ConfirmModal({ open, title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }:
  { open: boolean; title?: string; message: string; confirmText?: string; cancelText?: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm mx-4 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg shadow-xl p-5">
        <div className="text-lg font-semibold mb-2">{title}</div>
        <div className="text-slate-700 dark:text-slate-300 text-sm mb-4">{message}</div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200">{cancelText}</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
