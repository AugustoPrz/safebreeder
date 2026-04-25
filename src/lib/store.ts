"use client";

import { create } from "zustand";
import type {
  DB,
  Establishment,
  HpgRecord,
  HpgRow,
  Lot,
  MonthKey,
  Treatment,
  VaccineRecord,
  WeightRecord,
  WeightRow,
} from "./types";
import { emptyDb } from "./types";
import * as remote from "./supabase/data";

interface StoreState {
  db: DB;
  hydrated: boolean;
  userId: string | null;

  setUserId: (userId: string | null) => void;
  setHydrated: (h: boolean) => void;

  addEstablishment: (input: Omit<Establishment, "id">) => Establishment;
  updateEstablishment: (
    id: string,
    patch: Partial<Omit<Establishment, "id">>,
  ) => void;
  deleteEstablishment: (id: string) => void;

  addLot: (input: Omit<Lot, "id">) => Lot;
  updateLot: (id: string, patch: Partial<Omit<Lot, "id">>) => void;
  deleteLot: (id: string) => void;

  setHpgMonth: (lotId: string, monthKey: MonthKey, record: HpgRecord) => void;
  addHpgRow: (lotId: string, monthKey: MonthKey, row?: Partial<HpgRow>) => void;
  updateHpgRow: (
    lotId: string,
    monthKey: MonthKey,
    index: number,
    patch: Partial<HpgRow>,
  ) => void;
  deleteHpgRow: (lotId: string, monthKey: MonthKey, index: number) => void;
  setHpgNotes: (lotId: string, monthKey: MonthKey, notes: string) => void;

  setTreatment: (lotId: string, monthKey: MonthKey, t: Treatment) => void;
  updateTreatment: (
    lotId: string,
    monthKey: MonthKey,
    patch: Partial<Treatment>,
  ) => void;

  setVaccineMonth: (
    lotId: string,
    monthKey: MonthKey,
    record: VaccineRecord,
  ) => void;

  setWeightMonth: (
    lotId: string,
    monthKey: MonthKey,
    record: WeightRecord,
  ) => void;
  addWeightRow: (
    lotId: string,
    monthKey: MonthKey,
    row?: Partial<WeightRow>,
  ) => void;
  updateWeightRow: (
    lotId: string,
    monthKey: MonthKey,
    index: number,
    patch: Partial<WeightRow>,
  ) => void;
  deleteWeightRow: (lotId: string, monthKey: MonthKey, index: number) => void;
  setWeightNotes: (lotId: string, monthKey: MonthKey, notes: string) => void;

  replaceDb: (db: DB) => void;
  resetStore: () => void;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (very rare — crypto.randomUUID is in modern browsers & Node)
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function emptyTreatment(): Treatment {
  return {
    date: "",
    drug: "",
    brand: "",
    route: "",
    dose: "",
    weight: "",
    criterion: "",
    bcs: "",
    ectoparasites: "none",
    ectoType: "",
    diarrhea: "none",
    notes: "",
  };
}

function swallow(promise: Promise<unknown>) {
  promise.catch((e) => console.error("[supabase]", e));
}

export const useStore = create<StoreState>()((set, get) => ({
  db: emptyDb,
  hydrated: false,
  userId: null,

  setUserId: (userId) => set({ userId }),
  setHydrated: (h) => set({ hydrated: h }),

  addEstablishment: (input) => {
    const userId = get().userId;
    const est: Establishment = { id: uuid(), ...input };
    set((s) => ({
      db: { ...s.db, establishments: [...s.db.establishments, est] },
    }));
    if (userId) {
      swallow(
        (async () => {
          await remote.insertEstablishmentWithId(userId, est);
        })(),
      );
    }
    return est;
  },

  updateEstablishment: (id, patch) => {
    set((s) => ({
      db: {
        ...s.db,
        establishments: s.db.establishments.map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        ),
      },
    }));
    if (get().userId) swallow(remote.updateEstablishment(id, patch));
  },

  deleteEstablishment: (id) => {
    set((s) => {
      const lots = s.db.lots.filter((l) => l.establishmentId !== id);
      const removedLotIds = new Set(
        s.db.lots.filter((l) => l.establishmentId === id).map((l) => l.id),
      );
      const filterRec = <T,>(rec: Record<string, T>) =>
        Object.fromEntries(
          Object.entries(rec).filter(([k]) => !removedLotIds.has(k)),
        );
      return {
        db: {
          ...s.db,
          establishments: s.db.establishments.filter((e) => e.id !== id),
          lots,
          hpg: filterRec(s.db.hpg),
          treatments: filterRec(s.db.treatments),
          weights: filterRec(s.db.weights),
          vaccines: filterRec(s.db.vaccines),
        },
      };
    });
    if (get().userId) swallow(remote.deleteEstablishment(id));
  },

  addLot: (input) => {
    const userId = get().userId;
    const lot: Lot = { id: uuid(), ...input };
    set((s) => ({ db: { ...s.db, lots: [...s.db.lots, lot] } }));
    if (userId) {
      swallow(remote.insertLotWithId(userId, lot));
    }
    return lot;
  },

  updateLot: (id, patch) => {
    set((s) => ({
      db: {
        ...s.db,
        lots: s.db.lots.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      },
    }));
    if (get().userId) swallow(remote.updateLot(id, patch));
  },

  deleteLot: (id) => {
    set((s) => {
      const { [id]: _h, ...hpg } = s.db.hpg;
      const { [id]: _t, ...treatments } = s.db.treatments;
      const { [id]: _w, ...weights } = s.db.weights;
      const { [id]: _v, ...vaccines } = s.db.vaccines;
      return {
        db: {
          ...s.db,
          lots: s.db.lots.filter((l) => l.id !== id),
          hpg,
          treatments,
          weights,
          vaccines,
        },
      };
    });
    if (get().userId) swallow(remote.deleteLot(id));
  },

  setHpgMonth: (lotId, monthKey, record) => {
    set((s) => ({
      db: {
        ...s.db,
        hpg: {
          ...s.db.hpg,
          [lotId]: { ...(s.db.hpg[lotId] ?? {}), [monthKey]: record },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertHpg(lotId, monthKey, record));
  },

  addHpgRow: (lotId, monthKey, row) => {
    const existing = get().db.hpg[lotId]?.[monthKey] ?? {
      rows: [],
      notes: "",
    };
    const newRow: HpgRow = {
      tagId: row?.tagId ?? "",
      weightKg: row?.weightKg ?? null,
      hpg: row?.hpg ?? null,
    };
    const updated: HpgRecord = { ...existing, rows: [...existing.rows, newRow] };
    set((s) => ({
      db: {
        ...s.db,
        hpg: {
          ...s.db.hpg,
          [lotId]: { ...(s.db.hpg[lotId] ?? {}), [monthKey]: updated },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertHpg(lotId, monthKey, updated));
  },

  updateHpgRow: (lotId, monthKey, index, patch) => {
    const existing = get().db.hpg[lotId]?.[monthKey];
    if (!existing) return;
    const rows = existing.rows.map((r, i) =>
      i === index ? { ...r, ...patch } : r,
    );
    const updated: HpgRecord = { ...existing, rows };
    set((s) => ({
      db: {
        ...s.db,
        hpg: {
          ...s.db.hpg,
          [lotId]: { ...(s.db.hpg[lotId] ?? {}), [monthKey]: updated },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertHpg(lotId, monthKey, updated));
  },

  deleteHpgRow: (lotId, monthKey, index) => {
    const existing = get().db.hpg[lotId]?.[monthKey];
    if (!existing) return;
    const rows = existing.rows.filter((_, i) => i !== index);
    const updated: HpgRecord = { ...existing, rows };
    set((s) => ({
      db: {
        ...s.db,
        hpg: {
          ...s.db.hpg,
          [lotId]: { ...(s.db.hpg[lotId] ?? {}), [monthKey]: updated },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertHpg(lotId, monthKey, updated));
  },

  setHpgNotes: (lotId, monthKey, notes) => {
    const existing = get().db.hpg[lotId]?.[monthKey] ?? {
      rows: [],
      notes: "",
    };
    const updated: HpgRecord = { ...existing, notes };
    set((s) => ({
      db: {
        ...s.db,
        hpg: {
          ...s.db.hpg,
          [lotId]: { ...(s.db.hpg[lotId] ?? {}), [monthKey]: updated },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertHpg(lotId, monthKey, updated));
  },

  setTreatment: (lotId, monthKey, treatment) => {
    set((s) => ({
      db: {
        ...s.db,
        treatments: {
          ...s.db.treatments,
          [lotId]: {
            ...(s.db.treatments[lotId] ?? {}),
            [monthKey]: treatment,
          },
        },
      },
    }));
    if (get().userId)
      swallow(remote.upsertTreatment(lotId, monthKey, treatment));
  },

  updateTreatment: (lotId, monthKey, patch) => {
    const existing =
      get().db.treatments[lotId]?.[monthKey] ?? emptyTreatment();
    const updated: Treatment = { ...existing, ...patch };
    set((s) => ({
      db: {
        ...s.db,
        treatments: {
          ...s.db.treatments,
          [lotId]: {
            ...(s.db.treatments[lotId] ?? {}),
            [monthKey]: updated,
          },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertTreatment(lotId, monthKey, updated));
  },

  setVaccineMonth: (lotId, monthKey, record) => {
    set((s) => ({
      db: {
        ...s.db,
        vaccines: {
          ...s.db.vaccines,
          [lotId]: {
            ...(s.db.vaccines[lotId] ?? {}),
            [monthKey]: record,
          },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertVaccine(lotId, monthKey, record));
  },

  setWeightMonth: (lotId, monthKey, record) => {
    set((s) => ({
      db: {
        ...s.db,
        weights: {
          ...s.db.weights,
          [lotId]: {
            ...(s.db.weights[lotId] ?? {}),
            [monthKey]: record,
          },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertWeights(lotId, monthKey, record));
  },

  addWeightRow: (lotId, monthKey, row) => {
    const existing = get().db.weights[lotId]?.[monthKey] ?? {
      rows: [],
      notes: "",
    };
    const newRow: WeightRow = {
      tagId: row?.tagId ?? "",
      weightKg: row?.weightKg ?? null,
    };
    const updated: WeightRecord = {
      ...existing,
      rows: [...existing.rows, newRow],
    };
    set((s) => ({
      db: {
        ...s.db,
        weights: {
          ...s.db.weights,
          [lotId]: { ...(s.db.weights[lotId] ?? {}), [monthKey]: updated },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertWeights(lotId, monthKey, updated));
  },

  updateWeightRow: (lotId, monthKey, index, patch) => {
    const existing = get().db.weights[lotId]?.[monthKey];
    if (!existing) return;
    const rows = existing.rows.map((r, i) =>
      i === index ? { ...r, ...patch } : r,
    );
    const updated: WeightRecord = { ...existing, rows };
    set((s) => ({
      db: {
        ...s.db,
        weights: {
          ...s.db.weights,
          [lotId]: { ...(s.db.weights[lotId] ?? {}), [monthKey]: updated },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertWeights(lotId, monthKey, updated));
  },

  deleteWeightRow: (lotId, monthKey, index) => {
    const existing = get().db.weights[lotId]?.[monthKey];
    if (!existing) return;
    const rows = existing.rows.filter((_, i) => i !== index);
    const updated: WeightRecord = { ...existing, rows };
    set((s) => ({
      db: {
        ...s.db,
        weights: {
          ...s.db.weights,
          [lotId]: { ...(s.db.weights[lotId] ?? {}), [monthKey]: updated },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertWeights(lotId, monthKey, updated));
  },

  setWeightNotes: (lotId, monthKey, notes) => {
    const existing = get().db.weights[lotId]?.[monthKey] ?? {
      rows: [],
      notes: "",
    };
    const updated: WeightRecord = { ...existing, notes };
    set((s) => ({
      db: {
        ...s.db,
        weights: {
          ...s.db.weights,
          [lotId]: { ...(s.db.weights[lotId] ?? {}), [monthKey]: updated },
        },
      },
    }));
    if (get().userId) swallow(remote.upsertWeights(lotId, monthKey, updated));
  },

  replaceDb: (db) => set({ db }),

  resetStore: () =>
    set({ db: emptyDb, hydrated: false, userId: null }),
}));
