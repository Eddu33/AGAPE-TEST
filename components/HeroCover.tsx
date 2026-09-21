"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function HeroCover() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight || 800;
      // As the user scrolls down, opacity decreases from 1 to 0
      const threshold = windowHeight * 0.7;
      const newOpacity = Math.max(0, 1 - scrollY / threshold);
      setOpacity(newOpacity);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToInfo = () => {
    const target = document.getElementById("informacion");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({
        top: window.innerHeight - 64,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative w-full h-[calc(100dvh-64px)] min-h-[520px] flex flex-col justify-between items-center overflow-hidden select-none bg-[#0A0A0A]">
      {/* Contenedor del fondo con desvanecimiento dinámico al hacer scroll */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-100 ease-out"
        style={{ opacity }}
      >
        {/* Textura ambiental difusa a pantalla completa */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 filter blur-[2px] scale-105"
          style={{ backgroundImage: "url('/agape-bg.jpg')" }}
        />

        {/* Monograma / Arte central ÁGAPE sin elementos que lo tapen */}
        <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-12">
          <div
            className="w-full max-w-2xl sm:max-w-3xl aspect-square bg-contain bg-center bg-no-repeat filter drop-shadow-[0_20px_60px_rgba(0,0,0,0.95)]"
            style={{ backgroundImage: "url('/agape-bg.jpg')" }}
          />
        </div>

        {/* Viñeta sutil para fundir suavemente los bordes con el fondo negro */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/40 via-transparent to-[#0A0A0A]" />
      </div>

      {/* Espacio superior para balancear el contenido */}
      <div />

      {/* Indicador inferior animado para invitar a scrollear */}
      <button
        type="button"
        onClick={scrollToInfo}
        className="relative z-10 mb-8 sm:mb-12 flex flex-col items-center gap-2 text-[#D4AF37] hover:text-[#FFFFFF] transition-all cursor-pointer group animate-bounce focus:outline-none"
        style={{ opacity: Math.max(0.3, opacity) }}
        aria-label="Deslizar para ver la información"
      >
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37] group-hover:text-[#FFFFFF] transition-colors drop-shadow-md">
          Desliza para ver más
        </span>
        <div className="w-8 h-8 rounded-full border border-[#D4AF37]/50 flex items-center justify-center group-hover:border-[#FFFFFF] transition-colors bg-[#0D0D0D]/60 backdrop-blur-sm">
          <ChevronDown className="w-4 h-4 text-[#D4AF37] group-hover:text-[#FFFFFF] transition-colors" />
        </div>
      </button>
    </section>
  );
}
