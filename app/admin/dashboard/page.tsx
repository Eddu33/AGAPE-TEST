"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import Footer from "@/components/Footer";
import {
  getAdminAppointments,
  getAdminBlockedTimes,
  getAdminStats,
  updateAppointmentStatus,
  updateAppointmentPaymentStatus,
  rescheduleAppointment,
  deleteAppointment,
  createManualAppointment,
  addScheduleBlock,
  removeScheduleBlock,
  DashboardStats,
} from "../actions";
import { StoredAppointment } from "@/lib/db";
import { BlockedTime, formatDateKey } from "@/lib/availability";
import {
  SERVICIOS_AGAPE,
  EXTRAS_AGAPE,
  formatPrice,
  formatDuration,
} from "@/lib/services";
import {
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  UserX,
  Plus,
  Lock,
  Trash2,
  Phone,
  MessageCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Calendar as CalendarIcon,
  X,
  Share2,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

export default function AdminDashboardPage() {

  const router = useRouter();

  // Estados de datos
  const [appointments, setAppointments] = useState<StoredAppointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Estado del Almanaque Mensual
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Modales
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editAptModal, setEditAptModal] = useState<StoredAppointment | null>(null);

  // Formulario de edición/reagendado
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editStatus, setEditStatus] = useState<StoredAppointment["status"]>("CONFIRMED");
  const [editPaymentStatus, setEditPaymentStatus] = useState<StoredAppointment["paymentStatus"]>("PENDING");
  const [editNotes, setEditNotes] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Formulario manual
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualServiceId, setManualServiceId] = useState(SERVICIOS_AGAPE[0]?.id || "kapping-gel");
  const [manualExtraIds, setManualExtraIds] = useState<string[]>([]);
  const [manualDate, setManualDate] = useState(formatDateKey(new Date()));
  const [manualTime, setManualTime] = useState("10:00");
  const [manualNotes, setManualNotes] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  // Formulario de bloqueo
  const [blockDate, setBlockDate] = useState(formatDateKey(new Date()));
  const [blockStart, setBlockStart] = useState("14:00");
  const [blockEnd, setBlockEnd] = useState("16:00");
  const [blockReason, setBlockReason] = useState("Personal / Médico");
  const [submittingBlock, setSubmittingBlock] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [apts, blocks, st] = await Promise.all([
        getAdminAppointments(),
        getAdminBlockedTimes(),
        getAdminStats(),
      ]);
      setAppointments(apts);
      setBlockedTimes(blocks);
      setStats(st);
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: StoredAppointment["status"]) => {
    // Actualización optimista inmediata
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    await updateAppointmentStatus(id, status);
    loadDashboardData();
  };

  const handlePaymentStatusChange = async (
    id: string,
    paymentStatus: StoredAppointment["paymentStatus"]
  ) => {
    // Actualización optimista inmediata
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, paymentStatus } : a))
    );
    await updateAppointmentPaymentStatus(id, paymentStatus);
    loadDashboardData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás segura de eliminar este turno permanentemente?")) {
      await deleteAppointment(id);
      loadDashboardData();
    }
  };

  const openEditModal = (apt: StoredAppointment) => {
    setEditAptModal(apt);
    setEditDate(apt.date);
    setEditTime(apt.startTime);
    setEditStatus(apt.status);
    setEditPaymentStatus(apt.paymentStatus || "PENDING");
    setEditNotes(apt.notes || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAptModal) return;
    setSubmittingEdit(true);
    try {
      await rescheduleAppointment(editAptModal.id, {
        date: editDate,
        startTime: editTime,
        status: editStatus,
        paymentStatus: editPaymentStatus,
        notes: editNotes,
      });
      setEditAptModal(null);
      loadDashboardData();
    } catch (err) {
      alert("Error al reagendar turno.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingManual(true);
    try {
      await createManualAppointment({
        clientName: manualName,
        clientPhone: manualPhone,
        serviceId: manualServiceId,
        extraIds: manualExtraIds,
        date: manualDate,
        startTime: manualTime,
        notes: manualNotes,
      });
      setIsManualModalOpen(false);
      setManualName("");
      setManualPhone("");
      setManualNotes("");
      loadDashboardData();
    } catch (err) {
      alert("Error al agendar turno manual.");
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBlock(true);
    try {
      await addScheduleBlock({
        date: blockDate,
        startTime: blockStart,
        endTime: blockEnd,
        reason: blockReason,
      });
      setIsBlockModalOpen(false);
      loadDashboardData();
    } catch (err) {
      alert("Error al guardar bloqueo de horario.");
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleRemoveBlock = async (id: string) => {
    await removeScheduleBlock(id);
    loadDashboardData();
  };

  // Cálculo de los días del Almanaque Mensual
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonthDate);
    const monthEnd = endOfMonth(currentMonthDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 }); // Domingo
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonthDate]);

  // Turnos del día seleccionado
  const selectedDayKey = formatDateKey(selectedDay);
  const selectedDayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDayKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDayKey]);

  const selectedDayBlocks = useMemo(() => {
    return blockedTimes.filter((b) => b.date === selectedDayKey);
  }, [blockedTimes, selectedDayKey]);

  const confirmedCountForSelectedDay = selectedDayAppointments.filter(
    (a) => a.status === "CONFIRMED"
  ).length;

  const getPaymentBadge = (status?: StoredAppointment["paymentStatus"]) => {
    switch (status) {
      case "PAID":
        return { label: "Pagado Total", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "DEPOSIT_PAID":
        return { label: "Seña Recibida", bg: "bg-blue-100 text-blue-800 border-blue-300" };
      case "DEPOSIT_REQUESTED":
        return { label: "Seña Solicitada", bg: "bg-amber-100 text-amber-800 border-amber-300" };
      case "AWAITING_VERIFICATION":
        return { label: "Verificar Comp.", bg: "bg-purple-100 text-purple-800 border-purple-300" };
      default:
        return { label: "Sin Seña", bg: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  const sendWhatsAppReschedule = (apt: StoredAppointment) => {
    const msg = encodeURIComponent(
      `Hola ${apt.clientName}! ✨ Te escribo desde Ágape Studio para confirmarte que tu turno para ${apt.serviceName} fue reprogramado para el día ${editDate} a las ${editTime} hs. Por favor confirmame si te queda perfecto. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${apt.clientPhone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  const openManualBookingForDate = (dateKey: string) => {
    setManualDate(dateKey);
    setIsManualModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Cabecera del Panel */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCC5A3]/40">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agenda & Turnos</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
              Almanaque Mensual — ÁGAPE STUDIO
            </h1>
            <p className="text-xs text-[#666666] mt-1 font-montserrat">
              Visualiza el mes completo y haz clic en cualquier día para gestionar sus turnos y estados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setManualDate(formatDateKey(selectedDay));
                setIsManualModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Turno Manual</span>
            </button>

            <button
              onClick={() => {
                setBlockDate(formatDateKey(selectedDay));
                setIsBlockModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FFFFFF] text-[#2B2B2B] border border-[#DCC5A3] text-xs font-semibold hover:bg-[#F5F0E6] transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Bloquear Horario</span>
            </button>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-[#737373]">Total Turnos</span>
            <div className="font-cinzel text-2xl font-bold text-[#2B2B2B] mt-1">{stats.total}</div>
            <span className="text-[11px] text-[#8C7A5B]">En historial</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-[#737373]">Confirmados</span>
            <div className="font-cinzel text-2xl font-bold text-[#D4AF37] mt-1">{stats.confirmed}</div>
            <span className="text-[11px] text-emerald-700">Por atender</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-[#737373]">Asistieron</span>
            <div className="font-cinzel text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</div>
            <span className="text-[11px] text-[#737373]">Completados</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-[#737373]">Facturación</span>
            <div className="font-cinzel text-2xl font-bold text-[#2B2B2B] mt-1">
              {formatPrice(stats.totalRevenue)}
            </div>
            <span className="text-[11px] text-[#8C7A5B]">Cobrado total</span>
          </div>
        </div>

        {/* SECCIÓN PRINCIPAL: ALMANAQUE MENSUAL COMPLETO */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#DCC5A3]/50 shadow-md p-5 sm:p-7 space-y-6">
          {/* Navegación del Mes */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#F5F0E6]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentMonthDate((prev) => subMonths(prev, 1))}
                className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE0D5] hover:bg-[#F5F0E6] text-[#2B2B2B] transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#2B2B2B] capitalize tracking-wide min-w-[200px] text-center sm:text-left">
                {format(currentMonthDate, "MMMM yyyy", { locale: es })}
              </h2>

              <button
                onClick={() => setCurrentMonthDate((prev) => addMonths(prev, 1))}
                className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE0D5] hover:bg-[#F5F0E6] text-[#2B2B2B] transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  setCurrentMonthDate(today);
                  setSelectedDay(today);
                }}
                className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#DCC5A3] text-xs font-bold text-[#2B2B2B] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
              >
                Ir al Día de Hoy
              </button>
            </div>
          </div>

          {/* Cuadrícula del Almanaque */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Encabezados de los 7 días de la semana */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center font-cinzel text-xs font-bold uppercase tracking-wider text-[#8C7A5B]">
                <div className="py-2">Lunes</div>
                <div className="py-2">Martes</div>
                <div className="py-2">Miércoles</div>
                <div className="py-2">Jueves</div>
                <div className="py-2">Viernes</div>
                <div className="py-2">Sábado</div>
                <div className="py-2">Domingo</div>
              </div>

              {/* Días del Mes en Grilla */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const dayKey = formatDateKey(day);
                  const isCurrentMonth = isSameMonth(day, currentMonthDate);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDay);

                  // Turnos de este día
                  const dayApts = appointments.filter((a) => a.date === dayKey);
                  const dayConfirmed = dayApts.filter((a) => a.status === "CONFIRMED").length;
                  const dayCompleted = dayApts.filter((a) => a.status === "COMPLETED").length;
                  const dayBlocks = blockedTimes.filter((b) => b.date === dayKey);

                  return (
                    <div
                      key={dayKey}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[105px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? "border-[#D4AF37] ring-3 ring-[#D4AF37]/30 bg-[#FAF8F5] shadow-md scale-[1.02]"
                          : isToday
                          ? "border-[#D4AF37]/60 bg-[#FFFFFF] shadow-xs"
                          : isCurrentMonth
                          ? "border-[#EAE0D5] bg-[#FFFFFF] hover:border-[#DCC5A3] hover:bg-[#FAF8F5]/60"
                          : "border-[#F0EBE4] bg-[#FDFCFB] opacity-40"
                      }`}
                    >
                      {/* Número de Día y Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            isSelected
                              ? "bg-[#D4AF37] text-[#2B2B2B] shadow-xs"
                              : isToday
                              ? "bg-[#2B2B2B] text-[#FFFFFF]"
                              : isCurrentMonth
                              ? "text-[#2B2B2B]"
                              : "text-[#AAAAAA]"
                          }`}
                        >
                          {format(day, "d")}
                        </span>

                        {dayBlocks.length > 0 && (
                          <span className="text-[10px]" title="Tiene horarios bloqueados">
                            🔒
                          </span>
                        )}
                      </div>

                      {/* Resumen de turnos en la celda */}
                      <div className="mt-1 space-y-1">
                        {dayApts.length > 0 ? (
                          <div className="space-y-0.5">
                            {dayConfirmed > 0 && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 w-full truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>{dayConfirmed} conf.</span>
                              </div>
                            )}

                            {dayCompleted > 0 && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 w-full truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{dayCompleted} asist.</span>
                              </div>
                            )}

                            {dayConfirmed === 0 && dayCompleted === 0 && (
                              <div className="text-[10px] font-semibold text-[#888888] px-1 truncate">
                                {dayApts.length} {dayApts.length === 1 ? "turno" : "turnos"}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#CCCCCC] italic block text-center">
                            Libre
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* DETALLE Y GESTIÓN DEL DÍA SELECCIONADO */}
        <div className="mt-8 bg-[#FFFFFF] rounded-3xl border border-[#DCC5A3] shadow-lg p-6 sm:p-8 space-y-6">
          {/* Encabezado del Día Seleccionado */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F0E6]">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#D4AF37]">
                <CalendarIcon className="w-4 h-4" />
                <span>Día Seleccionado</span>
              </div>
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#2B2B2B] capitalize">
                {format(selectedDay, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </h3>
              <p className="text-xs text-[#666666] mt-0.5 font-montserrat">
                {selectedDayAppointments.length === 0
                  ? "No hay turnos agendados para este día."
                  : `${selectedDayAppointments.length} ${
                      selectedDayAppointments.length === 1 ? "turno reservado" : "turnos reservados"
                    } (${confirmedCountForSelectedDay} confirmados)`}
              </p>
            </div>

            <button
              onClick={() => openManualBookingForDate(selectedDayKey)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF8F5] border border-[#DCC5A3] text-xs font-semibold text-[#2B2B2B] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Agendar Turno para esta fecha</span>
            </button>
          </div>

          {/* Bloqueos en este día */}
          {selectedDayBlocks.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-xs font-bold text-amber-900 block mb-2">
                🔒 Franjas Horarias Bloqueadas:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedDayBlocks.map((b) => (
                  <div
                    key={b.id}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-amber-300 text-xs text-amber-900"
                  >
                    <span>
                      {b.startTime} a {b.endTime} hs — {b.reason}
                    </span>
                    <button
                      onClick={() => handleRemoveBlock(b.id)}
                      className="hover:text-red-600 font-bold"
                      title="Eliminar bloqueo"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Turnos del Día */}
          {selectedDayAppointments.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-[#EAE0D5] rounded-3xl bg-[#FAF8F5]">
              <Clock className="w-10 h-10 text-[#DCC5A3] mx-auto mb-2 opacity-60" />
              <h4 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                Sin turnos en esta fecha
              </h4>
              <p className="text-xs text-[#777777] mt-1 max-w-sm mx-auto">
                No hay citas agendadas por clientas para el{" "}
                {format(selectedDay, "d 'de' MMMM", { locale: es })}.
              </p>
              <button
                onClick={() => openManualBookingForDate(selectedDayKey)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Turno Manual</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDayAppointments.map((apt) => {
                const clientWaLink = `https://wa.me/${apt.clientPhone.replace(/\D/g, "")}`;
                const pBadge = getPaymentBadge(apt.paymentStatus);

                return (
                  <div
                    key={apt.id}
                    className={`p-5 rounded-3xl border transition-all ${
                      apt.status === "CONFIRMED"
                        ? "bg-[#FFFFFF] border-[#D4AF37] shadow-sm"
                        : apt.status === "COMPLETED"
                        ? "bg-emerald-50/40 border-emerald-300"
                        : apt.status === "CANCELLED"
                        ? "bg-rose-50/40 border-rose-200 opacity-60 line-through"
                        : "bg-slate-50 border-slate-200 opacity-70"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* Horario y Clienta */}
                      <div className="flex items-start gap-4">
                        <div className="text-center p-3 rounded-2xl bg-[#F5F0E6] border border-[#DCC5A3]/40 min-w-[95px] shrink-0">
                          <div className="text-base font-cinzel font-bold text-[#2B2B2B]">
                            {apt.startTime}
                          </div>
                          <div className="text-[10px] text-[#777777]">a {apt.endTime} hs</div>
                          <div className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold mt-1">
                            {formatDuration(apt.durationMinutes)}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-base text-[#2B2B2B]">{apt.clientName}</h4>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pBadge.bg}`}
                            >
                              {pBadge.label}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-[#8C7A5B]">
                            {apt.serviceName}
                            {apt.extraNames && apt.extraNames.length > 0 && (
                              <span className="text-[#666666] font-normal">
                                {" "}
                                + {apt.extraNames.join(", ")}
                              </span>
                            )}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] pt-1">
                            <span className="font-bold text-[#2B2B2B] flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                              {formatPrice(apt.totalPrice)}
                            </span>

                            <a
                              href={clientWaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#25D366] hover:underline font-medium"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{apt.clientPhone}</span>
                            </a>
                          </div>

                          {apt.notes && (
                            <p className="text-[11px] text-[#555555] bg-[#FAF8F5] p-2 rounded-xl border border-[#EAE0D5] mt-1">
                              <strong>Nota:</strong> {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ASIGNACIÓN DE ESTADO Y ACCIONES RÁPIDAS */}
                      <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#F5F0E6]">
                        {/* Selector directo de Estado del Turno */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
                            Estado del Turno:
                          </label>
                          <select
                            value={apt.status}
                            onChange={(e) =>
                              handleStatusChange(
                                apt.id,
                                e.target.value as StoredAppointment["status"]
                              )
                            }
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#DCC5A3] bg-[#FAF8F5] text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          >
                            <option value="CONFIRMED">🟡 Confirmado</option>
                            <option value="COMPLETED">🟢 Asistió</option>
                            <option value="NO_SHOW">⚪ No asistió</option>
                            <option value="CANCELLED">🔴 Cancelado</option>
                          </select>
                        </div>

                        {/* Selector directo de Estado del Pago */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
                            Estado de Seña/Pago:
                          </label>
                          <select
                            value={apt.paymentStatus || "PENDING"}
                            onChange={(e) =>
                              handlePaymentStatusChange(
                                apt.id,
                                e.target.value as StoredAppointment["paymentStatus"]
                              )
                            }
                            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-[#DCC5A3] bg-[#FAF8F5] text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                          >
                            <option value="PENDING">Sin Seña</option>
                            <option value="DEPOSIT_REQUESTED">Seña Solicitada</option>
                            <option value="DEPOSIT_PAID">Seña Recibida</option>
                            <option value="PAID">Pagado Total</option>
                            <option value="AWAITING_VERIFICATION">A Verificar Comp.</option>
                          </select>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-1.5 self-end">
                          <button
                            onClick={() => openEditModal(apt)}
                            className="p-2 rounded-xl bg-[#FAF8F5] border border-[#DCC5A3] text-[#2B2B2B] hover:bg-[#F5F0E6] transition-colors"
                            title="Reagendar horario o editar notas"
                          >
                            <Edit2 className="w-4 h-4 text-[#D4AF37]" />
                          </button>

                          <a
                            href={clientWaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-[#25D366] text-[#FFFFFF] hover:bg-[#1EBE5D] transition-colors"
                            title="Escribir por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: REAGENDAR O MODIFICAR TURNO */}
        {editAptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#F5F0E6] mb-4">
                <div>
                  <h3 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    Modificar / Reagendar Turno
                  </h3>
                  <p className="text-xs text-[#666666]">
                    {editAptModal.clientName} · {editAptModal.serviceName}
                  </p>
                </div>
                <button
                  onClick={() => setEditAptModal(null)}
                  className="p-1 rounded-full text-[#737373] hover:text-[#2B2B2B]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Nueva Fecha</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Nueva Hora</label>
                    <input
                      type="time"
                      required
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Estado del Turno</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as StoredAppointment["status"])}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    >
                      <option value="CONFIRMED">Confirmado</option>
                      <option value="COMPLETED">Asistió</option>
                      <option value="CANCELLED">Cancelado</option>
                      <option value="NO_SHOW">No asistió</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Estado de Pago / Seña</label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) =>
                        setEditPaymentStatus(e.target.value as StoredAppointment["paymentStatus"])
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    >
                      <option value="PENDING">Sin Seña</option>
                      <option value="DEPOSIT_REQUESTED">Seña Solicitada</option>
                      <option value="DEPOSIT_PAID">Seña Recibida</option>
                      <option value="PAID">Pagado Total</option>
                      <option value="AWAITING_VERIFICATION">A Verificar Comprobante</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Notas / Motivo del cambio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Clienta solicitó cambio por horario laboral"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => sendWhatsAppReschedule(editAptModal)}
                    className="inline-flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-semibold"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Avisar a clienta por WhatsApp</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#F5F0E6]">
                  <button
                    type="button"
                    onClick={() => setEditAptModal(null)}
                    className="flex-1 py-2.5 rounded-full border border-[#DCC5A3] bg-[#FAF8F5] font-semibold text-[#2B2B2B]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="flex-1 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors cursor-pointer"
                  >
                    {submittingEdit ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PARA AGENDAR TURNO MANUAL */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#F5F0E6] mb-4">
                <h3 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                  Nuevo Turno Manual
                </h3>
                <button
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1 rounded-full text-[#737373] hover:text-[#2B2B2B]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Nombre Clienta *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Laura Pérez"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      WhatsApp / Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 3512345678"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Servicio Principal *
                  </label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                  >
                    {SERVICIOS_AGAPE.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} — {formatDuration(s.duracion)} ({formatPrice(s.precio)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Extras (opcional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EXTRAS_AGAPE.map((ex) => {
                      const isChecked = manualExtraIds.includes(ex.id);
                      return (
                        <div
                          key={ex.id}
                          onClick={() => {
                            setManualExtraIds((prev) =>
                              prev.includes(ex.id)
                                ? prev.filter((id) => id !== ex.id)
                                : [...prev, ex.id]
                            );
                          }}
                          className={`p-2 rounded-xl border cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? "bg-[#F5F0E6] border-[#D4AF37] font-semibold"
                              : "bg-[#FFFFFF] border-slate-200"
                          }`}
                        >
                          <span>{ex.nombre}</span>
                          <span className="text-[10px] text-[#737373]">
                            +{formatPrice(ex.precio)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Fecha *</label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Hora de Inicio *
                    </label>
                    <input
                      type="time"
                      required
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Notas u observaciones
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pagó seña por transferencia"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="flex-1 py-2.5 rounded-full border border-[#DCC5A3] bg-[#FAF8F5] font-semibold text-[#2B2B2B]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingManual}
                    className="flex-1 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors cursor-pointer"
                  >
                    {submittingManual ? "Agendando..." : "Guardar Turno"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PARA BLOQUEAR HORARIO */}
        {isBlockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#F5F0E6] mb-4">
                <h3 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                  Bloquear Franja Horaria
                </h3>
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="p-1 rounded-full text-[#737373] hover:text-[#2B2B2B]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Desde</label>
                    <input
                      type="time"
                      required
                      value={blockStart}
                      onChange={(e) => setBlockStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Hasta</label>
                    <input
                      type="time"
                      required
                      value={blockEnd}
                      onChange={(e) => setBlockEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Motivo del Bloqueo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Turno médico / Trámite personal"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsBlockModalOpen(false)}
                    className="flex-1 py-2.5 rounded-full border border-[#DCC5A3] bg-[#FAF8F5] font-semibold text-[#2B2B2B]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBlock}
                    className="flex-1 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors cursor-pointer"
                  >
                    {submittingBlock ? "Guardando..." : "Bloquear Horario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
