import { count } from "drizzle-orm";
import { db } from "@/db";
import { cities, companies, journeys, routeStops, routes, schedules, users } from "@/db/schema";
import { addMinutes, slugify } from "@/lib/utils";
import { hashPassword } from "@/lib/auth-hash";

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1000`;

type C = {
  name: string;
  region: string;
  cat: string;
  lat: number;
  lng: number;
  img?: string;
  feat?: boolean;
  desc: string;
  hl?: string;
};

const CITY_DATA: C[] = [
  { name: "Marrakech", region: "Marrakech-Safi", cat: "historique", lat: 31.6295, lng: -7.9811, img: px(37651105), feat: true,
    desc: "La ville ocre, entre médina animée, jardins et portes de l'Atlas.",
    hl: "La place Jemaa el-Fna et les souks|Les jardins Majorelle|Le palais de la Bahia|Excursions vers l'Atlas et la vallée de l'Ourika" },
  { name: "Tanger", region: "Tanger-Tétouan-Al Hoceima", cat: "culture", lat: 35.7595, lng: -5.834, img: px(39156989), feat: true,
    desc: "Porte du détroit de Gibraltar, entre médina, corniche et héritage littéraire.",
    hl: "La médina et la Kasbah|Le Cap Spartel et les grottes d'Hercule|Le café Hafa|La baie et la plage urbaine" },
  { name: "Chefchaouen", region: "Tanger-Tétouan-Al Hoceima", cat: "montagnes", lat: 35.1688, lng: -5.2636, img: px(25070537), feat: true,
    desc: "La perle bleue du Rif, nichée au pied des montagnes.",
    hl: "La médina aux ruelles bleues|La place Outa el Hammam|La cascade d'Akchour|Le parc national de Talassemtane" },
  { name: "Agadir", region: "Souss-Massa", cat: "plages", lat: 30.4278, lng: -9.5981, img: px(30557503), feat: true,
    desc: "Grande baie balnéaire de l'Atlantique, idéale pour le soleil et le surf voisin.",
    hl: "La grande plage et sa promenade|La Kasbah d'Agadir Oufella|Taghazout et ses spots de surf|La vallée du Souss" },
  { name: "Essaouira", region: "Marrakech-Safi", cat: "plages", lat: 31.5085, lng: -9.7595, img: px(31070248), feat: true,
    desc: "Cité des alizés, médina fortifiée classée à l'UNESCO et port de pêche.",
    hl: "La médina fortifiée (UNESCO)|Le port de pêche|La Skala de la Ville|Les plages et le vent" },
  { name: "Ouarzazate", region: "Drâa-Tafilalet", cat: "desert", lat: 30.9189, lng: -6.8934, img: px(35548676), feat: true,
    desc: "Porte du désert et de la route des kasbahs.",
    hl: "La Kasbah de Taourirt|Aït Ben Haddou (UNESCO)|Les studios de cinéma|La route des kasbahs" },
  { name: "Fès", region: "Fès-Meknès", cat: "historique", lat: 34.0331, lng: -5.0003, img: px(38112312), feat: true,
    desc: "Capitale spirituelle et plus grande médina piétonne du monde.",
    hl: "Fès el-Bali (UNESCO)|Les tanneries Chouara|La médersa Bou Inania|L'université Al Quaraouiyine" },
  { name: "Rabat", region: "Rabat-Salé-Kénitra", cat: "historique", lat: 34.0209, lng: -6.8416, img: px(30411801), feat: true,
    desc: "Capitale du Royaume, élégante et tournée vers l'océan.",
    hl: "La tour Hassan et le mausolée Mohammed V|La Kasbah des Oudayas|Le site du Chellah|La médina et la corniche" },
  { name: "Casablanca", region: "Casablanca-Settat", cat: "culture", lat: 33.5731, lng: -7.5898, desc: "Métropole économique, carrefour du réseau d'autocars du Royaume.",
    hl: "La mosquée Hassan II|La corniche d'Aïn Diab|Le quartier Art déco|Le marché central" },
  { name: "Meknès", region: "Fès-Meknès", cat: "historique", lat: 33.8935, lng: -5.5473, desc: "Ville impériale aux portes monumentales, proche de Volubilis." },
  { name: "Oujda", region: "Oriental", cat: "culture", lat: 34.6814, lng: -1.9086, desc: "Grande ville de l'Oriental, proche de la frontière algérienne." },
  { name: "Tétouan", region: "Tanger-Tétouan-Al Hoceima", cat: "culture", lat: 35.5785, lng: -5.3684, desc: "La colombe blanche, médina andalouse classée à l'UNESCO." },
  { name: "El Jadida", region: "Casablanca-Settat", cat: "plages", lat: 33.2316, lng: -8.5007, desc: "Cité portugaise classée à l'UNESCO, sur la côte atlantique." },
  { name: "Kénitra", region: "Rabat-Salé-Kénitra", cat: "nature", lat: 34.261, lng: -6.5802, desc: "Ville du Gharb, étape fréquente sur l'axe Rabat–Tanger." },
  { name: "Mohammedia", region: "Casablanca-Settat", cat: "plages", lat: 33.6866, lng: -7.383, desc: "Ville des fleurs, à mi-chemin entre Casablanca et Rabat." },
  { name: "Settat", region: "Casablanca-Settat", cat: "culture", lat: 33.001, lng: -7.6166, desc: "Étape sur l'axe Casablanca–Marrakech." },
  { name: "Ben Guerir", region: "Marrakech-Safi", cat: "culture", lat: 32.236, lng: -7.9533, desc: "Étape sur l'axe Casablanca–Marrakech." },
  { name: "Asilah", region: "Tanger-Tétouan-Al Hoceima", cat: "plages", lat: 35.465, lng: -6.034, desc: "Petite cité côtière aux remparts blancs et aux fresques." },
  { name: "Larache", region: "Tanger-Tétouan-Al Hoceima", cat: "plages", lat: 35.1932, lng: -6.1557, desc: "Ville atlantique du nord, proche des ruines de Lixus." },
  { name: "Ouezzane", region: "Tanger-Tétouan-Al Hoceima", cat: "montagnes", lat: 34.7969, lng: -5.5783, desc: "Ville sainte au pied du Rif occidental." },
  { name: "Béni Mellal", region: "Béni Mellal-Khénifra", cat: "montagnes", lat: 32.3373, lng: -6.3498, desc: "Au pied du Moyen Atlas, étape entre Fès et Marrakech." },
  { name: "Ifrane", region: "Fès-Meknès", cat: "nature", lat: 33.5228, lng: -5.1106, desc: "Petite ville de montagne et forêts de cèdres." },
  { name: "Taroudant", region: "Souss-Massa", cat: "historique", lat: 30.4702, lng: -8.877, desc: "Remparts ocre dans la plaine du Souss." },
  { name: "Safi", region: "Marrakech-Safi", cat: "culture", lat: 32.2994, lng: -9.2372, desc: "Port atlantique et capitale de la poterie." },
  { name: "Al Hoceima", region: "Tanger-Tétouan-Al Hoceima", cat: "plages", lat: 35.2517, lng: -3.9372, desc: "Station balnéaire du Rif méditerranéen." },
  { name: "Errachidia", region: "Drâa-Tafilalet", cat: "desert", lat: 31.9314, lng: -4.4244, desc: "Porte du Tafilalet et des dunes de l'Erg Chebbi." },
  { name: "Merzouga", region: "Drâa-Tafilalet", cat: "desert", lat: 31.0802, lng: -4.0137, desc: "Village au pied des dunes de l'Erg Chebbi." },
];

const COMPANY_DATA = [
  { name: "CTM", website: "https://www.ctm.ma", description: "Compagnie de Transports Marocains : autocars interurbains sur de nombreuses lignes nationales." },
  { name: "Supratours", website: "https://www.supratours.ma", description: "Filiale de l'ONCF : lignes d'autocars complémentaires au réseau ferroviaire." },
  { name: "SATAS", website: null, description: "Transporteur d'autocars interurbains au Maroc." },
  { name: "Ghazala", website: null, description: "Transporteur d'autocars interurbains au Maroc." },
];

// [A, B, durée (min), arrêts de A vers B, compagnies]
const ROUTES: [string, string, number, string[], number[]][] = [
  ["Casablanca", "Marrakech", 210, ["Settat", "Ben Guerir"], [0, 1, 2, 3]],
  ["Casablanca", "Rabat", 75, ["Mohammedia"], [0, 1, 3]],
  ["Rabat", "Tanger", 210, ["Kénitra", "Asilah"], [0, 1, 2]],
  ["Fès", "Marrakech", 480, ["Meknès", "Béni Mellal"], [0, 1]],
  ["Agadir", "Marrakech", 270, [], [0, 1, 2]],
  ["Casablanca", "Agadir", 480, ["Marrakech"], [0, 1, 3]],
  ["Casablanca", "Fès", 300, ["Rabat", "Meknès"], [0, 1, 2]],
  ["Marrakech", "Essaouira", 180, [], [0, 1]],
  ["Tanger", "Chefchaouen", 165, [], [0]],
  ["Casablanca", "Tanger", 330, ["Rabat", "Kénitra", "Asilah"], [0, 1]],
  ["Marrakech", "Ouarzazate", 240, [], [0, 2]],
  ["Fès", "Chefchaouen", 240, ["Ouezzane"], [0]],
  ["Casablanca", "El Jadida", 120, [], [0, 1]],
  ["Rabat", "Fès", 210, ["Meknès"], [0, 1]],
];

const SLOTS = ["06:00", "07:30", "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00", "23:00"];

let seedPromise: Promise<void> | null = null;
export function ensureSeed() {
  if (!seedPromise) {
    seedPromise = run().catch((e) => {
      seedPromise = null;
      throw e;
    });
  }
  return seedPromise;
}

async function run() {
  const [{ n }] = await db.select({ n: count() }).from(cities);
  if (n > 0) return;

  await db.insert(users).values({
    name: "Administrateur Rihla",
    email: "admin@rihla.ma",
    passwordHash: hashPassword("Admin2026!"),
    role: "admin",
  });

  const cityRows = await db
    .insert(cities)
    .values(
      CITY_DATA.map((c) => ({
        name: c.name,
        slug: slugify(c.name),
        region: c.region,
        category: c.cat,
        description: c.desc,
        highlights: c.hl ?? null,
        imageUrl: c.img ?? null,
        lat: c.lat,
        lng: c.lng,
        featured: c.feat ? 1 : 0,
        status: "verified",
      }))
    )
    .returning();
  const cityId = new Map(cityRows.map((c) => [c.name, c.id]));

  const companyRows = await db
    .insert(companies)
    .values(
      COMPANY_DATA.map((c) => ({
        name: c.name,
        slug: slugify(c.name),
        website: c.website,
        description: c.description,
        source: "Données de démonstration",
        status: "needs_review",
        notes: "Coordonnées à compléter et à vérifier auprès de l'opérateur.",
      }))
    )
    .returning();

  let seq = 0;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (const [a, b, dur, stops, cos] of ROUTES) {
    for (const dir of [0, 1]) {
      const from = dir === 0 ? a : b;
      const to = dir === 0 ? b : a;
      const stopList = dir === 0 ? stops : [...stops].reverse();
      for (const ci of cos) {
        const company = companyRows[ci];
        const [route] = await db
          .insert(routes)
          .values({ companyId: company.id, departureCityId: cityId.get(from)!, arrivalCityId: cityId.get(to)! })
          .returning();
        if (stopList.length) {
          await db.insert(routeStops).values(
            stopList.map((s, i) => ({ routeId: route.id, stopCityId: cityId.get(s)!, stopOrder: i + 1 }))
          );
        }
        const nDep = 2 + Math.floor(rnd() * 3);
        const picked = new Set<string>();
        while (picked.size < nDep) picked.add(SLOTS[Math.floor(rnd() * SLOTS.length)]);
        const times = [...picked].sort();
        const d = dur + (ci - 1) * 10;
        const rows = times.map((time) => {
          seq++;
          const mod = seq % 4;
          const missingArrival = seq % 6 === 0;
          const missingDeparture = seq % 29 === 0;
          let status = mod === 0 ? "verified" : mod === 2 ? "needs_review" : "unverified";
          let problem: string | null = null;
          if (missingArrival) {
            status = "needs_review";
            problem = "Heure d'arrivée manquante";
          } else if (missingDeparture) {
            status = "needs_review";
            problem = "Heure de départ manquante";
          } else if (status === "needs_review") {
            problem = "Horaire à confirmer auprès de l'opérateur";
          }
          const arr = missingArrival ? null : addMinutes(time, d).time;
          return {
            companyId: company.id,
            routeId: route.id,
            departureCityId: cityId.get(from)!,
            arrivalCityId: cityId.get(to)!,
            departureTime: missingDeparture ? null : time,
            arrivalTime: arr,
            durationMinutes: missingArrival ? null : d,
            verificationStatus: status,
            source: "Données de démonstration",
            sourceUrl: status === "verified" ? company.website : null,
            problem,
          };
        });
        const inserted = await db.insert(journeys).values(rows).returning({ id: journeys.id, st: journeys.verificationStatus });
        const sched = inserted
          .filter((j) => j.st === "verified")
          .map((j) => ({ journeyId: j.id, operatingDays: "Tous les jours", scheduleDetails: "Donnée de démonstration" }));
        if (sched.length) await db.insert(schedules).values(sched);
      }
    }
  }
}
