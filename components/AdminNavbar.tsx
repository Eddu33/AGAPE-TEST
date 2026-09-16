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
  DollarSign,
  Gift,
  MessageSquare,
} from "lucide-react";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    router.push("/admin/login");
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "Agenda", icon: CalendarDays },
    { href: "/admin/services", label: "Servicios", icon: Sparkles },
    { href: "/admin/finances", label: "Finanzas", icon: DollarSign },
    { href: "/admin/clients", label: "Clientas", icon: Users },
    { href: "/admin/promotions", label: "Promos & Gift", icon: Gift },
    { href: "/admin/messages", label: "Mensajes", icon: MessageSquare },
    { href: "/admin/stats", label: "Estadísticas", icon: BarChart3 },
  ];

  return (
    <>
      {/* Header exclusivo para el Panel Administrativo */}
      <header className="sticky top-0 z-40 w-full bg-[#2B2B2B] text-[#FFFFFF] border-b border-[#444444] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo y título administrativo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/admin/dashboard" className="flex flex-col">
              <span className="font-cinzel text-lg font-bold tracking-widest text-[#FFFFFF]">
                ÁGAPE STUDIO
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold -mt-1">
                Panel Administrativo
              </span>
            </Link>
          </div>

          {/* Enlaces de escritorio del panel */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-medium overflow-x-auto py-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#D4AF37] text-[#2B2B2B] font-bold shadow-sm"
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
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3D3D3D] text-[#DCC5A3] text-xs hover:text-[#FFFFFF] hover:bg-[#4A4A4A] transition-colors"
              title="Ver el sitio como clienta"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Web</span>
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

        {/* Sub-barra horizontal con scroll táctil para tablets y móviles */}
        <div className="lg:hidden border-t border-[#3D3D3D] bg-[#222222] px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#D4AF37] text-[#2B2B2B] font-bold"
                    : "text-[#A3A3A3] hover:text-[#FFFFFF] bg-[#2E2E2E]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>
    </>
  );
}

