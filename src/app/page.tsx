"use client";

import Link from "next/link";
import { useEffect } from "react";

/* ─── helpers ────────────────────────────────────────── */
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <div className="w-[18px] h-[18px] rounded-full bg-[#2b3a1e] flex-shrink-0 flex items-center justify-center mt-0.5">
      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 fill-none stroke-white" strokeWidth="2.5">
        <path d="M2 5l2.5 2.5L8 3" />
      </svg>
    </div>
  );
}

/* ─── screenshot placeholder panels ─────────────────── */
function ScreenshotA() {
  /* Pesadas / registro productivo */
  return (
    <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-[#233219] flex flex-col shadow-xl">
      <div className="px-4 py-2.5 bg-[#1a2712] flex items-center gap-2 flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
        <div className="ml-2 text-[10px] text-white/35 font-mono tracking-wide">safebreeder.com / lote-a / pesadas</div>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Lote A — Pesadas</div>
        <div className="grid grid-cols-4 gap-1.5">
          {[["312", "Cabezas"], ["0.85", "kg/día GDP"], ["94%", "San. al día"], ["218", "Días"]].map(([v, l]) => (
            <div key={l} className="bg-white/8 rounded-lg p-2 text-center">
              <div className="text-white text-xs font-bold leading-tight">{v}</div>
              <div className="text-white/45 text-[9px] leading-tight mt-0.5">{l}</div>
            </div>
          ))}
        </div>
        <div className="text-[9px] text-white/35 font-semibold uppercase tracking-widest mt-0.5">Evolución GDP</div>
        <div className="flex items-end gap-1 flex-1 min-h-0">
          {[38, 52, 47, 64, 58, 72, 85, 100].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-t-sm ${i >= 6 ? "bg-primary" : i >= 4 ? "bg-primary/60" : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenshotB() {
  /* Sanidad / HPG */
  return (
    <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-[#233219] flex flex-col shadow-xl">
      <div className="px-4 py-2.5 bg-[#1a2712] flex items-center gap-2 flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
        <div className="ml-2 text-[10px] text-white/35 font-mono tracking-wide">safebreeder.com / lote-a / sanidad</div>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-2.5 overflow-hidden">
        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Gestión sanitaria</div>
        <div className="bg-white/8 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <span className="text-white/60 text-[11px]">HPG promedio</span>
          <span className="text-[#a5c956] font-bold text-sm">120 HPG</span>
        </div>
        <div className="bg-white/8 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <span className="text-white/60 text-[11px]">Tratamientos activos</span>
          <span className="text-white font-bold text-sm">3</span>
        </div>
        <div className="bg-white/8 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <span className="text-white/60 text-[11px]">Cobertura sanitaria</span>
          <span className="text-[#a5c956] font-bold text-sm">94%</span>
        </div>
        <div className="bg-[#c8a415]/10 border border-[#c8a415]/25 rounded-xl px-3 py-2 flex items-center gap-2 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c8a415] flex-shrink-0" />
          <span className="text-[#c8a415]/80 text-[10px] leading-snug">Alerta: Lote B requiere revisión HPG</span>
        </div>
      </div>
    </div>
  );
}

function ScreenshotC() {
  /* Dashboard / indicadores */
  return (
    <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-[#233219] flex flex-col shadow-xl">
      <div className="px-4 py-2.5 bg-[#1a2712] flex items-center gap-2 flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
        <div className="ml-2 text-[10px] text-white/35 font-mono tracking-wide">safebreeder.com / estadisticas</div>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-2.5 overflow-hidden">
        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Estadísticas</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "GDP Lote A", val: "0.92 kg/d" },
            { label: "GDP Lote B", val: "0.78 kg/d" },
            { label: "Stock total", val: "624 cab." },
            { label: "Establ. activos", val: "2" },
          ].map((item) => (
            <div key={item.label} className="bg-white/8 rounded-xl p-2.5">
              <div className="text-white/45 text-[9px] mb-0.5">{item.label}</div>
              <div className="text-white text-xs font-bold">{item.val}</div>
            </div>
          ))}
        </div>
        <div className="text-[9px] text-white/35 font-semibold uppercase tracking-widest mt-0.5">Evolución mensual</div>
        <div className="flex items-end gap-1 flex-1 min-h-0">
          {[
            { h: 45, lote: "A" }, { h: 60, lote: "A" }, { h: 52, lote: "A" },
            { h: 75, lote: "B" }, { h: 68, lote: "B" }, { h: 80, lote: "B" },
          ].map(({ h, lote }, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-t-sm ${lote === "A" ? "bg-primary" : "bg-[#a5c956]/70"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── app mockup for "What" section ─────────────────── */
function AppMockup() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-border text-[11px] bg-surface">
      {/* Browser chrome */}
      <div className="bg-surface-2 px-4 py-2 flex items-center gap-2 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 bg-white border border-border rounded-full px-3 py-0.5 text-[10px] text-text-muted font-mono text-center">
          safebreeder.com / establecimientos / lote-a
        </div>
      </div>
      {/* App nav */}
      <div className="bg-[#2b3a1e] px-4 py-2 flex items-center justify-between">
        <span className="font-black text-white text-[11px] uppercase tracking-widest">Safebreeder</span>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[9px]">Mis establecimientos</span>
          <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-semibold">La Esperanza</span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[9px]">Estadísticas</span>
        </div>
      </div>
      {/* Body */}
      <div className="p-4 bg-bg">
        {/* Lote header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-semibold text-text text-[12px]">Lote A — Novillos Angus / Hereford</div>
            <div className="text-text-muted text-[10px] mt-0.5">La Esperanza · 312 cabezas · Actualizado hoy</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-primary-soft text-primary-soft-text text-[9px] font-semibold">Activo</span>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mb-3 border-b border-border pb-2">
          {["Stock", "HPG", "Tratamientos", "Pesadas", "Indicadores"].map((t, i) => (
            <span key={t} className={`px-2.5 py-1 rounded-full text-[9px] font-semibold cursor-default ${i === 0 ? "bg-[#2b3a1e] text-white" : "text-text-muted"}`}>{t}</span>
          ))}
        </div>
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[["312", "Stock"], ["0.85", "kg/día GDP"], ["94%", "San. al día"], ["218", "Días"]].map(([v, l]) => (
            <div key={l} className="bg-surface rounded-lg p-2 text-center border border-border">
              <div className="font-bold text-text text-[13px] leading-tight">{v}</div>
              <div className="text-text-muted text-[9px] mt-0.5">{l}</div>
            </div>
          ))}
        </div>
        {/* Table */}
        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Registros del lote</div>
        <div className="rounded-xl overflow-hidden border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-2">
                <th className="px-3 py-1.5 text-[9px] font-semibold text-text-muted uppercase">Fecha</th>
                <th className="px-3 py-1.5 text-[9px] font-semibold text-text-muted uppercase">Tipo</th>
                <th className="px-3 py-1.5 text-[9px] font-semibold text-text-muted uppercase">Resultado</th>
                <th className="px-3 py-1.5 text-[9px] font-semibold text-text-muted uppercase">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: "14 jun", tipo: "Pesada", res: "0.92 kg/día GDP", badge: "Óptimo", cls: "bg-primary-soft text-primary" },
                { date: "10 jun", tipo: "HPG", res: "120 HPG prom.", badge: "Revisar", cls: "bg-sun-soft text-sun-soft-text" },
                { date: "05 jun", tipo: "Trat.", res: "312 cab. tratadas", badge: "Completado", cls: "bg-primary-soft text-primary" },
              ].map((row, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-1.5 text-[10px] text-text-muted">{row.date}</td>
                  <td className="px-3 py-1.5 text-[10px] text-text font-medium">{row.tipo}</td>
                  <td className="px-3 py-1.5 text-[10px] text-text">{row.res}</td>
                  <td className="px-3 py-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold ${row.cls}`}>{row.badge}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mini chart */}
        <div className="mt-3">
          <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Evolución GDP</div>
          <div className="flex items-end gap-1 h-10">
            {[38, 52, 47, 64, 58, 72, 85, 100].map((h, i) => (
              <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-t-sm ${i >= 6 ? "bg-primary" : i >= 4 ? "bg-primary/50" : "bg-border"}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────── */
export default function LandingPage() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-anim]");
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.style.transitionDelay = el.dataset.delay ? `${el.dataset.delay}ms` : "0ms";
            el.classList.add("visible");
          } else {
            el.style.transitionDelay = "0ms";
            el.classList.remove("visible");
          }
        }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bg-bg overflow-x-hidden">
      {/* ── HERO ───────────────────────────────────────── */}
      <div className="p-3 sm:p-4">
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[calc(100vh-24px)] sm:min-h-[calc(100vh-32px)] bg-[#2b3a1e]">
          <video aria-hidden autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src="/hero.mp4"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#1a2410]/80 via-[#2b3a1e]/70 to-[#3d3018]/75" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
          <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6">
            <div className="font-black text-lg sm:text-xl uppercase tracking-widest text-white">Safebreeder</div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/85">
              <a href="#plataforma" className="hover:text-white transition-colors">Plataforma</a>
              <a href="#funciones" className="hover:text-white transition-colors">Funciones</a>
              <a href="#usuarios" className="hover:text-white transition-colors">Usuarios</a>
              <a href="/nosotros" className="hover:text-white transition-colors">Nosotros</a>
            </nav>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/login" className="hidden sm:inline text-sm font-medium text-white/85 hover:text-white transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/signup" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors">
                Probar gratis <ArrowIcon />
              </Link>
            </div>
          </header>
          <div className="relative z-10 px-6 sm:px-10 pt-16 sm:pt-28 pb-10 sm:pb-14 grid lg:grid-cols-2 gap-10 lg:gap-6 items-end min-h-[calc(100vh-180px)]">
            <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight">
              Gestioná tu recría como siempre quisiste
            </h1>
            <div className="max-w-md lg:justify-self-end space-y-6">
              <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                La app que centraliza la sanidad y la productividad de tu ganado.
                Cargá HPG, pesadas y tratamientos, y obtené reportes e indicadores
                en tiempo real desde cualquier lugar.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-white text-text text-sm font-semibold hover:bg-surface transition-colors">
                Probar gratis <ArrowIcon />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── WHAT (la plataforma) ───────────────────────── */}
      <section className="bg-bg py-24 sm:py-32" id="plataforma">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div data-anim="up" className="mb-14">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-primary block mb-3">La plataforma</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text leading-[1.08]">
              Gestioná tus establecimientos{" "}<br className="hidden sm:block" />
              con <em className="not-italic text-primary">datos reales del campo</em>
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Feature tabs */}
            <div data-anim="left" className="flex flex-col gap-px bg-border rounded-2xl overflow-hidden">
              {[
                {
                  icon: <path d="M3 7h18M3 12h18M3 17h18" />,
                  title: "Registro por establecimiento y lote",
                  desc: "Organizá cada establecimiento por lotes. Toda la información disponible y ordenada desde cualquier dispositivo, en cualquier momento.",
                },
                {
                  icon: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />,
                  title: "Pesadas y seguimiento de GDP",
                  desc: "Registrá pesadas y obtené la ganancia diaria de peso calculada automáticamente por lote y período — sin planillas, sin fórmulas manuales.",
                },
                {
                  icon: <path d="M9 12l2 2 4-4M12 3a9 9 0 100 18A9 9 0 0012 3z" />,
                  title: "Gestión sanitaria — HPG y tratamientos",
                  desc: "Cargá HPG, sanidades y tratamientos por lote. Resumen sanitario automático con alertas por vencimiento y desvíos detectados en tiempo real.",
                },
                {
                  icon: <path d="M3 17l4-8 4 4 4-6 4 4" />,
                  title: "Indicadores productivos automáticos",
                  desc: "La plataforma calcula y muestra los indicadores más importantes del rodeo sin necesidad de exportar datos ni construir informes manualmente.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-surface hover:bg-surface-2 transition-colors flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-primary fill-none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {icon}
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text mb-1">{title}</h4>
                    <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* App mockup */}
            <div data-anim="right">
              <AppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY (dark green) ──────────────────────────── */}
      <section className="bg-[#2b3a1e] py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute -right-48 -top-48 w-[600px] h-[600px] rounded-full border-[100px] border-white/[0.03]" />
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div data-anim="left">
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 block mb-3">Por qué nace Safebreeder</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.08] mb-4">
                El campo genera más datos que nunca{" "}
                <em className="not-italic text-[#a5c956]">Muy pocos los aprovechan.</em>
              </h2>
              <p className="text-white/55 text-sm sm:text-base leading-relaxed">
                El problema no es la falta de información — es su procesamiento y análisis.
                Safebreeder nace para cerrar esa brecha y convertir datos del campo en decisiones concretas.
              </p>
            </div>
            <div data-anim="right" className="flex flex-col gap-px bg-white/[0.08] rounded-2xl overflow-hidden">
              {[
                { num: "01", title: "Datos dispersos y sin procesar", desc: "Pesadas, sanidades y movimientos registrados en distintos lugares, sin conexión entre sí. La información existe pero no se puede usar." },
                { num: "02", title: "Tiempo perdido en planillas manuales", desc: "Horas de trabajo procesando datos que deberían ser automáticos. Tiempo que podría destinarse a la gestión real del campo." },
                { num: "03", title: "Desvíos que no se detectan a tiempo", desc: "Sin indicadores automáticos, los problemas productivos y sanitarios se detectan tarde — y cuestan caro." },
              ].map(({ num, title, desc }) => (
                <div key={num} className="bg-white/[0.04] hover:bg-white/[0.07] transition-colors flex items-start gap-5 p-6 sm:p-7">
                  <div className="text-2xl font-bold text-white/15 flex-shrink-0 w-8 leading-none pt-0.5">{num}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1.5">{title}</h4>
                    <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO PLACEHOLDER ─────────────────────────── */}
      <section className="bg-bg py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <div data-anim="up" className="mb-8">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-primary block mb-3">Safebreeder en acción</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text leading-[1.08] mb-3">
              Mirá cómo funciona{" "}<br className="hidden sm:block" />
              en el <em className="not-italic text-primary">campo real</em>
            </h2>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed">Seguí de cerca la gestión de un rodeo de recría desde la plataforma.</p>
          </div>
          {/* Video placeholder */}
          <div data-anim="scale" className="rounded-2xl overflow-hidden aspect-video bg-[#2b3a1e] flex items-center justify-center shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-white/40 text-sm font-medium">Demo próximamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ALTERNATING ──────────────────────── */}
      <section className="bg-surface py-20 sm:py-28" id="funciones">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div data-anim="up" className="mb-16">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-primary block mb-3">Funciones principales</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text leading-[1.08]">
              Todo lo que necesitás{" "}<br className="hidden sm:block" />
              para gestionar tu recría
            </h2>
          </div>

          {/* Feature 1 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center pb-16 border-b border-border">
            <div data-anim="left" className="order-2 lg:order-1">
              <ScreenshotA />
            </div>
            <div data-anim="right" className="order-1 lg:order-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-primary block mb-3">Registro productivo</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2b3a1e] leading-tight mb-4">
                Registrá datos de tus lotes{" "}
                <em className="not-italic text-primary">de forma simple y rápida</em>
              </h3>
              <p className="text-text-muted text-sm sm:text-base leading-relaxed mb-6">
                Ingresá pesadas, sanidades, HPG y tratamientos desde cualquier dispositivo — en el campo o en la oficina.
                Sin curvas de aprendizaje, sin pasos innecesarios.
              </p>
              <ul className="flex flex-col gap-3">
                {["Carga de datos desde celular, tablet o PC", "Historial completo por lote y establecimiento", "Exportación de datos disponible en todo momento"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-muted">
                    <CheckIcon /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-16 border-b border-border">
            <div data-anim="left">
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-primary block mb-3">Gestión sanitaria</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2b3a1e] leading-tight mb-4">
                Seguimiento sanitario{" "}
                <em className="not-italic text-primary">completo e integrado</em>
              </h3>
              <p className="text-text-muted text-sm sm:text-base leading-relaxed mb-6">
                Gestioná el estado sanitario de cada lote con registros de HPG, desparasitaciones y vacunaciones.
                El resumen sanitario se actualiza solo, sin esfuerzo adicional.
              </p>
              <ul className="flex flex-col gap-3">
                {["Conteos de HPG con seguimiento histórico por lote", "Registro de tratamientos y productos aplicados", "Alertas automáticas ante desvíos sanitarios"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-muted">
                    <CheckIcon /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div data-anim="right">
              <ScreenshotB />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center pt-16">
            <div data-anim="left" className="order-2 lg:order-1">
              <ScreenshotC />
            </div>
            <div data-anim="right" className="order-1 lg:order-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-primary block mb-3">Análisis y comparación</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2b3a1e] leading-tight mb-4">
                Indicadores automáticos y{" "}
                <em className="not-italic text-primary">comparación entre lotes</em>
              </h3>
              <p className="text-text-muted text-sm sm:text-base leading-relaxed mb-6">
                Visualizá el rendimiento de cada lote en tiempo real. Comparaá entre establecimientos, detectaá desvíos
                y tomá decisiones con respaldo de datos concretos — sin necesidad de armar un informe.
              </p>
              <ul className="flex flex-col gap-3">
                {["GDP, peso promedio y evolución histórica por lote", "Comparación entre lotes y establecimientos", "Detección automática de desvíos productivos"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-muted">
                    <CheckIcon /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── AUDIENCE (dark green) ─────────────────────── */}
      <section className="bg-[#2b3a1e] py-24 sm:py-32" id="usuarios">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div data-anim="up" className="text-center mb-12">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 block mb-3">¿Para quién es Safebreeder?</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.08] mb-3">
              Diseñado para quienes{" "}<br className="hidden sm:block" />
              <em className="not-italic text-[#a5c956]">trabajan con datos del campo</em>
            </h2>
            <p className="text-white/55 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Una plataforma adaptada a los distintos roles del ecosistema ganadero argentino.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
            {[
              {
                icon: <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8L6 7h12l-2-4z" />,
                title: "Productores ganaderos",
                desc: "Control total de tus establecimientos y lotes desde cualquier dispositivo, sin complejidades técnicas ni planillas externas.",
              },
              {
                icon: <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zM8 12h8M12 8v8" />,
                title: "Médicos veterinarios",
                desc: "Historial clínico centralizado por lote. Gestioná el estado sanitario de múltiples rodeos con alertas automáticas.",
              },
              {
                icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
                title: "Asesores productivos",
                desc: "Analizá múltiples establecimientos en simultáneo y generá reportes profesionales para tus clientes con datos reales.",
              },
              {
                icon: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />,
                title: "Empresas agropecuarias",
                desc: "Centralizá múltiples unidades productivas con visibilidad total del desempeño del sistema en un solo lugar.",
              },
            ].map(({ icon, title, desc }, i) => (
              <div key={title} data-anim="up" data-delay={String(i * 100)} className="bg-white/[0.04] hover:bg-white/[0.08] transition-colors p-6 sm:p-8">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white/70" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-2">{title}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="bg-bg min-h-[480px] flex items-center justify-center text-center py-24 sm:py-32">
        <div data-anim="scale" className="max-w-2xl mx-auto px-6 sm:px-10">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-text-muted block mb-4">Empezá hoy</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-[1.04] mb-5">
            Menos planillas<br />
            <em className="not-italic text-primary">Más decisiones</em>
          </h2>
          <p className="text-text-muted text-sm sm:text-base leading-relaxed mb-10">
            Unite a los productores, veterinarios y asesores que ya están gestionando su recría con datos reales.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors">
              Probar gratis <ArrowIcon />
            </Link>
            <a href="#funciones" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-surface border border-border text-text text-sm font-semibold hover:bg-surface-2 transition-colors">
              Ver todas las funciones
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="bg-[#2b3a1e] border-t border-white/[0.08] pt-14 pb-8">
        <div data-anim="fade" className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-10 pb-10 border-b border-white/[0.08] mb-6">
            <div>
              <span className="font-black text-lg uppercase tracking-widest text-white block mb-1">Safebreeder</span>
              <p className="text-sm text-white/35">Gestión inteligente para recría bovina</p>
            </div>
            <nav className="flex flex-wrap gap-10">
              {[
                {
                  heading: "Plataforma",
                  links: [{ label: "¿Qué es Safebreeder?", href: "#plataforma" }, { label: "Funciones", href: "#funciones" }, { label: "¿Para quién?", href: "#usuarios" }],
                },
                {
                  heading: "Empresa",
                  links: [{ label: "Nuestra visión", href: "/nosotros" }, { label: "Nuestra misión", href: "/nosotros" }, { label: "Contacto", href: "/nosotros#contacto" }],
                },
                {
                  heading: "Acceso",
                  links: [{ label: "Iniciar sesión", href: "/login" }, { label: "Crear cuenta", href: "/signup" }],
                },
                {
                  heading: "Legal",
                  links: [{ label: "Términos de uso", href: "#" }, { label: "Privacidad", href: "#" }],
                },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <h5 className="text-[10px] font-semibold tracking-[0.1em] uppercase text-white/38 mb-3">{heading}</h5>
                  <ul className="flex flex-col gap-2">
                    {links.map(({ label, href }) => (
                      <li key={label}>
                        <a href={href} className="text-sm text-white/50 hover:text-white transition-colors">{label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-xs text-white/25">© 2025 Safebreeder. Todos los derechos reservados.</span>
            <span className="text-xs text-white/25">Desarrollado en Argentina</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
