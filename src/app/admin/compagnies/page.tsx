import { Search } from "lucide-react";
import { PageHeader, Pagination, EmptyState } from "@/components/ui";
import { CompaniesManager } from "@/components/AdminCrud";
import { listCompanies } from "@/lib/queries";
import { fmtDateTime, normalizeText } from "@/lib/utils";
import { Building2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
const PAGE = 10;

export default async function AdminCompanies({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  let rows = await listCompanies();
  const total = rows.length;
  rows = rows.filter((c) => (!sp.q || normalizeText(c.name).includes(normalizeText(sp.q))) && (!sp.status || c.status === sp.status));
  const sort = sp.sort ?? "name";
  rows.sort((a, b) =>
    sort === "routes" ? b.stats.routes - a.stats.routes : sort === "updated" ? b.updatedAt.getTime() - a.updatedAt.getTime() : a.name.localeCompare(b.name)
  );
  const page = Math.max(1, Number(sp.page) || 1);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice((page - 1) * PAGE, page * PAGE);
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, page: String(p) })) if (v) q.set(k, v);
    return `/admin/compagnies?${q}`;
  };
  return (
    <>
      <PageHeader title="Compagnies" subtitle={`${total} compagnie(s) enregistrée(s).`} />
      <form className="card mb-4 grid items-end gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr_auto]" role="search">
        <div>
          <label htmlFor="q" className="label">Rechercher</label>
          <input id="q" name="q" defaultValue={sp.q} className="field" placeholder="Nom de la compagnie" />
        </div>
        <div>
          <label htmlFor="status" className="label">Statut</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="field">
            <option value="">Tous</option>
            <option value="verified">Vérifié</option>
            <option value="unverified">Non vérifié</option>
            <option value="needs_review">À vérifier</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="label">Trier par</label>
          <select id="sort" name="sort" defaultValue={sort} className="field">
            <option value="name">Nom</option>
            <option value="routes">Nombre de lignes</option>
            <option value="updated">Dernière mise à jour</option>
          </select>
        </div>
        <button className="btn btn-primary">
          <Search size={15} aria-hidden /> Filtrer
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<Building2 />} title="Aucune compagnie" text="Aucun résultat pour ces critères." action={<Link href="/admin/compagnies" className="btn btn-primary">Réinitialiser</Link>} />
      ) : (
        <CompaniesManager
          rows={slice.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            website: c.website,
            facebook: c.facebook,
            instagram: c.instagram,
            description: c.description,
            notes: c.notes,
            source: c.source,
            status: c.status,
            updatedAt: fmtDateTime(c.updatedAt),
            routes: c.stats.routes,
            cities: c.stats.cities,
          }))}
        />
      )}
      <Pagination page={page} pages={pages} hrefFor={href} />
    </>
  );
}
