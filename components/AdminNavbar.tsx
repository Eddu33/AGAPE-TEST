"use client";

import { useState, useRef, useEffect } from "react";
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
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    setIsOpen(false);
    router.push("/admin/login");
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      href: "/admin/dashboard",
      label: "Agenda & Turnos",
      desc: "Almanaque mensual interactivo y turnos reservados",
      icon: CalendarDays,
    },
    {
      href: "/admin/services",
      label: "Servicios & Precios",
      desc: "Kapping, Semipermanente, Soft Gel, fotos y detalles",
      icon: Sparkles,
    },
    {
      href: "/admin/finances",
      label: "Finanzas & Gastos",
      desc: "Ingresos, egresos de materiales y ganancia neta",
      icon: DollarSign,
    },
    {
      href: "/admin/clients",
      label: "Clientas & CRM",
      desc: "Cumpleaños, historial y recuperación de clientas",
      icon: Users,
    },
    {
      href: "/admin/promotions",
      label: "Promos & Gift Cards",
      desc: "Vouchers de regalo y campañas de descuento",
      icon: Gift,
    },
    {
      href: "/admin/messages",
      label: "Plantillas WhatsApp",
      desc: "Confirmación, recordatorios y simulador de chat",
      icon: MessageSquare,
    },
    {
      href: "/admin/stats",
      label: "Estadísticas Generales",
      desc: "Métricas de asistencia y rendimiento del estudio",
      icon: BarChart3,
    },
    {
      href: "/admin/gallery",
      label: "Galería de Imágenes",
      desc: "Repositorio de fotos para tus servicios",
      icon: ImageIcon,
    },
    {
      href: "/admin/settings",
      label: "Configuración",
      desc: "Ubicación de atención y número de WhatsApp",
      icon: Settings,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#171717] dark:text-[#FFFFFF] border-b border-[#E2DBD0] dark:border-[#333333] shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo y título administrativo */}
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#D4AF37] to-[#8C7A5B] flex items-center justify-center font-cinzel font-bold text-[#121212] shadow-md group-hover:scale-105 transition-transform">
            Á
          </div>
          <div className="flex flex-col">
            <span className="font-cinzel text-base sm:text-lg font-bold tracking-widest text-[#171717] dark:text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">
              ÁGAPE STUDIO
            </span>
            <div className="flex items-center gap-1.5 -mt-1">
              <ShieldCheck className="w-3 h-3 text-[#B38E22] dark:text-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-wider text-[#B38E22] dark:text-[#D4AF37] font-semibold">
                Panel Administrativo
              </span>
            </div>
          </div>
        </Link>

        {/* Acciones de Cabecera: Selector de Tema + Botón Hamburguesa */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all cursor-pointer select-none shadow-xs ${
                isOpen
                  ? "bg-[#D4AF37] text-[#121212] border-[#D4AF37] font-bold shadow-md"
                  : "bg-[#F5F2EB] dark:bg-[#2E2E2E] text-[#171717] dark:text-[#FFFFFF] border-[#DDD8CF] dark:border-[#4A4A4A] hover:border-[#D4AF37] hover:bg-[#EBE6DC] dark:hover:bg-[#383838]"
              }`}
              aria-expanded={isOpen}
              aria-label="Abrir menú de administración"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#B38E22] dark:text-[#D4AF37]" />}
              <span className="text-xs font-semibold tracking-wide font-montserrat">
                {isOpen ? "Cerrar" : "Módulos"}
              </span>
            </button>

            {/* Bloque Desplegable Hamburguesa */}
            {isOpen && (
              <div className="absolute right-0 mt-3 w-[340px] sm:w-[420px] max-w-[92vw] bg-[#FFFFFF] dark:bg-[#1E1E1E] border border-[#DDD8CF] dark:border-[#444444] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200 z-50 text-[#171717] dark:text-white">
              {/* Encabezado del bloque */}
              <div className="p-4 bg-linear-to-r from-[#FAF8F5] to-[#F5F2EB] dark:from-[#2B2B2B] dark:to-[#1E1E1E] border-b border-[#DDD8CF] dark:border-[#333333] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#B38E22] dark:text-[#D4AF37]">
                    Menú Administrativo
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#888888] mt-0.5">
                    Selecciona el módulo para gestionar tu estudio
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-[#EAE6DC] dark:bg-[#333333] text-[#444444] dark:text-[#CCCCCC] px-2 py-0.5 rounded-full border border-[#DDD8CF] dark:border-[#444444]">
                  Ágape OS
                </span>
              </div>

              {/* Lista de Módulos */}
              <div className="p-2.5 max-h-[60vh] overflow-y-auto space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all group ${
                        isActive
                          ? "bg-[#D4AF37] text-[#121212] font-bold shadow-md"
                          : "hover:bg-[#F5F2EB] dark:hover:bg-[#2A2A2A] text-[#333333] dark:text-[#E0E0E0] hover:text-[#121212] dark:hover:text-[#FFFFFF]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? "bg-[#121212] text-[#D4AF37]"
                              : "bg-[#F5F2EB] dark:bg-[#2A2A2A] text-[#B38E22] dark:text-[#D4AF37] group-hover:bg-[#EBE6DC] dark:group-hover:bg-[#383838]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight truncate">
                            {link.label}
                          </p>
                          <p
                            className={`text-[10px] truncate mt-0.5 ${
                              isActive ? "text-[#3D3319]" : "text-[#777777] dark:text-[#888888]"
                            }`}
                          >
                            {link.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                          isActive ? "text-[#121212]" : "text-[#888888] dark:text-[#666666]"
                        }`}
                      />
                    </Link>
                  );
                })}

                {/* Enlace para Ver Web Clientas */}
                <div className="pt-1">
                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#282828] hover:bg-[#F2EFEB] dark:hover:bg-[#333333] text-[#B38E22] dark:text-[#DCC5A3] transition-all group border border-[#DDD8CF] dark:border-[#3A3A3A]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#F0EBE1] dark:bg-[#1F1F1F] flex items-center justify-center text-[#B38E22] dark:text-[#DCC5A3] shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#171717] dark:text-[#FFFFFF]">Ver Sitio de Clientas</p>
                        <p className="text-[10px] text-[#777777] dark:text-[#888888]">Abrir la página pública de reservas</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#777777] dark:text-[#888888]" />
                  </Link>
                </div>
              </div>

              {/* Pie del bloque con Selector de Tema y Botón de Cerrar Sesión */}
              <div className="p-3 bg-[#FAF8F5] dark:bg-[#171717] border-t border-[#DDD8CF] dark:border-[#333333] space-y-2">
                <ThemeToggle variant="full" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-red-950/40 hover:bg-rose-100 dark:hover:bg-red-900/60 border border-rose-200 dark:border-red-500/30 text-rose-700 dark:text-red-300 hover:text-rose-900 dark:hover:text-red-100 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión del Panel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}
