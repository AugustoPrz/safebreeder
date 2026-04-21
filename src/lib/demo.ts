import type { DB } from "./types";
import { monthKey } from "./calc";

export function buildDemoDb(): DB {
  const now = new Date();
  const thisMonth = monthKey(now.getFullYear(), now.getMonth());
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = monthKey(prev.getFullYear(), prev.getMonth());

  const estabId = "demo-est-1";
  const lotId = "demo-lot-1";

  return {
    establishments: [
      {
        id: estabId,
        name: "La Esperanza",
        owner: "Juan Pérez",
        district: "Tandil",
        province: "Buenos Aires",
      },
    ],
    lots: [
      {
        id: lotId,
        establishmentId: estabId,
        name: "Recría 2024",
        category: "recriaMachos",
        headCount: 120,
      },
    ],
    hpg: {
      [lotId]: {
        [prevMonth]: {
          rows: [
            { tagId: "001", weightKg: 185, hpg: 120 },
            { tagId: "002", weightKg: 190, hpg: 80 },
            { tagId: "003", weightKg: 178, hpg: 260 },
            { tagId: "004", weightKg: 192, hpg: 540 },
            { tagId: "005", weightKg: 188, hpg: 100 },
          ],
          notes: "Muestreo inicial.",
        },
        [thisMonth]: {
          rows: [
            { tagId: "001", weightKg: 205, hpg: 40 },
            { tagId: "002", weightKg: 212, hpg: 60 },
            { tagId: "003", weightKg: 198, hpg: 180 },
            { tagId: "004", weightKg: 215, hpg: 220 },
            { tagId: "005", weightKg: 210, hpg: 30 },
          ],
          notes: "Post tratamiento con ivermectina.",
        },
      },
    },
    weights: {
      [lotId]: {
        [prevMonth]: {
          rows: [
            { tagId: "001", weightKg: 185 },
            { tagId: "002", weightKg: 190 },
            { tagId: "003", weightKg: 178 },
            { tagId: "004", weightKg: 192 },
            { tagId: "005", weightKg: 188 },
          ],
          notes: "",
        },
        [thisMonth]: {
          rows: [
            { tagId: "001", weightKg: 205 },
            { tagId: "002", weightKg: 212 },
            { tagId: "003", weightKg: 198 },
            { tagId: "004", weightKg: 215 },
            { tagId: "005", weightKg: 210 },
          ],
          notes: "",
        },
      },
    },
    treatments: {
      [lotId]: {
        [thisMonth]: {
          date: new Date().toISOString().slice(0, 10),
          drug: "Ivermectina",
          brand: "Ivomec",
          route: "Subcutánea",
          dose: "1 ml / 50 kg",
          weight: "210",
          criterion: "El más pesado del lote",
          bcs: "3 — Normal",
          ectoparasites: "none",
          ectoType: "",
          diarrhea: "none",
          notes: "",
        },
      },
    },
  };
}
