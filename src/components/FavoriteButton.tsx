"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/app/actions";

export function FavoriteButton({
  type,
  id,
  initial,
  variant = "icon",
  label,
}: {
  type: "journey" | "city" | "company";
  id: number;
  initial: boolean;
  variant?: "icon" | "pill";
  label?: string;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const path = usePathname();

  function click() {
    start(async () => {
      const r = await toggleFavoriteAction(type, id);
      if (r.needLogin) {
        router.push(`/connexion?next=${encodeURIComponent(path)}`);
        return;
      }
      setFav(r.fav!);
    });
  }
  const text = fav ? "Retirer des favoris" : (label ?? "Ajouter aux favoris");
  if (variant === "pill") {
    return (
      <button onClick={click} disabled={pending} aria-pressed={fav} className="btn btn-outline">
        <Heart size={16} aria-hidden className={fav ? "fill-danger text-danger" : ""} /> {fav ? "Dans vos favoris" : text}
      </button>
    );
  }
  return (
    <button
      onClick={click}
      disabled={pending}
      aria-pressed={fav}
      aria-label={text}
      title={text}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white hover:bg-surface"
    >
      <Heart size={17} aria-hidden className={fav ? "fill-danger text-danger" : "text-muted"} />
    </button>
  );
}
