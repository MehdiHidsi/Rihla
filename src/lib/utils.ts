export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function fmtDuration(min: number | null | undefined) {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return `${h}h${m ? String(m).padStart(2, "0") : ""}`;
}

export function timeToMin(t: string | null | undefined) {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function addMinutes(t: string, min: number) {
  const base = timeToMin(t) ?? 0;
  const total = base + min;
  const day = Math.floor(total / 1440);
  const r = ((total % 1440) + 1440) % 1440;
  return {
    time: `${String(Math.floor(r / 60)).padStart(2, "0")}:${String(r % 60).padStart(2, "0")}`,
    nextDay: day > 0,
  };
}

export function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export const STATUS_LABEL: Record<string, string> = {
  verified: "Vérifié",
  unverified: "Non vérifié",
  needs_review: "À vérifier",
  rejected: "Rejeté",
};

export function fmtDate(iso?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "";
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", opts ?? { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const CATEGORIES: { key: string; label: string }[] = [
  { key: "plages", label: "Plages" },
  { key: "montagnes", label: "Montagnes" },
  { key: "desert", label: "Désert" },
  { key: "historique", label: "Villes historiques" },
  { key: "nature", label: "Nature" },
  { key: "culture", label: "Culture" },
];

export const HERO_IMAGE =
  "https://images.pexels.com/photos/37700545/pexels-photo-37700545.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=2000";
export const INSPIRATION_IMAGE =
  "https://images.pexels.com/photos/37684076/pexels-photo-37684076.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400";

export function normalizeText(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
