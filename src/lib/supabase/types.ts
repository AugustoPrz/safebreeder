import type {
  Establishment,
  HpgRecord,
  LotCategory,
  Treatment,
  UserRole,
  Vaccine,
  WeightRecord,
} from "@/lib/types";

export type Plan = "trial" | "basic" | "pro" | "admin";

export interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export interface EstablishmentRow {
  id: string;
  user_id: string;
  name: string;
  owner: string | null;
  province: string | null;
  province_id: string | null;
  district: string | null;
  district_id: string | null;
  created_at: string;
}

export interface LotRow {
  id: string;
  user_id: string;
  establishment_id: string;
  name: string;
  category: LotCategory;
  head_count: number | null;
  created_at: string;
}

export interface HpgRow {
  lot_id: string;
  month_key: string;
  rows: HpgRecord["rows"];
  notes: string;
  updated_at: string;
}

export interface WeightRow {
  lot_id: string;
  month_key: string;
  rows: WeightRecord["rows"];
  notes: string;
  updated_at: string;
}

export interface TreatmentRow {
  lot_id: string;
  month_key: string;
  data: Treatment;
  updated_at: string;
}

export interface VaccineRow {
  lot_id: string;
  month_key: string;
  data: Vaccine;
  updated_at: string;
}

// We deliberately leave Insert/Update loose so that patch-style updates and
// partial inserts don't need casts at every call site. The runtime validation
// lives in Postgres (via the schema + RLS).
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      establishments: Table<EstablishmentRow>;
      lots: Table<LotRow>;
      hpg_records: Table<HpgRow>;
      weight_records: Table<WeightRow>;
      treatments: Table<TreatmentRow>;
      vaccines: Table<VaccineRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience: mapping between client Establishment and DB row
export function establishmentFromRow(r: EstablishmentRow): Establishment {
  return {
    id: r.id,
    name: r.name,
    owner: r.owner ?? undefined,
    province: r.province ?? undefined,
    provinceId: r.province_id ?? undefined,
    district: r.district ?? undefined,
    districtId: r.district_id ?? undefined,
  };
}

export function establishmentToInsert(
  e: Omit<Establishment, "id">,
  userId: string,
) {
  return {
    user_id: userId,
    name: e.name,
    owner: e.owner ?? null,
    province: e.province ?? null,
    province_id: e.provinceId ?? null,
    district: e.district ?? null,
    district_id: e.districtId ?? null,
  };
}
