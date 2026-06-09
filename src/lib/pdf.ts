import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DB } from "./types";
import { type CapturedChart, drawChart } from "./chartExport";
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
  const vaccines = db.vaccines[lotId]?.[monthKey];
  const vaccineRows = (vaccines?.rows ?? []).filter(
    (r) => r.date || r.type || r.doseNumber || r.brand || r.dose,
  );
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
        [t.treatment.ectoDrug, treatment.ectoDrug || "—"],
        [t.treatment.ectoRoute, treatment.ectoRoute || "—"],
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

  // Vaccines section
  if (y > 720) {
    doc.addPage();
    y = margin;
  }
  y = sectionTitle(doc, t.report.sectionVaccines, y, margin);
  if (vaccineRows.length > 0) {
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
          t.vaccines.date,
          t.vaccines.type,
          t.vaccines.doseNumber,
          t.vaccines.brand,
          t.vaccines.dose,
        ],
      ],
      body: vaccineRows.map((r) => [
        r.date || "—",
        r.type !== "" ? t.vaccines.types[r.type] : "—",
        r.doseNumber ? t.vaccines.doseNumbers[r.doseNumber] : "—",
        r.brand || "—",
        r.dose || "—",
      ]),
      margin: { left: margin, right: margin },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 18;
  } else {
    y = emptyNote(doc, y, margin);
  }

  // HPG section
  if (y > 720) {
    doc.addPage();
    y = margin;
  }
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

// ── Statistics report (dashboard PDF) ───────────────────────────────────────

export interface StatsReportInput {
  establishmentName: string | null;
  year: string | null;
  generatedAt: string;
  kpis: { label: string; value: string }[];
  charts: CapturedChart[];
  gdpTable?: {
    year: number;
    monthLabels: string[];
    rows: {
      lotName: string;
      category: string;
      values: (number | null)[];
      average: number | null;
    }[];
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const s = hex.trim();
  const m6 = /^#?([0-9a-f]{6})$/i.exec(s);
  if (m6) {
    const n = parseInt(m6[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m3 = /^#?([0-9a-f]{3})$/i.exec(s);
  if (m3) {
    const c = m3[1];
    return [
      parseInt(c[0] + c[0], 16),
      parseInt(c[1] + c[1], 16),
      parseInt(c[2] + c[2], 16),
    ];
  }
  // Browsers serialise inline `background`/`background-color` as
  // "rgb(r, g, b)" or "rgba(r, g, b, a)" — parse those too, otherwise legend
  // swatches fall back to dark (appearing black).
  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(s);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }
  return [31, 37, 24];
}

// Lay out (and optionally draw) a wrapping legend. Returns the y after it.
// Assumes the caller has set the font to size 8 already.
function layoutLegend(
  doc: jsPDF,
  legend: { label: string; color: string }[],
  x: number,
  y: number,
  maxWidth: number,
  draw: boolean,
): number {
  const swatch = 8;
  const gapX = 12;
  const lineH = 13;
  let cx = x;
  let cy = y;
  for (const item of legend) {
    const textW = doc.getTextWidth(item.label);
    const itemW = swatch + 4 + textW;
    if (cx > x && cx + itemW > x + maxWidth) {
      cx = x;
      cy += lineH;
    }
    if (draw) {
      const [r, g, b] = hexToRgb(item.color);
      doc.setFillColor(r, g, b);
      doc.rect(cx, cy - swatch + 1, swatch, swatch, "F");
      doc.setTextColor(31, 37, 24);
      doc.text(item.label, cx + swatch + 4, cy + 6);
    }
    cx += itemW + gapX;
  }
  return cy + lineH;
}

export async function generateStatsReport(
  input: StatsReportInput,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(77, 124, 42);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Safebreeder", margin, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(t.dashboard.title, pageWidth - margin, 36, { align: "right" });

  y = 84;
  doc.setTextColor(31, 37, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(input.establishmentName || "Todos los establecimientos", margin, y);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 111, 93);
  doc.text(
    [
      input.year ? `Año ${input.year}` : "Todos los años",
      input.generatedAt,
    ].join("   ·   "),
    margin,
    y,
  );
  y += 22;

  // KPIs grid (3 columns)
  if (input.kpis.length) {
    y = sectionTitle(doc, t.dashboard.title, y, margin);
    const cols = 3;
    const gap = 10;
    const boxW = (contentWidth - gap * (cols - 1)) / cols;
    const boxH = 40;
    input.kpis.forEach((kpi, i) => {
      const col = i % cols;
      if (col === 0) ensure(boxH + gap);
      const x = margin + col * (boxW + gap);
      doc.setDrawColor(227, 230, 220);
      doc.setFillColor(248, 249, 245);
      doc.roundedRect(x, y, boxW, boxH, 4, 4, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(107, 111, 93);
      doc.text(kpi.label.toUpperCase(), x + 8, y + 14, {
        maxWidth: boxW - 16,
      });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(31, 37, 24);
      doc.text(kpi.value, x + 8, y + 32);
      if (col === cols - 1 || i === input.kpis.length - 1) y += boxH + gap;
    });
    y += 8;
  }

  // Charts (image + hand-drawn legend)
  for (const chart of input.charts) {
    const imgW = contentWidth;
    const imgH = Math.min(
      (chart.height / chart.width) * imgW,
      pageHeight - margin * 2 - 80,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const legendH = chart.legend.length
      ? layoutLegend(doc, chart.legend, margin, 0, contentWidth, false) + 6
      : 0;
    const blockH = 16 + imgH + 6 + legendH + 14;
    ensure(blockH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(31, 37, 24);
    doc.text(chart.title, margin, y + 10);
    y += 16;
    // Render the chart as native PDF vectors (resolution-independent).
    await drawChart(doc, chart, margin, y, imgW, imgH);
    y += imgH + 8;
    if (chart.legend.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      y = layoutLegend(doc, chart.legend, margin, y, contentWidth, true) + 6;
    }
    y += 12;
  }

  // GDP per-lot table
  if (input.gdpTable && input.gdpTable.rows.length) {
    ensure(70);
    y = sectionTitle(
      doc,
      `${t.dashboard.chartGdpEvolution} — ${input.gdpTable.year}`,
      y,
      margin,
    );
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 6.5, cellPadding: 2.5, textColor: [31, 37, 24] },
      headStyles: {
        fillColor: [77, 124, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 6.5,
      },
      head: [
        [
          "Lote",
          "Categoría",
          ...input.gdpTable.monthLabels,
          "Prom.",
        ],
      ],
      body: input.gdpTable.rows.map((r) => [
        r.lotName,
        r.category,
        ...r.values.map((v) => (v === null ? "—" : v.toFixed(2))),
        r.average === null ? "—" : r.average.toFixed(2),
      ]),
      margin: { left: margin, right: margin },
    });
  }

  return doc;
}
