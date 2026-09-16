"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  SERVICIOS_AGAPE,
  EXTRAS_AGAPE,
  Service,
  Extra,
  calculateTotalDuration,
  calculateTotalPrice,
  formatPrice,
  formatDuration,
} from "@/lib/services";
import { getPublicServices } from "../actions";
import {
  Clock,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Plus,
  Check,
} from "lucide-react";

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>(SERVICIOS_AGAPE);
  const [selectedService, setSelectedService] = useState<Service>(SERVICIOS_AGAPE[0]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  useEffect(() => {
    getPublicServices().then((list) => {
      if (list && list.length > 0) {
        setServices(list as Service[]);
        setSelectedService(list[0] as Service);
      }
    });
  }, []);

  // Extras actualmente seleccionados
  const selectedExtras = EXTRAS_AGAPE.filter((extra) =>
    selectedExtraIds.includes(extra.id)
  );

  const totalDuration = calculateTotalDuration(selectedService, selectedExtras);
  const totalPrice = calculateTotalPrice(selectedService, selectedExtras);

  const toggleExtra = (id: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Construir enlace hacia la reserva con parámetros
  const bookingUrl = `/book?service=${selectedService.id}${
    selectedExtraIds.length > 0 ? `&extras=${selectedExtraIds.join(",")}` : ""
  }`;

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF]">
      <Navbar />

      {/* ENCABEZADO DE LA SECCIÓN */}
      <section className="bg-gradient-to-b from-[#F5F0E6] via-[#FAF8F5] to-[#FFFFFF] pt-10 pb-12 border-b border-[#DCC5A3]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFFFFF] border border-[#DCC5A3] shadow-2xs text-xs text-[#2B2B2B] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="tracking-wide uppercase font-semibold text-[10px]">
              Catálogo & Simulador de Citas
            </span>
          </div>
          <h1 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#2B2B2B] mb-3">
            Nuestros Servicios & Extras
          </h1>
          <p className="text-sm text-[#525252] font-light max-w-xl mx-auto leading-relaxed">
            Explora cada técnica con total transparencia. Conoce exactamente qué incluye, los tiempos reales de trabajo y personaliza tus uñas agregando nail art o remoción.
          </p>
        </div>
      </section>

      {/* SELECTOR DE SERVICIOS (TABS / CARDS) */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-3">
          Paso 1 · Selecciona un Servicio Principal
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {services.map((service) => {
            const isSelected = selectedService.id === service.id;
            return (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? "bg-[#2B2B2B] text-[#FFFFFF] border-[#D4AF37] shadow-md scale-[1.02]"
                    : "bg-[#FFFFFF] text-[#2B2B2B] border-[#DCC5A3]/40 hover:border-[#D4AF37] hover:bg-[#F5F0E6]/30"
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block mb-2 ${
                      isSelected ? "bg-[#D4AF37] text-[#2B2B2B]" : "bg-[#F5F0E6] text-[#8C7A5B]"
                    }`}
                  >
                    {service.categoria}
                  </span>
                  <div
                    className={`font-cinzel text-base font-semibold leading-snug mb-2 ${
                      isSelected ? "text-[#FFFFFF]" : "text-[#2B2B2B]"
                    }`}
                  >
                    {service.nombre}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-current/10 flex items-center justify-between text-xs">
                  <span className="font-semibold">{formatPrice(service.precio)}</span>
                  <span
                    className={`flex items-center gap-1 text-[11px] ${
                      isSelected ? "text-[#DCC5A3]" : "text-[#737373]"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {formatDuration(service.duracion)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* DETALLE COMPLETO DEL SERVICIO SELECCIONADO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
          {/* Ficha técnica y alcances */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-xs">
              {/* Foto modelo del estilo de uñas terminado */}
              {selectedService.imagenUrl && (
                <div className="relative w-full h-60 sm:h-72 rounded-2xl overflow-hidden mb-6 bg-[#F5F0E6] border border-[#DCC5A3]/40 shadow-xs">
                  <img
                    src={selectedService.imagenUrl}
                    alt={selectedService.nombre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#2B2B2B]/80 text-[#FFFFFF] backdrop-blur-xs text-[11px] font-semibold">
                    {selectedService.categoria}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
                  {selectedService.nombre}
                </h2>
                <span className="text-xl font-bold text-[#D4AF37] font-cinzel">
                  {formatPrice(selectedService.precio)}
                </span>
              </div>

              <p className="text-sm text-[#525252] font-light leading-relaxed mb-6">
                {selectedService.descripcion}
              </p>

              {/* Métricas clave: Duración y Mantenimiento */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F5F0E6]/50 border border-[#DCC5A3]/30 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FFFFFF] flex items-center justify-center text-[#D4AF37] shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#737373]">
                      Duración base
                    </div>
                    <div className="text-sm font-semibold text-[#2B2B2B]">
                      {formatDuration(selectedService.duracion)} ({selectedService.duracion} min)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FFFFFF] flex items-center justify-center text-[#D4AF37] shadow-2xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#737373]">
                      Mantenimiento sugerido
                    </div>
                    <div className="text-sm font-semibold text-[#2B2B2B]">
                      Cada {selectedService.mantenimientoDias} días
                    </div>
                  </div>
                </div>
              </div>

              {/* Qué incluye vs Qué NO incluye */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2B2B2B] mb-3">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>Qué incluye:</span>
                  </div>
                  <ul className="space-y-2">
                    {selectedService.queIncluye.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#525252]">
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#737373] mb-3">
                    <XCircle className="w-4 h-4 text-[#A8A29E]" />
                    <span>Qué NO incluye:</span>
                  </div>
                  <ul className="space-y-2">
                    {selectedService.queNoIncluye.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#737373]">
                        <span className="text-[#A8A29E] shrink-0 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Garantía e instrucciones */}
              <div className="mt-6 pt-6 border-t border-[#F5F0E6] space-y-3 text-xs">
                <div className="flex items-start gap-2 text-[#525252]">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#2B2B2B]">Garantía:</strong> {selectedService.garantia}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-[#525252]">
                  <HelpCircle className="w-4 h-4 text-[#DCC5A3] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#2B2B2B]">Preparación para la cita:</strong>{" "}
                    {selectedService.instrucciones}
                  </span>
                </div>
              </div>
            </div>

            {/* SELECCIÓN DE EXTRAS (Paso 2) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    Paso 2 · Personaliza con Extras
                  </span>
                  <h3 className="font-cinzel text-xl font-bold text-[#2B2B2B] mt-1">
                    Diseños & Servicios Adicionales
                  </h3>
                </div>
              </div>
              <p className="text-xs text-[#666666] font-light mb-5">
                Los extras agregan tiempo y valor a tu sesión. Selecciónalos para que la agenda reserve el bloque horario exacto y evite demoras.
              </p>

              <div className="space-y-3">
                {EXTRAS_AGAPE.map((extra) => {
                  const isChecked = selectedExtraIds.includes(extra.id);
                  return (
                    <div
                      key={extra.id}
                      onClick={() => toggleExtra(extra.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isChecked
                          ? "bg-[#F5F0E6]/80 border-[#D4AF37] shadow-2xs"
                          : "bg-[#FFFFFF] border-[#E5E5E5] hover:border-[#DCC5A3]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 shrink-0 transition-colors ${
                            isChecked
                              ? "bg-[#2B2B2B] border-[#2B2B2B] text-[#FFFFFF]"
                              : "border-[#DCC5A3] bg-[#FFFFFF]"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#2B2B2B]">
                            {extra.nombre}
                          </div>
                          <div className="text-[11px] text-[#666666] font-light mt-0.5">
                            {extra.descripcion}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-[#2B2B2B]">
                          +{formatPrice(extra.precio)}
                        </div>
                        <div className="text-[10px] text-[#737373] flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-[#D4AF37]" />
                          +{extra.duracion} min
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SIMULADOR EN VIVO Y RESUMEN (Sticky Sidebar) */}
          <div className="lg:col-span-1 sticky top-20">
            <div className="p-6 rounded-3xl bg-[#2B2B2B] text-[#FFFFFF] border-2 border-[#D4AF37] shadow-xl">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] mb-2">
                Resumen de tu Turno
              </div>
              <h3 className="font-cinzel text-xl font-bold text-[#FFFFFF] mb-4">
                Cálculo Estimado
              </h3>

              <div className="space-y-3 text-xs border-b border-[#444444] pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-[#A3A3A3]">{selectedService.nombre}</span>
                  <span className="font-semibold">{formatPrice(selectedService.precio)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#A3A3A3]">
                  <span>Tiempo base:</span>
                  <span>{selectedService.duracion} min</span>
                </div>

                {selectedExtras.map((extra) => (
                  <div key={extra.id} className="flex justify-between text-[#DCC5A3] pt-1">
                    <span>+ {extra.nombre}</span>
                    <span>+{formatPrice(extra.precio)}</span>
                  </div>
                ))}
              </div>

              {/* Totales calculados */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A3A3A3] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    Duración Total:
                  </span>
                  <span className="font-bold text-[#FFFFFF] text-sm">
                    {formatDuration(totalDuration)} ({totalDuration} min)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#444444]">
                  <span className="font-cinzel text-sm text-[#DCC5A3]">Total Estimado:</span>
                  <span className="font-cinzel text-2xl font-bold text-[#D4AF37]">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Botón hacia reserva con los extras */}
              <Link
                href={bookingUrl}
                className="w-full py-3.5 px-4 rounded-full bg-[#D4AF37] text-[#2B2B2B] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FFFFFF] transition-all shadow-md group"
              >
                <span>Agendar este Turno</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="text-[10px] text-[#A3A3A3] text-center mt-3 font-light">
                * En el siguiente paso podrás elegir el día y horario disponible.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
