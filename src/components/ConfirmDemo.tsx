"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-outline !border-[#ecc4be] text-danger" onClick={() => setOpen(true)}>
        Ouvrir la boîte de confirmation
      </button>
      <ConfirmDialog
        open={open}
        danger
        title="Supprimer cette compagnie ?"
        description="Cette action est définitive. Les trajets liés doivent d'abord être réassignés."
        confirmLabel="Supprimer"
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}
