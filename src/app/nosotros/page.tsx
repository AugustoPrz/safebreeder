"use client";

import Link from "next/link";
import { useEffect } from "react";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function DotIcon() {
  return <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />;
}

export default function NosotrosPage() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bg-bg min-h-screen">
      {/* ── NAV ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-base uppercase tracking-widest text-primary">
            Safebreeder
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-text-muted hover:text-text transition-colors hidden sm:inline">
              Iniciar sesión
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors">
              Probar gratis <ArrowIcon />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO BAND ───────────────────────────────── */}
      <section className="bg-[#2b3a1e] py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 reveal">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 block mb-3">Nuestra empresa</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.06] mb-5">
            Creemos que el futuro de la ganadería<br className="hidden sm:block" />
            es <em className="not-italic text-[#a5c956]">gestionar mejor la información.</em>
          </h1>
          <p className="text-white/55 text-sm sm:text-base leading-relaxed max-w-2xl">
            Safebreeder nace para que cada productor pueda convertir los datos de su campo en decisiones concretas —
            sin planillas, sin complejidad, desde cualquier lugar.
          </p>
        </div>
      </section>

      {/* ── VISION + MISION ─────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-6">
            {[
              {
                tag: "Nuestra visión",
                title: "Más eficiencia. Mejores decisiones. Mayor rentabilidad.",
                desc: "Queremos que cada productor pueda convertir la información de su campo en una ventaja competitiva real — sin importar el tamaño de su operación.",
                items: [
                  "Productores más eficientes en su gestión diaria",
                  "Decisiones respaldadas por datos concretos",
                  "Mayor rentabilidad en los sistemas de recría",
                ],
              },
              {
                tag: "Nuestra misión",
                title: "Herramientas simples que generan resultados concretos.",
                desc: "Desarrollar una plataforma práctica que permita convertir datos del campo en valor productivo, sin agregar complejidad al trabajo diario del productor.",
                items: [
                  "Simplicidad como principio de diseño",
                  "Datos del campo convertidos en valor real",
                  "Sin curvas de aprendizaje innecesarias",
                ],
              },
            ].map(({ tag, title, desc, items }) => (
              <div key={tag} className="reveal border border-border rounded-2xl p-7 sm:p-9 bg-surface">
                <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-text-muted block mb-4">{tag}</span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2b3a1e] leading-tight mb-3">{title}</h2>
                <p className="text-sm text-text-muted leading-relaxed mb-6">{desc}</p>
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-text-muted">
                      <DotIcon /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTO ────────────────────────────────── */}
      <section id="contacto" className="bg-[#2b3a1e] py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 reveal">
          <div className="max-w-xl">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 block mb-3">Contacto</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight mb-4">
              ¿Tenés alguna consulta?<br />
              <em className="not-italic text-[#a5c956]">Hablemos.</em>
            </h2>
            <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8">
              Estamos disponibles para responder tus preguntas, ayudarte a empezar o escuchar tus ideas.
              Escribinos directamente por WhatsApp.
            </p>
            <a
              href="https://wa.me/5492235059492"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 h-12 px-6 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5a] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="bg-[#2b3a1e] border-t border-white/[0.08] py-8">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="font-black text-sm uppercase tracking-widest text-white">Safebreeder</span>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <Link href="/#funciones" className="hover:text-white transition-colors">Funciones</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Crear cuenta</Link>
          </div>
          <span className="text-xs text-white/25">© 2025 Safebreeder</span>
        </div>
      </footer>
    </div>
  );
}
