"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  DB,
  Establishment,
  HpgRecord,
  HpgRow,
  Lot,
  MonthKey,
  Treatment,
  WeightRecord,
  WeightRow,
} from "./types";
import { emptyDb } from "./types";
const STORAGE_KEY = "sb_v1";

export type MigrationSource = "legacy" | "demo" | "empty" | null;

interface StoreState {
  db: DB;
  hydrated: boolean;
  migrationSource: MigrationSource;

  setMigrationSource: (s: MigrationSource) => void;

  addEstablishment: (input: Omit<Establishment, "id">) => Establishment;
  deleteEstablishment: (id: string) => void;

  addLot: (input: Omit<Lot, "id">) => Lot;
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
  exportJson: () => Blob;
  importJson: (text: string) => { ok: true } | { ok: false; error: string };
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      db: emptyDb,
      hydrated: false,
      migrationSource: null,

      setMigrationSource: (s) => set({ migrationSource: s }),

      addEstablishment: (input) => {
        const est: Establishment = { id: newId(), ...input };
        set((s) => ({
          db: { ...s.db, establishments: [...s.db.establishments, est] },
        }));
        return est;
      },

      deleteEstablishment: (id) =>
        set((s) => {
          const lots = s.db.lots.filter((l) => l.establishmentId !== id);
          const removedLotIds = new Set(
            s.db.lots
              .filter((l) => l.establishmentId === id)
              .map((l) => l.id),
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
            },
          };
        }),

      addLot: (input) => {
        const lot: Lot = { id: newId(), ...input };
        set((s) => ({ db: { ...s.db, lots: [...s.db.lots, lot] } }));
        return lot;
      },

      deleteLot: (id) =>
        set((s) => {
          const { [id]: _h, ...hpg } = s.db.hpg;
          const { [id]: _t, ...treatments } = s.db.treatments;
          const { [id]: _w, ...weights } = s.db.weights;
          return {
            db: {
              ...s.db,
              lots: s.db.lots.filter((l) => l.id !== id),
              hpg,
              treatments,
              weights,
            },
          };
        }),

      setHpgMonth: (lotId, monthKey, record) =>
        set((s) => ({
          db: {
            ...s.db,
            hpg: {
              ...s.db.hpg,
              [lotId]: { ...(s.db.hpg[lotId] ?? {}), [monthKey]: record },
            },
          },
        })),

      addHpgRow: (lotId, monthKey, row) =>
        set((s) => {
          const existing = s.db.hpg[lotId]?.[monthKey] ?? {
            rows: [],
            notes: "",
          };
          const newRow: HpgRow = {
            tagId: row?.tagId ?? "",
            weightKg: row?.weightKg ?? null,
            hpg: row?.hpg ?? null,
          };
          return {
            db: {
              ...s.db,
              hpg: {
                ...s.db.hpg,
                [lotId]: {
                  ...(s.db.hpg[lotId] ?? {}),
                  [monthKey]: { ...existing, rows: [...existing.rows, newRow] },
                },
              },
            },
          };
        }),

      updateHpgRow: (lotId, monthKey, index, patch) =>
        set((s) => {
          const existing = s.db.hpg[lotId]?.[monthKey];
          if (!existing) return {};
          const rows = existing.rows.map((r, i) =>
            i === index ? { ...r, ...patch } : r,
          );
          return {
            db: {
              ...s.db,
              hpg: {
                ...s.db.hpg,
                [lotId]: {
                  ...(s.db.hpg[lotId] ?? {}),
                  [monthKey]: { ...existing, rows },
                },
              },
            },
          };
        }),

      deleteHpgRow: (lotId, monthKey, index) =>
        set((s) => {
          const existing = s.db.hpg[lotId]?.[monthKey];
          if (!existing) return {};
          const rows = existing.rows.filter((_, i) => i !== index);
          return {
            db: {
              ...s.db,
              hpg: {
                ...s.db.hpg,
                [lotId]: {
                  ...(s.db.hpg[lotId] ?? {}),
                  [monthKey]: { ...existing, rows },
                },
              },
            },
          };
        }),

      setHpgNotes: (lotId, monthKey, notes) =>
        set((s) => {
          const existing = s.db.hpg[lotId]?.[monthKey] ?? {
            rows: [],
            notes: "",
          };
          return {
            db: {
              ...s.db,
              hpg: {
                ...s.db.hpg,
                [lotId]: {
                  ...(s.db.hpg[lotId] ?? {}),
                  [monthKey]: { ...existing, notes },
                },
              },
            },
          };
        }),

      setTreatment: (lotId, monthKey, treatment) =>
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
        })),

      updateTreatment: (lotId, monthKey, patch) =>
        set((s) => {
          const existing =
            s.db.treatments[lotId]?.[monthKey] ?? emptyTreatment();
          return {
            db: {
              ...s.db,
              treatments: {
                ...s.db.treatments,
                [lotId]: {
                  ...(s.db.treatments[lotId] ?? {}),
                  [monthKey]: { ...existing, ...patch },
                },
              },
            },
          };
        }),

      setWeightMonth: (lotId, monthKey, record) =>
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
        })),

      addWeightRow: (lotId, monthKey, row) =>
        set((s) => {
          const existing = s.db.weights[lotId]?.[monthKey] ?? {
            rows: [],
            notes: "",
          };
          const newRow: WeightRow = {
            tagId: row?.tagId ?? "",
            weightKg: row?.weightKg ?? null,
          };
          return {
            db: {
              ...s.db,
              weights: {
                ...s.db.weights,
                [lotId]: {
                  ...(s.db.weights[lotId] ?? {}),
                  [monthKey]: { ...existing, rows: [...existing.rows, newRow] },
                },
              },
            },
          };
        }),

      updateWeightRow: (lotId, monthKey, index, patch) =>
        set((s) => {
          const existing = s.db.weights[lotId]?.[monthKey];
          if (!existing) return {};
          const rows = existing.rows.map((r, i) =>
            i === index ? { ...r, ...patch } : r,
          );
          return {
            db: {
              ...s.db,
              weights: {
                ...s.db.weights,
                [lotId]: {
                  ...(s.db.weights[lotId] ?? {}),
                  [monthKey]: { ...existing, rows },
                },
              },
            },
          };
        }),

      deleteWeightRow: (lotId, monthKey, index) =>
        set((s) => {
          const existing = s.db.weights[lotId]?.[monthKey];
          if (!existing) return {};
          const rows = existing.rows.filter((_, i) => i !== index);
          return {
            db: {
              ...s.db,
              weights: {
                ...s.db.weights,
                [lotId]: {
                  ...(s.db.weights[lotId] ?? {}),
                  [monthKey]: { ...existing, rows },
                },
              },
            },
          };
        }),

      setWeightNotes: (lotId, monthKey, notes) =>
        set((s) => {
          const existing = s.db.weights[lotId]?.[monthKey] ?? {
            rows: [],
            notes: "",
          };
          return {
            db: {
              ...s.db,
              weights: {
                ...s.db.weights,
                [lotId]: {
                  ...(s.db.weights[lotId] ?? {}),
                  [monthKey]: { ...existing, notes },
                },
              },
            },
          };
        }),

      replaceDb: (db) => set({ db }),

      exportJson: () => {
        const snapshot = get().db;
        return new Blob([JSON.stringify(snapshot, null, 2)], {
          type: "application/json",
        });
      },

      importJson: (text) => {
        try {
          const parsed = JSON.parse(text) as Partial<DB>;
          if (
            !parsed ||
            !Array.isArray(parsed.establishments) ||
            !Array.isArray(parsed.lots)
          ) {
            return { ok: false, error: "Estructura inválida" };
          }
          const db: DB = {
            establishments: parsed.establishments,
            lots: parsed.lots,
            hpg: parsed.hpg ?? {},
            treatments: parsed.treatments ?? {},
            weights: parsed.weights ?? {},
          };
          set({ db });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: (e as Error).message };
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ db: s.db }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.hydrated = true;
      },
    },
  ),
);
