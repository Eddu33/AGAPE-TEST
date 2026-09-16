"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  BarChart3,
  ExternalLink,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    router.push("/admin/login");
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "Agenda & Turnos", icon: CalendarDays },
    { href: "/admin/clients", label: "Clientas", icon: Users },
    { href: "/admin/stats", label: "Estadísticas", icon: BarChart3 },
  ];

  return (
    <>
      {/* Header exclusivo para el Panel Administrativo */}
      <header className="sticky top-0 z-40 w-full bg-[#2B2B2B] text-[#FFFFFF] border-b border-[#444444] shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo y título administrativo */}
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="flex flex-col">
              <span className="font-cinzel text-lg sm:text-xl font-bold tracking-widest text-[#FFFFFF]">
                ÁGAPE STUDIO
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold -mt-1">
                Panel Administrativo
              </span>
            </Link>
          </div>

          {/* Enlaces de escritorio del panel */}
          <nav className="hidden sm:flex items-center gap-6 text-xs font-medium">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                    isActive
                      ? "bg-[#D4AF37] text-[#2B2B2B] font-bold"
                      : "text-[#DCC5A3] hover:text-[#FFFFFF] hover:bg-[#3D3D3D]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Botones de acción derecha */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3D3D3D] text-[#DCC5A3] text-xs hover:text-[#FFFFFF] hover:bg-[#4A4A4A] transition-colors"
              title="Ver el sitio como clienta"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Sitio Clientas</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-400/40 text-red-300 hover:bg-red-950/50 text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Barra móvil inferior exclusiva del panel administrativo */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#2B2B2B] text-[#FFFFFF] border-t border-[#444444] shadow-lg pb-safe">
        <div className="grid grid-cols-3 h-16 items-center px-4">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 transition-colors ${
                  isActive ? "text-[#D4AF37] font-bold" : "text-[#A3A3A3] hover:text-[#FFFFFF]"
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
