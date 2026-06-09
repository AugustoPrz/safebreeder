// Capture Recharts charts to PNG for embedding in a PDF.
//
// We deliberately avoid html2canvas (it historically mangled the line/curve
// charts). Instead we serialize each chart's <svg> directly and rasterize it
// via an <img> + <canvas>. Recharts draws the plot, axes and data labels as
// SVG presentation attributes, so the curves come out pixel-perfect. The only
// thing that lives outside the SVG is the HTML legend — we read its
// labels/colors from the DOM and hand them back so the PDF can redraw them.

export interface CapturedChart {
  title: string;
  png: string; // PNG data URL
  width: number; // CSS px
  height: number; // CSS px
  legend: { label: string; color: string }[];
}

async function svgToPng(
  svg: SVGSVGElement,
  scale = 4,
): Promise<{ png: string; width: number; height: number } | null> {
  const rect = svg.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  if (width === 0 || height === 0) return null;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // Set SVG dimensions to the FULL scaled resolution so the browser rasterises
  // the vector at high DPI instead of at CSS-pixel size. Without this, the SVG
  // is drawn at 1× and then stretched up by the canvas transform, which
  // produces the blocky/pixelated charts seen in the PDF.
  clone.setAttribute("width", String(width * scale));
  clone.setAttribute("height", String(height * scale));
  // Ensure internal coordinates still map to the original CSS dimensions.
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  // Pin a font so text doesn't fall back to the browser default serif once the
  // SVG is detached from the page stylesheet.
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
  // Intrinsic size must match the SVG's declared dimensions so drawImage
  // copies pixels 1-to-1 without any extra browser rescaling.
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
  // Draw at 1:1 — the SVG already rendered at full scale, no transform needed.
  ctx.drawImage(img, 0, 0, width * scale, height * scale);

  // Return CSS dimensions so pdf.ts can size the image correctly on the page.
  return { png: canvas.toDataURL("image/png"), width, height };
}

function readLegend(card: HTMLElement): { label: string; color: string }[] {
  const items = card.querySelectorAll<HTMLElement>(".recharts-legend-item");
  const legend: { label: string; color: string }[] = [];
  items.forEach((li) => {
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
  return legend;
}

/**
 * Capture every chart marked with `data-chart-card` inside `root`, in DOM
 * order. Cards without a rendered chart (empty states) are skipped.
 */
export async function captureCharts(
  root: HTMLElement,
): Promise<CapturedChart[]> {
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>("[data-chart-card]"),
  );
  const out: CapturedChart[] = [];
  for (const card of cards) {
    const svg = card.querySelector<SVGSVGElement>("svg.recharts-surface");
    if (!svg) continue;
    const rendered = await svgToPng(svg);
    if (!rendered) continue;
    const title = card.querySelector("h3")?.textContent?.trim() ?? "";
    out.push({
      title,
      png: rendered.png,
      width: rendered.width,
      height: rendered.height,
      legend: readLegend(card),
    });
  }
  return out;
}
