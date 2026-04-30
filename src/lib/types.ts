export type UserRole =
  | "veterinario"
  | "productor"
  | "asesor"
  | "administrador"
  | "otro";

export interface UserProfile {
  name: string;
  email: string;
  role?: UserRole;
}

export type LotCategory =
  | "recriaMachos"
  | "recriaHembras"
  | "ternerosDestetados"
  | "novillos"
  | "vaquillonas"
  | "otro";

export interface Establishment {
  id: string;
  name: string;
  owner?: string;
  district?: string;
  province?: string;
  provinceId?: string;
  districtId?: string;
}

export interface Lot {
  id: string;
  establishmentId: string;
  name: string;
  category: LotCategory;
  headCount?: number;
}

export interface HpgRow {
  tagId: string;
  hpg: number | null;
}

export interface HpgRecord {
  rows: HpgRow[];
  notes: string;
  /** ISO date string (YYYY-MM-DD) when the sampling actually happened. */
  sampleDate?: string;
}

export type EctoLevel = "none" | "mild" | "moderate" | "severe";
export type DiarrheaLevel = "none" | "mild" | "severe";

export interface Treatment {
  date: string;
  drug: string;
  brand: string;
  route: string;
  dose: string;
  weight: string;
  criterion: string;
  bcs: string;
  ectoparasites: EctoLevel;
  ectoType: string;
  ectoDrug?: string;
  ectoRoute?: string;
  diarrhea: DiarrheaLevel;
  notes: string;
}

export interface WeightRow {
  tagId: string;
  weightKg: number | null;
}

export interface WeightRecord {
  rows: WeightRow[];
  notes: string;
}

export type VaccineType =
  | "complejoRespiratorio"
  | "complejoRespiratorioQuerato"
  | "queratoconjuntivitis"
  | "clostridial"
  | "leptospirosis";

export type VaccineDoseNumber = "1" | "2" | "3" | "refuerzo";

export interface VaccineRow {
  date: string;
  type: VaccineType | "";
  doseNumber: VaccineDoseNumber | "";
  brand: string;
  dose: string;
}

export interface VaccineRecord {
  rows: VaccineRow[];
}

export type StockSex = "macho" | "hembra";
export type StockSize = "cabeza" | "cuerpo" | "cola";
export type StockBreed =
  | "angusNegro"
  | "angusColorado"
  | "caretaNegro"
  | "caretaColorado"
  | "hereford"
  | "cruzaIndica";

export interface StockAnimal {
  caravana: string;
  origen: string;
  sexo: StockSex | "";
  peso: string;
  tamano: StockSize | "";
  raza: StockBreed | "";
  observaciones: string;
  /** Marked as dead by the user. The row stays in the lot for audit. */
  muerto?: boolean;
}

export interface StockRecord {
  rows: StockAnimal[];
}

export type MonthKey = string;

export interface DB {
  establishments: Establishment[];
  lots: Lot[];
  hpg: Record<string, Record<MonthKey, HpgRecord>>;
  treatments: Record<string, Record<MonthKey, Treatment>>;
  weights: Record<string, Record<MonthKey, WeightRecord>>;
  vaccines: Record<string, Record<MonthKey, VaccineRecord>>;
  stock: Record<string, StockRecord>;
}

export const emptyDb: DB = {
  establishments: [],
  lots: [],
  hpg: {},
  treatments: {},
  weights: {},
  vaccines: {},
  stock: {},
};
