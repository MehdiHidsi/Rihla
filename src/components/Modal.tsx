"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ open, title, onClose, children, wide = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
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
      aria-labelledby="modal-title"
      className={`m-auto max-h-[92vh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl p-0 shadow-2xl ${wide ? "max-w-3xl" : "max-w-xl"}`}
    >
      {open && (
        <div>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
            <h2 id="modal-title" className="text-lg font-extrabold">
              {title}
            </h2>
            <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 hover:bg-surface">
              <X size={18} aria-hidden />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
