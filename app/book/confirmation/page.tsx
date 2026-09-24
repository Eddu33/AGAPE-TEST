"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAgapeAppointmentById, getStudioSettings } from "../../actions";
import { StoredAppointment } from "@/lib/db";
import { formatPrice, formatDuration } from "@/lib/services";
import {
  CheckCircle,
  Calendar,
  Clock,
  Sparkles,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Home,
  Copy,
  Check,
} from "lucide-react";

import { format } from "date-fns";
import { es } from "date-fns/locale";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [appointment, setAppointment] = useState<StoredAppointment | null>(null);
  const [studioPhone, setStudioPhone] = useState(
    (process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || "").replace(/\D/g, "")
  );
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    getStudioSettings().then((s) => {
      if (s?.whatsappPhone) setStudioPhone(s.whatsappPhone);
    });

    if (id) {
      getAgapeAppointmentById(id)
        .then((data) => {
          if (data) {
            setAppointment(data);
          } else if (typeof window !== "undefined") {
            const cached = sessionStorage.getItem(`agape_apt_${id}`);
            if (cached) {
              try {
                setAppointment(JSON.parse(cached));
              } catch (_) {}
            }
          }
        })
        .catch(() => {
          if (typeof window !== "undefined") {
            const cached = sessionStorage.getItem(`agape_apt_${id}`);
            if (cached) {
              try {
                setAppointment(JSON.parse(cached));
              } catch (_) {}
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#737373]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Buscando los datos de tu turno...
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#FFFFFF] border border-[#DCC5A3]/40 text-center shadow-xs">
        <h2 className="font-cinzel text-xl font-bold text-[#2B2B2B] mb-2">
          No encontramos este turno
        </h2>
        <p className="text-xs text-[#737373] mb-6">
          Es posible que el enlace haya expirado o el identificador no sea válido.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold"
        >
          <Home className="w-4 h-4" />
          Volver al Inicio
        </Link>
      </div>
    );
  }

  // Parsear fecha de forma segura
  let formattedDate = appointment.date;
  try {
    const parts = (appointment.date || "").split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const aptDate = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(aptDate.getTime())) {
        formattedDate = format(aptDate, "dd/MM/yyyy", { locale: es });
      }
    }
  } catch (err) {
    console.warn("No se pudo formatear la fecha:", err);
  }

  // Mensaje formal y elegante para WhatsApp (sin emojis complejos que se corrompan en la URL)
  const extrasText =
    appointment.extraNames && appointment.extraNames.length > 0
      ? ` (Extras: ${appointment.extraNames.join(", ")})`
      : "";

  const cleanPhone = (
    studioPhone ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER ||
    ""
  ).replace(/\D/g, "");


  const rawMessage = [
    `Hola Ágape Studio, deseo confirmar mi reserva:`,
    ``,
    `- Clienta: ${appointment.clientName}`,
    `- Servicio: ${appointment.serviceName}${extrasText}`,
    `- Fecha: ${formattedDate}`,
    `- Horario: ${appointment.startTime} hs a ${appointment.endTime} hs`,
    `- Total: ${formatPrice(appointment.totalPrice)}`,
    ``,
    `Quedo a la espera de su confirmación. ¡Muchas gracias!`,
  ].join("\n");

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMessage)}`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(rawMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#141414]/95 border-2 border-[#D4AF37] shadow-2xl backdrop-blur-md text-[#171717] dark:text-white transition-colors duration-200">
      {/* Icono de éxito */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#FAF8F5] dark:bg-[#1A1A1A] border-2 border-[#D4AF37] flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Sparkles className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#B38E22] dark:text-[#D4AF37]">
          ¡Turno Agendado con Éxito!
        </span>
        <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#171717] dark:text-[#FFFFFF] mt-1">
          Te Esperamos en ÁGAPE STUDIO
        </h1>
        <p className="font-cinzel text-xs text-[#B38E22] dark:text-[#D4AF37] italic mt-1">
          “La belleza nace del amor perfecto”
        </p>
      </div>

      {/* Tarjeta con los datos del turno */}
      <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1A1A]/90 border border-[#E2DBD0] dark:border-white/10 space-y-4 mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DBD0] dark:border-white/10">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#737373] dark:text-[#A3A3A3]">Clienta</span>
            <div className="text-sm font-bold text-[#171717] dark:text-[#FFFFFF]">{appointment.clientName}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#737373] dark:text-[#A3A3A3]">Estado</span>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#B38E22] dark:text-[#D4AF37] text-xs font-semibold border border-[#D4AF37]/40">
              <CheckCircle className="w-3 h-3 text-[#B38E22] dark:text-[#D4AF37]" />
              <span>Confirmado</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-[#737373] dark:text-[#A3A3A3]">Servicio Elegido</span>
          <div className="font-cinzel text-base font-bold text-[#171717] dark:text-[#FFFFFF]">
            {appointment.serviceName}
          </div>
          {appointment.extraNames && appointment.extraNames.length > 0 && (
            <div className="text-xs text-[#B38E22] dark:text-[#D4AF37] mt-1">
              Extras: {appointment.extraNames.join(", ")}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2DBD0] dark:border-white/10">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#737373] dark:text-[#A3A3A3] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#B38E22] dark:text-[#D4AF37]" /> Fecha
            </span>
            <div className="text-xs font-semibold text-[#171717] dark:text-[#FFFFFF] capitalize mt-0.5">
              {formattedDate}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#737373] dark:text-[#A3A3A3] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#B38E22] dark:text-[#D4AF37]" /> Horario
            </span>
            <div className="text-xs font-semibold text-[#171717] dark:text-[#FFFFFF] mt-0.5">
              {appointment.startTime} hs ({appointment.durationMinutes} min)
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E2DBD0] dark:border-white/10 flex items-center justify-between">
          <span className="font-cinzel text-xs text-[#737373] dark:text-[#A3A3A3]">Total a Abonar en el Salón:</span>
          <span className="font-cinzel text-lg font-bold text-[#B38E22] dark:text-[#D4AF37]">
            {formatPrice(appointment.totalPrice)}
          </span>
        </div>
      </div>

      {/* Bloque Mensaje para WhatsApp */}
      <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#121212] border border-[#E2DBD0] dark:border-[#2E2E2E] mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#171717] dark:text-[#E0E0E0] flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            Notificación para enviar al Estudio:
          </span>
          <button
            type="button"
            onClick={handleCopyMessage}
            className="text-[11px] text-[#B38E22] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <pre className="text-xs text-[#333333] dark:text-[#B0B0B0] font-sans whitespace-pre-wrap leading-relaxed bg-[#FFFFFF] dark:bg-[#1A1A1A] p-3 rounded-xl border border-[#E2DBD0] dark:border-white/10 select-all">
          {rawMessage}
        </pre>
      </div>

      {/* Botones de acción */}
      <div className="space-y-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-full bg-[#25D366] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#1EBE5D] transition-all shadow-lg cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Enviar Confirmación por WhatsApp</span>
        </a>

        <Link
          href="/"
          className="w-full py-3 px-4 rounded-full bg-[#FAF8F5] hover:bg-[#FFFFFF] text-[#171717] border border-[#E2DBD0] hover:border-[#D4AF37] dark:bg-[#181818] dark:text-[#FFFFFF] dark:border-[#333333] dark:hover:border-[#D4AF37] dark:hover:bg-[#222222] font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Home className="w-4 h-4 text-[#B38E22] dark:text-[#D4AF37]" />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6">
        <Suspense
          fallback={
            <div className="p-12 text-center text-sm text-[#A3A3A3]">
              Cargando confirmación...
            </div>
          }
        >
          <ConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
