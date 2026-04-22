import type { LotCategory } from "./types";

export const LOT_CATEGORIES: LotCategory[] = [
  "recriaMachos",
  "recriaHembras",
  "ternerosDestetados",
  "novillos",
  "vaquillonas",
  "otro",
];

export const DRUGS = [
  "Ivermectina",
  "Doramectina",
  "Abamectina",
  "Moxidectina",
  "Levamisol",
  "Fenbendazol",
  "Albendazol",
  "Ricobendazol",
  "Closantel",
  "Combinado",
  "Otro",
];

export const ROUTES = [
  "Subcutánea",
  "Pour-on",
  "Oral",
  "Intramuscular",
  "Endovenosa",
];

export const DOSING_CRITERIA = [
  "El más pesado del lote",
  "Peso individual",
  "Peso promedio",
  "El más pesado por categoría",
];

export const BCS_OPTIONS = [
  "1 — Muy flaco",
  "2 — Flaco",
  "3 — Normal",
  "4 — Bueno",
  "5 — Gordo",
];

export const HPG_THRESHOLD_LOW = 150;
export const HPG_THRESHOLD_HIGH = 500;
