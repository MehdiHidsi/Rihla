"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLangAction } from "@/app/actions";

export function LangSwitch({ lang }: { lang: "fr" | "ar" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (l: "fr" | "ar") =>
    start(async () => {
      await setLangAction(l);
      router.refresh();
    });
  return (
    <div role="group" aria-label="Langue" className={`flex rounded-lg border border-line bg-white p-0.5 text-xs font-bold ${pending ? "opacity-60" : ""}`}>
      {(["fr", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          aria-pressed={lang === l}
          lang={l}
          className={`min-h-9 min-w-9 rounded-md px-2 ${lang === l ? "bg-brand-700 text-white" : "text-ink hover:bg-surface"}`}
        >
          {l === "fr" ? "FR" : "AR"}
        </button>
      ))}
    </div>
  );
}
