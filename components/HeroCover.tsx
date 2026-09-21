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
    <section className="relative w-full h-[calc(100dvh-64px)] min-h-[550px] flex flex-col justify-end items-center overflow-hidden select-none bg-[#0D0D0D]">
      {/* Contenedor del fondo que ocupa TODA LA PANTALLA con desvanecimiento dinámico al hacer scroll */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-100 ease-out"
        style={{ opacity }}
      >
        {/* Imagen del logo a pantalla completa absoluta (sin marcos ni recortes) */}
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/agape-bg.png')" }}
        />

        {/* Desvanecimiento sutil al final para conectar suavemente con la siguiente sección */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#FAF8F5] dark:from-[#0D0D0D] to-transparent" />
      </div>

      {/* Indicador inferior animado para invitar a scrollear */}
      <button
        type="button"
        onClick={scrollToInfo}
        className="relative z-10 mb-8 sm:mb-12 flex flex-col items-center gap-2 text-[#D4AF37] hover:text-[#FFFFFF] transition-all cursor-pointer group animate-bounce focus:outline-none"
        style={{ opacity: Math.max(0.4, opacity) }}
        aria-label="Deslizar para ver la información"
      >
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37] group-hover:text-[#FFFFFF] transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Desliza para ver más
        </span>
        <div className="w-8 h-8 rounded-full border border-[#D4AF37]/60 flex items-center justify-center group-hover:border-[#FFFFFF] transition-colors bg-[#0D0D0D]/70 backdrop-blur-sm shadow-md">
          <ChevronDown className="w-4 h-4 text-[#D4AF37] group-hover:text-[#FFFFFF] transition-colors" />
        </div>
      </button>
    </section>
  );
}
