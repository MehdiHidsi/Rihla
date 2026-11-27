"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  busy = false,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="confirm-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 shadow-2xl"
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-[#f8e6e3] text-danger" : "bg-amber-soft text-amber-brand"}`}>
            <TriangleAlert size={20} aria-hidden />
          </span>
          <div>
            <h2 id="confirm-title" className="text-lg font-extrabold">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
        </div>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose} type="button">
            {cancelLabel}
          </button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={busy} type="button">
            {busy ? "Patientez…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
