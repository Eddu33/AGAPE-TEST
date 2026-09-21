"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Calendar, Home, Layers } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/servicios", label: "Servicios", icon: Layers },
    { href: "/book", label: "Reservar Turno", icon: Calendar, highlight: true },
  ];

  return (
    <>
      {/* Barra de navegación superior para Clientas (Desktop y Header Móvil) */}
      <header className="sticky top-0 z-40 w-full bg-[#121212]/90 backdrop-blur-md border-b border-[#262626] shadow-md transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo / Nombre de marca */}
          <Link href="/" className="flex flex-col items-start group">
            <span className="font-cinzel text-xl sm:text-2xl font-semibold tracking-widest text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">
              ÁGAPE STUDIO
            </span>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#D4AF37] font-medium -mt-1">
              Nails & Beauty
            </span>
          </Link>

          {/* Enlaces y selector de tema */}
          <div className="flex items-center gap-3 sm:gap-6">
            <nav className="hidden sm:flex items-center gap-8 text-sm font-medium">
              <Link
                href="/"
                className={`transition-colors hover:text-[#D4AF37] ${
                  pathname === "/" ? "text-[#D4AF37] font-semibold" : "text-[#D1D1D1]"
                }`}
              >
                Inicio
              </Link>
              <Link
                href="/servicios"
                className={`transition-colors hover:text-[#D4AF37] ${
                  pathname === "/servicios" ? "text-[#D4AF37] font-semibold" : "text-[#D1D1D1]"
                }`}
              >
                Servicios
              </Link>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D4AF37] text-[#121212] hover:bg-[#FFFFFF] hover:text-[#121212] transition-all shadow-md text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#121212]" />
                <span>Reservar Turno</span>
              </Link>
            </nav>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Barra de navegación inferior fija para celular (Solo vista clienta) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-md border-t border-[#262626] shadow-2xl pb-safe">
        <div className="grid grid-cols-3 h-16 items-center px-4">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center -mt-4"
                >
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-[#121212] flex items-center justify-center shadow-lg border-2 border-[#121212] hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-[#121212]" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#E5E5E5] mt-1">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 transition-colors ${
                  isActive ? "text-[#D4AF37] font-semibold" : "text-[#888888] hover:text-[#FFFFFF]"
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[11px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
