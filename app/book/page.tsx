"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
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
import { SlotAvailability, formatDateKey } from "@/lib/availability";
import { getCalculatedAvailability, bookAgapeAppointment } from "../actions";
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  FileText,
  Check,
} from "lucide-react";
import { format, isBefore, startOfToday } from "date-fns";
import { es } from "date-fns/locale";

function BookContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Estado de Servicio y Extras
  const initialServiceId = searchParams.get("service") || "kapping";
  const initialExtraIds = searchParams.get("extras")
    ? searchParams.get("extras")!.split(",")
    : [];

  const [selectedService, setSelectedService] = useState<Service>(() => {
    return (
      SERVICIOS_AGAPE.find((s) => s.id === initialServiceId) ||
      SERVICIOS_AGAPE[0]
    );
  });
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>(initialExtraIds);

  // 2. Estado de Fecha y Horario
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const today = new Date();
    // Si hoy es domingo (0) o lunes (1), sugerir el próximo martes
    const day = today.getDay();
    if (day === 0) {
      const next = new Date(today);
      next.setDate(today.getDate() + 2);
      return next;
    }
    if (day === 1) {
      const next = new Date(today);
      next.setDate(today.getDate() + 1);
      return next;
    }
    return today;
  });

  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [isClosedDay, setIsClosedDay] = useState(false);

  // 3. Formulario de Datos
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extras seleccionados
  const selectedExtras = EXTRAS_AGAPE.filter((e) =>
    selectedExtraIds.includes(e.id)
  );
  const totalDuration = calculateTotalDuration(selectedService, selectedExtras);
  const totalPrice = calculateTotalPrice(selectedService, selectedExtras);

  // Cargar disponibilidad cada vez que cambia la fecha o la duración total
  useEffect(() => {
    if (!selectedDate) return;

    const dateKey = formatDateKey(selectedDate);
    setLoadingSlots(true);
    setSelectedSlot(null);
    setErrorMessage(null);

    getCalculatedAvailability(dateKey, totalDuration)
      .then((res) => {
        if (res.success) {
          setSlots(res.slots);
          setIsClosedDay(Boolean(res.isClosedDay));
        } else {
          setSlots([]);
        }
      })
      .catch((err) => {
        console.error("Error consultando disponibilidad:", err);
        setSlots([]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedDate, totalDuration]);

  const toggleExtra = (id: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      setErrorMessage("Por favor selecciona una fecha y un horario disponible.");
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Por favor ingresa tu nombre completo.");
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage("Por favor ingresa un número de teléfono válido para WhatsApp.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const dateKey = formatDateKey(selectedDate);
      const res = await bookAgapeAppointment({
        name: name.trim(),
        phone: phone.trim(),
        serviceId: selectedService.id,
        extraIds: selectedExtraIds,
        date: dateKey,
        startTime: selectedSlot.time,
        notes: notes.trim(),
      });

      if (res.success && res.appointmentId) {
        router.push(`/book/confirmation?id=${res.appointmentId}`);
      } else {
        setErrorMessage(res.error || "No se pudo concretar la reserva.");
        // Refrescar disponibilidad
        const refreshed = await getCalculatedAvailability(dateKey, totalDuration);
        setSlots(refreshed.slots);
      }
    } catch (err: any) {
      setErrorMessage("Ocurrió un error de red al procesar tu reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Encabezado */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F0E6] border border-[#DCC5A3] shadow-2xs text-xs text-[#2B2B2B] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="font-semibold text-[10px] tracking-wider uppercase">
            Sistema de Turnos Online
          </span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-[#2B2B2B] mb-2">
          Reserva tu Cita en ÁGAPE STUDIO
        </h1>
        <p className="text-xs sm:text-sm text-[#666666] font-light">
          Selecciona tu servicio, elige el día y el horario libre que mejor se adapte a tu rutina.
        </p>
      </div>

      <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: PASO 1, 2 y 3 */}
        <div className="lg:col-span-2 space-y-8">
          {/* PASO 1: SERVICIO & EXTRAS */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-bold flex items-center justify-center">
                1
              </div>
              <div>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#2B2B2B]">
                  Elige tu Servicio Principal
                </h2>
                <p className="text-xs text-[#737373] font-light">
                  Cada servicio tiene una duración base para asegurar máxima prolijidad.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {SERVICIOS_AGAPE.map((service) => {
                const isSelected = selectedService.id === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#2B2B2B] text-[#FFFFFF] border-[#D4AF37] shadow-sm"
                        : "bg-[#FFFFFF] text-[#2B2B2B] border-[#E5E5E5] hover:border-[#DCC5A3]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-cinzel text-sm font-semibold">
                        {service.nombre}
                      </span>
                      <span className="text-xs font-bold text-[#D4AF37]">
                        {formatPrice(service.precio)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-2 opacity-80">
                      <Clock className="w-3 h-3" />
                      <span>{service.duracion} minutos base</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extras opcionales */}
            <div className="border-t border-[#F5F0E6] pt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-3">
                Extras y Diseños (opcional)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EXTRAS_AGAPE.map((extra) => {
                  const isChecked = selectedExtraIds.includes(extra.id);
                  return (
                    <div
                      key={extra.id}
                      onClick={() => toggleExtra(extra.id)}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? "bg-[#F5F0E6] border-[#D4AF37] font-medium text-[#2B2B2B]"
                          : "bg-[#FFFFFF] border-[#E5E5E5] text-[#525252] hover:border-[#DCC5A3]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked
                              ? "bg-[#2B2B2B] border-[#2B2B2B] text-[#FFFFFF]"
                              : "border-[#DCC5A3] bg-[#FFFFFF]"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{extra.nombre}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-[#2B2B2B]">
                          +{formatPrice(extra.precio)}
                        </span>
                        <span className="text-[10px] text-[#737373] block">
                          +{extra.duracion}m
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PASO 2: CALENDARIO Y HORARIOS DISPONIBLES */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-bold flex items-center justify-center">
                2
              </div>
              <div>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#2B2B2B]">
                  Selecciona Fecha y Horario Libre
                </h2>
                <p className="text-xs text-[#737373] font-light">
                  El motor calcula los horarios que garantizan {totalDuration} min de atención continua.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Selector de calendario */}
              <div className="flex justify-center p-3 rounded-2xl bg-[#F5F0E6]/30 border border-[#DCC5A3]/30">
                <CalendarUI
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => isBefore(date, startOfToday())}
                  locale={es}
                  className="rounded-md"
                />
              </div>

              {/* Lista de horarios generados */}
              <div>
                <div className="text-xs font-bold text-[#2B2B2B] mb-2 flex items-center justify-between">
                  <span>
                    {selectedDate ? (
                      format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
                    ) : (
                      "Selecciona un día"
                    )}
                  </span>
                  <span className="text-[11px] font-normal text-[#737373]">
                    Duración: {formatDuration(totalDuration)}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="p-8 text-center text-xs text-[#737373]">
                    <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Calculando horarios sin superposiciones...
                  </div>
                ) : isClosedDay ? (
                  <div className="p-6 rounded-2xl bg-[#F5F0E6]/60 text-center border border-[#DCC5A3]/40">
                    <AlertCircle className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
                    <p className="text-xs font-medium text-[#2B2B2B]">
                      El estudio no atiende en este día
                    </p>
                    <p className="text-[11px] text-[#737373] mt-1">
                      Atendemos de Martes a Sábados. Por favor selecciona otro día en el calendario.
                    </p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#F5F0E6]/60 text-center border border-[#DCC5A3]/40">
                    <Clock className="w-6 h-6 text-[#737373] mx-auto mb-2" />
                    <p className="text-xs font-medium text-[#2B2B2B]">
                      Agenda completa para este día
                    </p>
                    <p className="text-[11px] text-[#737373] mt-1">
                      No quedan bloques libres de {totalDuration} minutos. Prueba seleccionando otra fecha.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?.time === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#2B2B2B] text-[#FFFFFF] border-[#D4AF37] shadow-sm font-semibold scale-102"
                              : "bg-[#FFFFFF] text-[#2B2B2B] border-[#E5E5E5] hover:border-[#DCC5A3] hover:bg-[#F5F0E6]/40"
                          }`}
                        >
                          <div className="text-sm font-bold font-cinzel">
                            {slot.time}
                          </div>
                          <div className="text-[10px] text-[#8C7A5B]">
                            hasta {slot.endTime}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PASO 3: TUS DATOS DE CONTACTO */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-bold flex items-center justify-center">
                3
              </div>
              <div>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#2B2B2B]">
                  Completa tus Datos
                </h2>
                <p className="text-xs text-[#737373] font-light">
                  Te enviaremos los recordatorios y la confirmación a tu WhatsApp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Nombre y Apellido *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofia Martínez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#2B2B2B] bg-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Teléfono / WhatsApp *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 3516002716"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#2B2B2B] bg-[#FAF8F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2B2B] mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Observaciones o detalles de diseño (opcional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Tengo una uña partida en la mano derecha, me gustaría un tono vía láctea con francesita."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#2B2B2B] bg-[#FAF8F5]"
              />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN, POLÍTICAS Y CONFIRMAR */}
        <div className="lg:col-span-1 sticky top-20 space-y-4">
          <div className="p-6 rounded-3xl bg-[#2B2B2B] text-[#FFFFFF] border-2 border-[#D4AF37] shadow-xl">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] mb-2">
              Resumen de Reserva
            </div>
            <h3 className="font-cinzel text-xl font-bold text-[#FFFFFF] mb-4">
              ÁGAPE STUDIO
            </h3>

            {/* Servicio principal */}
            <div className="space-y-2 text-xs border-b border-[#444444] pb-4 mb-4">
              <div className="flex justify-between font-medium">
                <span>{selectedService.nombre}</span>
                <span>{formatPrice(selectedService.precio)}</span>
              </div>
              <div className="text-[11px] text-[#A3A3A3]">
                Tiempo base: {selectedService.duracion} min
              </div>

              {selectedExtras.map((extra) => (
                <div key={extra.id} className="flex justify-between text-[#DCC5A3] text-xs pt-1">
                  <span>+ {extra.nombre}</span>
                  <span>+{formatPrice(extra.precio)}</span>
                </div>
              ))}
            </div>

            {/* Fecha y horario seleccionado */}
            <div className="space-y-2 text-xs border-b border-[#444444] pb-4 mb-4">
              <div className="flex items-center gap-2 text-[#A3A3A3]">
                <CalendarIcon className="w-4 h-4 text-[#D4AF37]" />
                <span>
                  {selectedDate
                    ? format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })
                    : "Fecha no seleccionada"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#A3A3A3]">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span>
                  {selectedSlot
                    ? `${selectedSlot.time} hs a ${selectedSlot.endTime} hs (${totalDuration} min)`
                    : "Horario no seleccionado"}
                </span>
              </div>
            </div>

            {/* Totales */}
            <div className="flex items-center justify-between mb-5">
              <span className="font-cinzel text-sm text-[#DCC5A3]">Total a Abonar:</span>
              <span className="font-cinzel text-2xl font-bold text-[#D4AF37]">
                {formatPrice(totalPrice)}
              </span>
            </div>

            {/* Políticas de seña y cancelación */}
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#444444] text-[11px] text-[#A3A3A3] space-y-1.5 mb-5 leading-snug">
              <div className="flex items-start gap-1.5 text-[#FFFFFF] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Políticas de Turno & Asistencia</span>
              </div>
              <p>• Tolerancia máxima de espera: 15 minutos.</p>
              <p>• Cancelaciones o reprogramaciones con al menos 24 hs de anticipación.</p>
              <p>• Asistir con las uñas limpias sin aceites ni cremas en las manos.</p>
            </div>

            {/* Error si existe */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botón de confirmar */}
            <button
              type="submit"
              disabled={submitting || !selectedDate || !selectedSlot}
              className="w-full py-4 px-4 rounded-full bg-[#D4AF37] text-[#2B2B2B] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer group"
            >
              {submitting ? (
                <span>Confirmando tu turno...</span>
              ) : (
                <>
                  <span>Confirmar mi Turno</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function BookPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-sm text-[#737373]">Cargando reserva de ÁGAPE STUDIO...</div>}>
        <BookContent />
      </Suspense>
      <Footer />
    </div>
  );
}
