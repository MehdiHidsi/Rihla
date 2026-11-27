import { MapPinned } from "lucide-react";

type Pt = { name: string; lat: number | null; lng: number | null };

/** Schéma indicatif d'un itinéraire (projection simple). À remplacer par une carte OpenStreetMap (Leaflet / MapLibre). */
export function RouteMap({ points }: { points: Pt[] }) {
  const pts = points.filter((p) => p.lat !== null && p.lng !== null) as { name: string; lat: number; lng: number }[];
  const W = 640;
  const H = 300;
  if (pts.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg bg-surface text-sm text-muted">Coordonnées indisponibles pour ce trajet.</div>
    );
  }
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const k = Math.cos((((Math.min(...lats) + Math.max(...lats)) / 2) * Math.PI) / 180);
  const spanX = Math.max((Math.max(...lngs) - Math.min(...lngs)) * k, 0.3);
  const spanY = Math.max(Math.max(...lats) - Math.min(...lats), 0.3);
  const pad = 70;
  const scale = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
  const offX = (W - spanX * scale) / 2;
  const offY = (H - spanY * scale) / 2;
  const xy = pts.map((p) => ({
    ...p,
    x: offX + (p.lng - Math.min(...lngs)) * k * scale,
    y: offY + (Math.max(...lats) - p.lat) * scale,
  }));
  const path = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <figure>
      <div className="relative overflow-hidden rounded-lg border border-line bg-[#eef2ec]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Schéma du trajet ${pts[0].name} vers ${pts[pts.length - 1].name}`}>
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="#dde5da" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" />
          <path d={path} fill="none" stroke="#0f5037" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 9" opacity="0.35" />
          <path d={path} fill="none" stroke="#0f5037" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {xy.map((p, i) => {
            const end = i === 0 || i === xy.length - 1;
            const right = p.x < W * 0.7;
            return (
              <g key={p.name + i}>
                <circle cx={p.x} cy={p.y} r={end ? 8 : 5} fill={i === xy.length - 1 ? "#b9791f" : end ? "#0f5037" : "#fff"} stroke={end ? "#fff" : "#0f5037"} strokeWidth={end ? 3 : 2.5} />
                <text x={p.x + (right ? 13 : -13)} y={p.y + 4} textAnchor={right ? "start" : "end"} fontSize={end ? 14 : 12} fontWeight={end ? 800 : 600} fill="#1d2320" stroke="#eef2ec" strokeWidth="4" paintOrder="stroke">
                  {p.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-2 flex items-start gap-1.5 text-xs text-muted">
        <MapPinned size={13} className="mt-0.5 shrink-0" aria-hidden />
        Schéma indicatif de l&apos;itinéraire — non géolocalisé. Emplacement prévu pour une carte OpenStreetMap ; aucun suivi GPS en temps réel.
      </figcaption>
    </figure>
  );
}
