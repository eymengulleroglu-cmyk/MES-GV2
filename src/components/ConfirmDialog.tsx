import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Onayla", cancelLabel = "İptal", danger = true, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onCancel}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="card p-5 w-full max-w-md space-y-3 outline-none" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="text-lg font-bold" style={{ color: danger ? "var(--danger)" : "var(--text)" }}>{title}</h2>
        <p className="text-sm text-muted">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-ghost">{cancelLabel}</button>
          <button onClick={onConfirm} className={danger ? "btn-danger" : "btn-primary"}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
