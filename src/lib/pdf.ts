import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DB } from "./types";
import {
  averageHpg,
  classifyHpg,
  formatInt,
  formatMonthKey,
  formatNumber,
  maxHpg,
  positiveRate,
  previousMonthKey,
  summarizeWeights,
} from "./calc";
import { t } from "./i18n";

export function generateLotReport(
  db: DB,
  lotId: string,
  monthKey: string,
): jsPDF {
  const lot = db.lots.find((l) => l.id === lotId);
  const est = lot
    ? db.establishments.find((e) => e.id === lot.establishmentId)
    : undefined;
  const hpg = db.hpg[lotId]?.[monthKey];
  const treatment = db.treatments[lotId]?.[monthKey];
  const weights = db.weights[lotId]?.[monthKey];
  const prevKey = previousMonthKey(monthKey);
  const prevWeights = prevKey ? db.weights[lotId]?.[prevKey] : undefined;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header band
  doc.setFillColor(77, 124, 42);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Safebreeder", margin, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(t.report.title, pageWidth - margin, 36, { align: "right" });

  y = 90;
  doc.setTextColor(31, 37, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(lot?.name ?? "—", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 111, 93);
  const meta = [
    `${t.report.establishment}: ${est?.name ?? "—"}`,
    `${t.report.period}: ${formatMonthKey(monthKey, t.months)}`,
    `${t.report.generatedOn}: ${new Date().toLocaleDateString("es-AR")}`,
  ];
  for (const line of meta) {
    doc.text(line, margin, y);
    y += 14;
  }
  y += 6;

  // Treatment section
  y = sectionTitle(doc, t.report.sectionTreatment, y, margin);
  if (treatment && Object.values(treatment).some(Boolean)) {
    autoTable(doc, {
      startY: y,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 4, textColor: [31, 37, 24] },
      head: [[t.treatment.title, ""]],
      headStyles: {
        fillColor: [243, 244, 237],
        textColor: [31, 37, 24],
        fontStyle: "bold",
      },
      body: [
        [t.treatment.date, treatment.date || "—"],
        [t.treatment.drug, treatment.drug || "—"],
        [t.treatment.brand, treatment.brand || "—"],
        [t.treatment.route, treatment.route || "—"],
        [t.treatment.dose, treatment.dose || "—"],
        [t.treatment.weight, treatment.weight || "—"],
        [t.treatment.criterion, treatment.criterion || "—"],
        [t.treatment.bcs, treatment.bcs || "—"],
        [
          t.treatment.ectoparasites,
          t.treatment.ectoLevels[treatment.ectoparasites],
        ],
        [t.treatment.ectoType, treatment.ectoType || "—"],
        [
          t.treatment.diarrhea,
          t.treatment.diarrheaLevels[treatment.diarrhea],
        ],
        [t.common.observations, treatment.notes || "—"],
      ],
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  } else {
    y = emptyNote(doc, y, margin);
  }

  // HPG section
  y = sectionTitle(doc, t.report.sectionHpg, y, margin);
  if (hpg && hpg.rows.length > 0) {
    autoTable(doc, {
      startY: y,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: [77, 124, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      head: [[t.hpg.tagId, t.hpg.value, t.hpg.level]],
      body: hpg.rows.map((r) => [
        r.tagId || "—",
        r.hpg !== null ? String(r.hpg) : "—",
        levelLabel(r.hpg),
      ]),
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    const summary = `${t.hpg.sampleCount}: ${formatInt(hpg.rows.length)} · ${t.hpg.average}: ${formatNumber(averageHpg(hpg.rows), 0)} · ${t.hpg.max}: ${formatInt(maxHpg(hpg.rows))} · ${t.hpg.positives}: ${
      positiveRate(hpg.rows) === null ? "—" : `${formatNumber(positiveRate(hpg.rows), 0)}%`
    }`;
    doc.setFontSize(9);
    doc.setTextColor(107, 111, 93);
    doc.text(summary, margin, y);
    y += 14;
    if (hpg.notes) {
      doc.text(`${t.common.observations}: ${hpg.notes}`, margin, y, {
        maxWidth: pageWidth - margin * 2,
      });
      y += 18;
    }
    y += 8;
  } else {
    y = emptyNote(doc, y, margin);
  }

  // Weights section
  if (y > 720) {
    doc.addPage();
    y = margin;
  }
  y = sectionTitle(doc, t.report.sectionWeights, y, margin);
  if (weights && weights.rows.length > 0) {
    const prevMap = new Map(
      (prevWeights?.rows ?? []).map((r) => [r.tagId.trim(), r.weightKg]),
    );
    autoTable(doc, {
      startY: y,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: [77, 124, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      head: [
        [
          t.weights.tagId,
          t.weights.current,
          t.weights.previous,
          t.weights.adg,
        ],
      ],
      body: weights.rows.map((r) => {
        const prev = prevMap.get(r.tagId.trim()) ?? null;
        const adg =
          prev !== null && r.weightKg !== null
            ? (r.weightKg - prev) / 30
            : null;
        return [
          r.tagId || "—",
          r.weightKg !== null ? String(r.weightKg) : "—",
          prev !== null ? String(prev) : "—",
          adg === null ? "—" : formatNumber(adg, 2),
        ];
      }),
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    const summary = summarizeWeights(weights.rows, prevWeights?.rows ?? []);
    const line = `${t.weights.animals}: ${formatInt(summary.count)} · ${t.weights.avgWeight}: ${formatNumber(summary.avgWeight, 1)} kg · ${t.weights.avgAdg}: ${formatNumber(summary.avgAdg, 2)} kg/día`;
    doc.setFontSize(9);
    doc.setTextColor(107, 111, 93);
    doc.text(line, margin, y);
    y += 14;
    if (weights.notes) {
      doc.text(`${t.common.observations}: ${weights.notes}`, margin, y, {
        maxWidth: pageWidth - margin * 2,
      });
    }
  } else {
    emptyNote(doc, y, margin);
  }

  return doc;
}

function sectionTitle(
  doc: jsPDF,
  title: string,
  y: number,
  margin: number,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(77, 124, 42);
  doc.text(title.toUpperCase(), margin, y);
  doc.setDrawColor(227, 230, 220);
  doc.line(margin, y + 4, doc.internal.pageSize.getWidth() - margin, y + 4);
  return y + 16;
}

function emptyNote(doc: jsPDF, y: number, margin: number): number {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(107, 111, 93);
  doc.text(t.report.emptyPeriod, margin, y);
  return y + 24;
}

function levelLabel(value: number | null): string {
  const level = classifyHpg(value);
  if (level === "low") return t.hpg.low;
  if (level === "moderate") return t.hpg.moderate;
  if (level === "high") return t.hpg.high;
  return t.hpg.none;
}
