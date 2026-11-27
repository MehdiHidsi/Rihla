"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toggleFavoriteAction } from "@/app/actions";

export function RemoveFavorite({ type, id, label }: { type: "journey" | "city" | "company"; id: number; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-ghost btn-sm text-danger"
      disabled={pending}
      aria-label={`Retirer ${label} des favoris`}
      onClick={() =>
        start(async () => {
          await toggleFavoriteAction(type, id);
          router.refresh();
        })
      }
    >
      <Trash2 size={14} aria-hidden /> Retirer
    </button>
  );
}
