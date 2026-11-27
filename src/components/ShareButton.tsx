"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* annulé */
    }
  }
  return (
    <button onClick={share} className="btn btn-outline">
      {done ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />}
      <span aria-live="polite">{done ? "Lien copié" : "Partager"}</span>
    </button>
  );
}
