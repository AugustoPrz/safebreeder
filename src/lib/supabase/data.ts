"use client";

import { supabaseBrowser } from "./browser";
import {
  establishmentFromRow,
  establishmentToInsert,
  type EstablishmentRow,
  type HpgRow as HpgTableRow,
  type LotRow,
  type StockRow as StockTableRow,
  type TreatmentRow,
  type VaccineRow as VaccineTableRow,
  type WeightRow as WeightTableRow,
} from "./types";
import type {
  DB,
  Establishment,
  HpgRecord,
  Lot,
  StockRecord,
  Treatment,
  VaccineRecord,
  WeightRecord,
} from "@/lib/types";
import { emptyDb } from "@/lib/types";

export async function fetchAllForUser(userId: string): Promise<DB> {
  const sb = supabaseBrowser();

  const [estRes, lotRes] = await Promise.all([
    sb.from("establishments").select("*").eq("user_id", userId),
    sb.from("lots").select("*").eq("user_id", userId),
  ]);

  if (estRes.error) throw estRes.error;
  if (lotRes.error) throw lotRes.error;

  const estRows = (estRes.data ?? []) as EstablishmentRow[];
  const lotRows = (lotRes.data ?? []) as LotRow[];
  const establishments: Establishment[] = estRows.map(establishmentFromRow);
  const lots: Lot[] = lotRows.map((r) => ({
    id: r.id,
    establishmentId: r.establishment_id,
    name: r.name,
    category: r.category,
    headCount: r.head_count ?? undefined,
  }));

  const lotIds = lots.map((l) => l.id);
  if (lotIds.length === 0) {
    return { ...emptyDb, establishments, lots };
  }

  const [hpgRes, wRes, tRes, vRes, sRes] = await Promise.all([
    sb.from("hpg_records").select("*").in("lot_id", lotIds),
    sb.from("weight_records").select("*").in("lot_id", lotIds),
    sb.from("treatments").select("*").in("lot_id", lotIds),
    sb.from("vaccines").select("*").in("lot_id", lotIds),
    sb.from("stock").select("*").in("lot_id", lotIds),
  ]);

  if (hpgRes.error) throw hpgRes.error;
  if (wRes.error) throw wRes.error;
  if (tRes.error) throw tRes.error;
  if (vRes.error) throw vRes.error;
  // Stock table may not exist yet (migration 007 not run). Treat as empty.
  const sData = sRes.error ? [] : ((sRes.data ?? []) as StockTableRow[]);

  const hpg: DB["hpg"] = {};
  for (const row of (hpgRes.data ?? []) as HpgTableRow[]) {
    hpg[row.lot_id] ??= {};
    hpg[row.lot_id][row.month_key] = {
      rows: row.rows ?? [],
      notes: row.notes ?? "",
      sampleDate: row.sample_date ?? undefined,
    };
  }

  const weights: DB["weights"] = {};
  for (const row of (wRes.data ?? []) as WeightTableRow[]) {
    weights[row.lot_id] ??= {};
    weights[row.lot_id][row.month_key] = {
      rows: row.rows ?? [],
      notes: row.notes ?? "",
    };
  }

  const treatments: DB["treatments"] = {};
  for (const row of (tRes.data ?? []) as TreatmentRow[]) {
    treatments[row.lot_id] ??= {};
    treatments[row.lot_id][row.month_key] = row.data;
  }

  const vaccines: DB["vaccines"] = {};
  for (const row of (vRes.data ?? []) as VaccineTableRow[]) {
    vaccines[row.lot_id] ??= {};
    // Backward-compat: row.data may be the legacy single-vaccine shape.
    // Coerce to { rows: [...] } when needed.
    const data = row.data as unknown;
    if (data && typeof data === "object" && Array.isArray((data as { rows?: unknown }).rows)) {
      vaccines[row.lot_id][row.month_key] = data as VaccineRecord;
    } else {
      vaccines[row.lot_id][row.month_key] = { rows: [] };
    }
  }

  const stock: DB["stock"] = {};
  for (const row of sData) {
    stock[row.lot_id] = { rows: row.rows ?? [] };
  }

  return { establishments, lots, hpg, weights, treatments, vaccines, stock };
}

export async function insertEstablishment(
  userId: string,
  input: Omit<Establishment, "id">,
): Promise<Establishment> {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("establishments")
    .insert(establishmentToInsert(input, userId))
    .select()
    .single();
  if (error) throw error;
  return establishmentFromRow(data as EstablishmentRow);
}

export async function insertEstablishmentWithId(
  userId: string,
  est: Establishment,
) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("establishments").insert({
    id: est.id,
    ...establishmentToInsert(est, userId),
  });
  if (error) throw error;
}

export async function updateEstablishment(
  id: string,
  patch: Partial<Omit<Establishment, "id">>,
) {
  const sb = supabaseBrowser();
  const { error } = await sb
    .from("establishments")
    .update({
      name: patch.name,
      owner: patch.owner ?? null,
      province: patch.province ?? null,
      province_id: patch.provinceId ?? null,
      district: patch.district ?? null,
      district_id: patch.districtId ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEstablishment(id: string) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("establishments").delete().eq("id", id);
  if (error) throw error;
}

export async function insertLot(
  userId: string,
  input: Omit<Lot, "id">,
): Promise<Lot> {
  const sb = supabaseBrowser();
  const { data, error } = await sb
    .from("lots")
    .insert({
      user_id: userId,
      establishment_id: input.establishmentId,
      name: input.name,
      category: input.category,
      head_count: input.headCount ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    establishmentId: data.establishment_id,
    name: data.name,
    category: data.category,
    headCount: data.head_count ?? undefined,
  };
}

export async function insertLotWithId(userId: string, lot: Lot) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("lots").insert({
    id: lot.id,
    user_id: userId,
    establishment_id: lot.establishmentId,
    name: lot.name,
    category: lot.category,
    head_count: lot.headCount ?? null,
  });
  if (error) throw error;
}

export async function updateLot(id: string, patch: Partial<Omit<Lot, "id">>) {
  const sb = supabaseBrowser();
  const { error } = await sb
    .from("lots")
    .update({
      name: patch.name,
      category: patch.category,
      head_count: patch.headCount ?? null,
      establishment_id: patch.establishmentId,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLot(id: string) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("lots").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertHpg(
  lotId: string,
  monthKey: string,
  record: HpgRecord,
) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("hpg_records").upsert({
    lot_id: lotId,
    month_key: monthKey,
    rows: record.rows,
    notes: record.notes,
    sample_date: record.sampleDate ?? null,
  });
  if (error) throw error;
}

export async function upsertWeights(
  lotId: string,
  monthKey: string,
  record: WeightRecord,
) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("weight_records").upsert({
    lot_id: lotId,
    month_key: monthKey,
    rows: record.rows,
    notes: record.notes,
  });
  if (error) throw error;
}

export async function upsertTreatment(
  lotId: string,
  monthKey: string,
  data: Treatment,
) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("treatments").upsert({
    lot_id: lotId,
    month_key: monthKey,
    data,
  });
  if (error) throw error;
}

export async function upsertVaccine(
  lotId: string,
  monthKey: string,
  data: VaccineRecord,
) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("vaccines").upsert({
    lot_id: lotId,
    month_key: monthKey,
    data,
  });
  if (error) throw error;
}

export async function upsertStock(lotId: string, record: StockRecord) {
  const sb = supabaseBrowser();
  const { error } = await sb.from("stock").upsert({
    lot_id: lotId,
    rows: record.rows,
  });
  if (error) throw error;
}
