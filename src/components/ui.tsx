import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  CircleHelp,
  TriangleAlert,
  ChevronRight,
  Ban,
  Megaphone,
  Info,
  FlaskConical,
} from "lucide-react";
import { STATUS_LABEL, initials } from "@/lib/utils";

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const map: Record<string, { cls: string; icon: ReactNode }> = {
    verified: { cls: "bg-[#e5f2ea] text-[#1f6a3f] border-[#c3dfcf]", icon: <BadgeCheck size={13} aria-hidden /> },
    unverified: { cls: "bg-surface text-muted border-line", icon: <CircleHelp size={13} aria-hidden /> },
    needs_review: { cls: "bg-amber-soft text-[#8a560f] border-[#efd9a8]", icon: <TriangleAlert size={13} aria-hidden /> },
    rejected: { cls: "bg-[#f8e6e3] text-danger border-[#ecc4be]", icon: <Ban size={13} aria-hidden /> },
  };
  const m = map[status] ?? map.unverified;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${m.cls} ${className}`}>
      {m.icon}
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const AVATAR_COLORS = ["#0f5037", "#8a560f", "#2c4a63", "#6b3a4a", "#3d5a2e", "#4b3f72"];
export function CompanyAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-extrabold text-white"
      style={{ width: size, height: size, background: AVATAR_COLORS[idx], fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 text-[13px] text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {it.href ? (
              <Link href={it.href} className="hover:text-brand-700 hover:underline">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink">
                {it.label}
              </span>
            )}
            {i < items.length - 1 && <ChevronRight size={14} aria-hidden className="rtl-flip" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
  tone = "neutral",
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
  tone?: "neutral" | "error" | "warn";
}) {
  const tones = {
    neutral: "bg-brand-50 text-brand-700",
    error: "bg-[#f8e6e3] text-danger",
    warn: "bg-amber-soft text-amber-brand",
  };
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${tones[tone]}`}>{icon ?? <Info />}</span>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {text && <p className="mt-1.5 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function DemoNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-lg border border-[#efd9a8] bg-amber-soft px-3 py-2 text-[13px] text-[#6f4710] ${className}`}
    >
      <FlaskConical size={16} className="mt-0.5 shrink-0" aria-hidden />
      <p>
        <strong>Aperçu avec données de démonstration.</strong> Les horaires affichés ne sont pas des informations officielles :
        confirmez-les auprès de l&apos;opérateur avant de voyager.
      </p>
    </div>
  );
}

export function SponsoredSlot({ variant = "banner" }: { variant?: "banner" | "card" }) {
  if (variant === "card") {
    return (
      <aside aria-label="Espace publicitaire" className="flex flex-col justify-between rounded-xl border border-dashed border-[#d8c9a3] bg-[#fdf9ef] p-5">
        <div>
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-brand uppercase ring-1 ring-[#e8d9b0]">
            <Megaphone size={11} aria-hidden /> Sponsorisé
          </span>
          <h3 className="mt-3 text-base font-extrabold">Votre hôtel, riad ou agence ici</h3>
          <p className="mt-1 text-sm text-muted">Emplacement réservé aux partenaires locaux. Clairement identifié, jamais mélangé aux résultats.</p>
        </div>
        <Link href="/aide#contact" className="mt-4 text-sm font-bold text-brand-700 hover:underline">
          Devenir partenaire →
        </Link>
      </aside>
    );
  }
  return (
    <aside
      aria-label="Espace publicitaire"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#d8c9a3] bg-[#fdf9ef] px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-brand uppercase ring-1 ring-[#e8d9b0]">
          <Megaphone size={11} aria-hidden /> Publicité
        </span>
        <p className="text-sm text-muted">Espace partenaire — séparé des résultats de recherche.</p>
      </div>
      <Link href="/aide#contact" className="text-sm font-bold text-brand-700 hover:underline">
        Annoncer sur Rihla
      </Link>
    </aside>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function SocialIcon({ name, size = 18 }: { name: "facebook" | "instagram" | "x"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "facebook")
    return (
      <svg {...common}>
        <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8z" />
      </svg>
    );
  if (name === "instagram")
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="h-display text-2xl sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pages);
  return (
    <nav aria-label="Pagination" className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className="btn btn-outline btn-sm">
          Précédent
        </Link>
      )}
      {nums.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && nums[i - 1] !== p - 1 && <span className="text-muted">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`btn btn-sm min-w-9 ${p === page ? "btn-primary" : "btn-outline"}`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={hrefFor(page + 1)} className="btn btn-outline btn-sm">
          Suivant
        </Link>
      )}
    </nav>
  );
}
