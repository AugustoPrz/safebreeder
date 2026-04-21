import type {
  DB,
  Establishment,
  HpgRecord,
  Lot,
  LotCategory,
  Treatment,
  WeightRecord,
} from "./types";
import { emptyDb } from "./types";

const LEGACY_KEY = "pc_v3";

const LEGACY_MONTH_MAP: Record<string, string> = {
  Enero: "01",
  Febrero: "02",
  Marzo: "03",
  Abril: "04",
  Mayo: "05",
  Junio: "06",
  Julio: "07",
  Agosto: "08",
  Septiembre: "09",
  Octubre: "10",
  Noviembre: "11",
  Diciembre: "12",
};

const CATEGORY_MAP: Record<string, LotCategory> = {
  "Recría machos": "recriaMachos",
  "Recría hembras": "recriaHembras",
  "Terneros destetados": "ternerosDestetados",
  Novillos: "novillos",
  Vaquillonas: "vaquillonas",
  Otro: "otro",
};

function convertMonthKey(legacy: string): string | null {
  // Legacy format: "Abril_2024"
  const [monthName, year] = legacy.split("_");
  const monthNum = LEGACY_MONTH_MAP[monthName];
  if (!monthNum || !year) return null;
  return `${year}-${monthNum}`;
}

type LegacyEstab = {
  id: string;
  nombre: string;
  propietario?: string;
  partido?: string;
  provincia?: string;
};

type LegacyLote = {
  id: string;
  eid: string;
  nombre: string;
  cat?: string;
  cant?: number | null;
};

type LegacyHpgFila = { car?: string; p?: number | null; h?: number | null };
type LegacyHpgMes = { filas?: LegacyHpgFila[]; obs?: string };
type LegacyPesadaFila = { car?: string; p?: number | null };
type LegacyPesadaMes = { filas?: LegacyPesadaFila[]; obs?: string };
type LegacyTratamiento = Record<string, string>;

interface LegacyDb {
  e?: LegacyEstab[];
  l?: LegacyLote[];
  h?: Record<string, Record<string, LegacyHpgMes>>;
  t?: Record<string, Record<string, LegacyTratamiento>>;
  p?: Record<string, Record<string, LegacyPesadaMes>>;
}

export function convertLegacy(legacy: LegacyDb): DB {
  const db: DB = {
    ...emptyDb,
    establishments: [],
    lots: [],
    hpg: {},
    treatments: {},
    weights: {},
  };

  for (const e of legacy.e ?? []) {
    const est: Establishment = {
      id: String(e.id),
      name: e.nombre ?? "Sin nombre",
      owner: e.propietario || undefined,
      district: e.partido || undefined,
      province: e.provincia || "Buenos Aires",
    };
    db.establishments.push(est);
  }

  for (const l of legacy.l ?? []) {
    const cat = CATEGORY_MAP[l.cat ?? ""] ?? "otro";
    const lot: Lot = {
      id: String(l.id),
      establishmentId: String(l.eid),
      name: l.nombre ?? "Sin nombre",
      category: cat,
      headCount: typeof l.cant === "number" ? l.cant : undefined,
    };
    db.lots.push(lot);
  }

  for (const [lotId, months] of Object.entries(legacy.h ?? {})) {
    const byMonth: Record<string, HpgRecord> = {};
    for (const [legacyKey, mes] of Object.entries(months)) {
      const newKey = convertMonthKey(legacyKey);
      if (!newKey) continue;
      byMonth[newKey] = {
        rows: (mes.filas ?? []).map((f) => ({
          tagId: f.car ?? "",
          weightKg: typeof f.p === "number" ? f.p : null,
          hpg: typeof f.h === "number" ? f.h : null,
        })),
        notes: mes.obs ?? "",
      };
    }
    if (Object.keys(byMonth).length > 0) db.hpg[lotId] = byMonth;
  }

  for (const [lotId, months] of Object.entries(legacy.t ?? {})) {
    const byMonth: Record<string, Treatment> = {};
    for (const [legacyKey, trat] of Object.entries(months)) {
      const newKey = convertMonthKey(legacyKey);
      if (!newKey) continue;
      byMonth[newKey] = {
        date: trat.fecha ?? "",
        drug: trat.droga ?? "",
        brand: trat.comercial ?? "",
        route: trat.via ?? "",
        dose: trat.dosis ?? "",
        weight: trat.peso ?? "",
        criterion: trat.criterio ?? "",
        bcs: trat.ec ?? "",
        ectoparasites: mapEcto(trat.ecto),
        ectoType: trat.ectoTipo ?? "",
        diarrhea: mapDiarrhea(trat.diarrea),
        notes: trat.obs ?? "",
      };
    }
    if (Object.keys(byMonth).length > 0) db.treatments[lotId] = byMonth;
  }

  for (const [lotId, months] of Object.entries(legacy.p ?? {})) {
    const byMonth: Record<string, WeightRecord> = {};
    for (const [legacyKey, mes] of Object.entries(months)) {
      const newKey = convertMonthKey(legacyKey);
      if (!newKey) continue;
      byMonth[newKey] = {
        rows: (mes.filas ?? []).map((f) => ({
          tagId: f.car ?? "",
          weightKg: typeof f.p === "number" ? f.p : null,
        })),
        notes: mes.obs ?? "",
      };
    }
    if (Object.keys(byMonth).length > 0) db.weights[lotId] = byMonth;
  }

  return db;
}

function mapEcto(value?: string): "none" | "mild" | "moderate" | "severe" {
  switch (value) {
    case "Leve":
      return "mild";
    case "Moderada":
      return "moderate";
    case "Severa":
      return "severe";
    default:
      return "none";
  }
}

function mapDiarrhea(value?: string): "none" | "mild" | "severe" {
  switch (value) {
    case "Leve":
      return "mild";
    case "Severa":
      return "severe";
    default:
      return "none";
  }
}

export function readLegacyDb(): DB | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LegacyDb;
    const converted = convertLegacy(parsed);
    if (
      converted.establishments.length === 0 &&
      converted.lots.length === 0
    ) {
      return null;
    }
    return converted;
  } catch {
    return null;
  }
}
