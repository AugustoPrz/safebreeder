import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen p-3 sm:p-4 bg-bg">
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[calc(100vh-24px)] sm:min-h-[calc(100vh-32px)] bg-[#2b3a1e]">
        {/* Background video */}
        <video
          aria-hidden
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero.mp4"
        />
        {/* Dark overlay for readability */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[#1a2410]/80 via-[#2b3a1e]/70 to-[#3d3018]/75"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20"
        />

        {/* Top nav */}
        <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6">
          <div className="font-black text-lg sm:text-xl uppercase tracking-widest text-white">
            Safebreeder
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/85">
            <a href="#producto" className="hover:text-white transition-colors">
              Producto
            </a>
            <a href="#como-funciona" className="hover:text-white transition-colors">
              Cómo funciona
            </a>
            <a href="#nosotros" className="hover:text-white transition-colors">
              Nosotros
            </a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="hidden sm:inline text-sm font-medium text-white/85 hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              Probar gratis
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="w-4 h-4"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 px-6 sm:px-10 pt-16 sm:pt-28 pb-10 sm:pb-14 grid lg:grid-cols-2 gap-10 lg:gap-6 items-end min-h-[calc(100vh-180px)]">
          <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight">
            Gestioná tu rodeo como siempre quisiste.
          </h1>
          <div className="max-w-md lg:justify-self-end space-y-6">
            <p className="text-white/90 text-base sm:text-lg leading-relaxed">
              La app que centraliza la sanidad y la productividad de tu ganado.
              Cargá HPG, pesadas y tratamientos, y obtené reportes e indicadores
              en tiempo real desde cualquier lugar.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-white text-text text-sm font-semibold hover:bg-surface transition-colors"
            >
              Probar gratis
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="w-4 h-4"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
