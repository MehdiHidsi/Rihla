import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HERO_IMAGE, CATEGORIES } from "@/lib/utils";

type City = { id: number; name: string; slug: string; region: string | null; description: string | null; imageUrl: string | null; category: string | null };

export function DestinationCard({ c }: { c: City }) {
  const cat = CATEGORIES.find((x) => x.key === c.category)?.label;
  return (
    <article className="card group flex flex-col overflow-hidden">
      <Link href={`/destinations/${c.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-brand-800" tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.imageUrl ?? HERO_IMAGE} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        {cat && <span className="absolute top-3 left-3 rounded bg-white/90 px-2 py-0.5 text-[11px] font-bold text-brand-800">{cat}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold text-muted">{c.region}</p>
        <h3 className="mt-0.5 text-lg font-extrabold">{c.name}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] text-muted">{c.description}</p>
        <Link href={`/destinations/${c.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
          Explorer {c.name} <ArrowRight size={14} aria-hidden className="rtl-flip" />
        </Link>
      </div>
    </article>
  );
}
