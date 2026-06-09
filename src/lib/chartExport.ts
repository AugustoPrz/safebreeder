// Capture Recharts charts and render them into a PDF as TRUE VECTORS.
//
// Earlier approaches rasterised each chart's <svg> to a PNG (via canvas) and
// embedded the bitmap. No matter how high the DPI, that produced blocky charts
// once the PDF was zoomed or viewed on certain devices (notably iOS, whose
// print-to-PDF pipeline re-rasterises everything).
//
// Instead we use svg2pdf.js, which walks the live <svg> and emits native PDF
// drawing commands (lines, beziers, text) — so the charts are resolution-
// independent vectors inside the PDF, identical on every device. The only
// thing that lives outside the SVG is the HTML legend, which we read from the
// DOM and hand back so the PDF can redraw it as text.

import type { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";

export interface CapturedChart {
  title: string;
  /** The live <svg> element from the page (read, never mutated, by svg2pdf). */
  svg: SVGSVGElement;
  width: number; // CSS px — defines aspect ratio
  height: number; // CSS px
  legend: { label: string; color: string }[];
}

function readLegend(card: HTMLElement): { label: string; color: string }[] {
  // Recharts' built-in <Legend> was removed from our charts (it renders inside
  // a <foreignObject> which forces rasterisation). Legends are now plain HTML.
  // We read whatever swatch+label pairs we can find so the PDF can redraw them.
  const legend: { label: string; color: string }[] = [];

  // 1) Recharts legend items (if any chart still uses them).
  card.querySelectorAll<HTMLElement>(".recharts-legend-item").forEach((li) => {
    const label =
      li.querySelector(".recharts-legend-item-text")?.textContent?.trim() ??
      li.textContent?.trim() ??
      "";
    const marker = li.querySelector("path, line, rect, circle");
    const color =
      marker?.getAttribute("stroke") ||
      marker?.getAttribute("fill") ||
      "#1f2518";
    if (label) legend.push({ label, color });
  });
  if (legend.length) return legend;

  // 2) Our HTML legends: a row of <span>, each with a coloured swatch (inline
  //    background) followed by text. Match only *leaf* swatches (no text of
  //    their own) so we don't pick up Recharts wrapper divs, and pair each
  //    with its parent's text.
  const seen = new Set<string>();
  card.querySelectorAll<HTMLElement>("[style*='background']").forEach((sw) => {
    if (sw.textContent && sw.textContent.trim()) return; // not a swatch
    const bg = sw.style.backgroundColor || sw.style.background;
    if (!bg) return;
    const label = sw.parentElement?.textContent?.trim() ?? "";
    if (label && !seen.has(label)) {
      seen.add(label);
      legend.push({ label, color: bg });
    }
  });

  return legend;
}

/**
 * Collect every chart marked with `data-chart-card` inside `root`, in DOM
 * order. Cards without a rendered chart (empty states) are skipped.
 * Returns references to the live SVG elements — render them with `drawChart`.
 */
export function collectCharts(root: HTMLElement): CapturedChart[] {
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>("[data-chart-card]"),
  );
  const out: CapturedChart[] = [];
  for (const card of cards) {
    const svg = card.querySelector<SVGSVGElement>("svg.recharts-surface");
    if (!svg) continue;
    const rect = svg.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    if (width === 0 || height === 0) continue;
    const title = card.querySelector("h3")?.textContent?.trim() ?? "";
    out.push({ title, svg, width, height, legend: readLegend(card) });
  }
  return out;
}

/**
 * Draw a captured chart into `doc` at (x, y) scaled to w×h, as vectors.
 * Falls back to a high-resolution raster only if vector rendering throws,
 * so a single unsupported SVG feature can never blank out the whole report.
 */
export async function drawChart(
  doc: jsPDF,
  chart: CapturedChart,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<void> {
  try {
    await svg2pdf(chart.svg, doc, { x, y, width: w, height: h });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("svg2pdf failed, falling back to raster:", err);
    }
    const png = await svgToPng(chart.svg, 3);
    if (png) doc.addImage(png, "PNG", x, y, w, h, undefined, "FAST");
  }
}

// ── Raster fallback ─────────────────────────────────────────────────────────
// Only used if svg2pdf throws for a particular chart.
async function svgToPng(
  svg: SVGSVGElement,
  scale = 3,
): Promise<string | null> {
  const rect = svg.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  if (width === 0 || height === 0) return null;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width * scale));
  clone.setAttribute("height", String(height * scale));
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  const style = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "style",
  );
  style.textContent =
    "text{font-family:Helvetica,Arial,sans-serif;} *{shape-rendering:geometricPrecision;}";
  clone.insertBefore(style, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

  const img = new Image();
  img.width = width * scale;
  img.height = height * scale;
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg image load failed"));
      img.src = src;
    });
  } catch {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, width * scale, height * scale);
  return canvas.toDataURL("image/png");
}
