import type { StockAnimal } from "./types";
import { t } from "./i18n";

/**
 * Quote a CSV cell:
 * - If the value contains a comma, quote, newline, or leading/trailing
 *   whitespace, wrap in double quotes and escape internal quotes.
 */
function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function safeFilename(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** Build a UTF-8 CSV string for the given stock rows. */
export function buildStockCsv(rows: StockAnimal[]): string {
  const header = [
    "#",
    t.stock.caravana,
    t.stock.origen,
    t.stock.sexo,
    t.stock.peso,
    t.stock.tamano,
    t.stock.raza,
    t.stock.observaciones,
  ];

  const lines: string[] = [header.map(csvCell).join(",")];

  rows.forEach((r, i) => {
    const sexo = r.sexo ? t.stock.sexes[r.sexo] : "";
    const tamano = r.tamano ? t.stock.sizes[r.tamano] : "";
    const raza = r.raza ? t.stock.breeds[r.raza] : "";
    lines.push(
      [
        i + 1,
        r.caravana,
        r.origen,
        sexo,
        r.peso,
        tamano,
        raza,
        r.observaciones,
      ]
        .map(csvCell)
        .join(","),
    );
  });

  return lines.join("\r\n");
}

/** Trigger a browser download of the stock as CSV. */
export function downloadStockCsv(rows: StockAnimal[], lotName: string): void {
  const csv = buildStockCsv(rows);
  // Prepend UTF-8 BOM so Excel opens accents correctly with a double-click.
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `safebreeder-stock-${safeFilename(lotName)}-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
