import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="RIHLA MAROC" className="shrink-0">
      <rect width="48" height="48" rx="12" fill="#0f5037" />
      <path d="M13 38V25a11 11 0 1 1 22 0v13" fill="none" stroke="#faf8f3" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M24 38c0-5 6-6 4-11-2-4-6-4-4-9"
        fill="none"
        stroke="#e0a43a"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="0.1 4.6"
      />
      <circle cx="24" cy="17.5" r="2.6" fill="#e0a43a" />
    </svg>
  );
}

export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="RIHLA MAROC — Accueil">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={`text-[19px] font-extrabold tracking-tight ${light ? "text-white" : "text-brand-800"}`}>RIHLA</span>
        <span className={`mt-0.5 text-[10px] font-bold tracking-[0.32em] ${light ? "text-[#e0a43a]" : "text-amber-brand"}`}>MAROC</span>
      </span>
    </Link>
  );
}
