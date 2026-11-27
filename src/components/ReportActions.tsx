"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { resolveReportAction } from "@/app/admin/actions";

export function ReportActions({ id }: { id: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (s: "resolved" | "dismissed") =>
    start(async () => {
      await resolveReportAction(id, s);
      router.refresh();
    });
  return (
    <div className="flex gap-2">
      <button className="btn btn-outline btn-sm" disabled={pending} onClick={() => go("resolved")}>
        <Check size={14} aria-hidden /> Traité
      </button>
      <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => go("dismissed")}>
        <X size={14} aria-hidden /> Ignorer
      </button>
    </div>
  );
}
