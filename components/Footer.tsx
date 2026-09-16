"use client";

import Link from "next/link";
import { Heart, Instagram, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#F5F0E6] text-[#2B2B2B] pt-12 pb-24 sm:pb-12 border-t border-[#DCC5A3]/40 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          {/* Logo y Esencia */}
          <div className="font-cinzel text-2xl tracking-widest font-semibold mb-2">
            ÁGAPE STUDIO
          </div>
          <p className="font-cinzel text-sm text-[#D4AF37] italic mb-4">
            “La belleza nace del amor perfecto”
          </p>
          <p className="text-xs text-[#525252] max-w-md leading-relaxed mb-6 font-light">
            Cuidado profesional de uñas, kapping, semipermanente y nail art diseñado con dedicación, excelencia y amor en cada detalle.
          </p>

          {/* Valores de marca */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] tracking-wider uppercase text-[#737373] mb-6">
            <span>Amor</span>
            <span>•</span>
            <span>Excelencia</span>
            <span>•</span>
            <span>Gracia</span>
            <span>•</span>
            <span>Integridad</span>
            <span>•</span>
            <span>Belleza</span>
          </div>

          {/* Distintivo de calidad y excelencia */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFFFF]/80 border border-[#DCC5A3]/50 text-xs text-[#525252] mb-8 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-light tracking-wide">Atención personalizada y dedicación en cada detalle</span>
          </div>

          <div className="w-full border-t border-[#DCC5A3]/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373]">
            <p>
              &copy; {new Date().getFullYear()} ÁGAPE STUDIO. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <span className="hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-1">
                <Instagram className="w-4 h-4" /> @agapestudio.nails
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
