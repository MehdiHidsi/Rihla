import { cookies } from "next/headers";

export type Lang = "fr" | "ar";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("rihla_lang")?.value;
  return c === "ar" ? "ar" : "fr";
}

const dict = {
  fr: {
    home: "Accueil",
    search: "Rechercher un trajet",
    destinations: "Destinations",
    companies: "Compagnies",
    about: "À propos",
    favorites: "Favoris",
    login: "Connexion",
    account: "Mon compte",
    heroTitle1: "Voyagez au Maroc,",
    heroTitle2: "en toute simplicité.",
    heroSub: "Comparez les trajets en autocar et trouvez votre prochaine destination.",
    from: "Ville de départ",
    to: "Destination",
    date: "Date de départ",
    pax: "Passagers",
    swap: "Inverser les villes",
    menu: "Menu",
  },
  ar: {
    home: "الرئيسية",
    search: "البحث عن رحلة",
    destinations: "الوجهات",
    companies: "الشركات",
    about: "من نحن",
    favorites: "المفضلة",
    login: "تسجيل الدخول",
    account: "حسابي",
    heroTitle1: "سافر عبر المغرب،",
    heroTitle2: "بكل بساطة.",
    heroSub: "قارن رحلات الحافلات واكتشف وجهتك القادمة.",
    from: "مدينة الانطلاق",
    to: "الوجهة",
    date: "تاريخ السفر",
    pax: "المسافرون",
    swap: "عكس المدينتين",
    menu: "القائمة",
  },
};

export type Dict = (typeof dict)["fr"];
export function t(lang: Lang): Dict {
  return dict[lang];
}
