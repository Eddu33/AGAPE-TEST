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
  Calendar as CalendarIcon,
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
  LogOut,
  CalendarDays,
  DollarSign,
  Filter,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  CreditCard,
  AlertCircle,
  Share2,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
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

  // Modo de vista: 'week' (semanal como vista principal) o 'day' (diaria detallada)
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());

  // Filtros vista diaria
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(() => {
    return formatDateKey(new Date());
  });
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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
    await updateAppointmentStatus(id, status);
    loadDashboardData();
  };

  const handlePaymentStatusChange = async (id: string, paymentStatus: StoredAppointment["paymentStatus"]) => {
    await updateAppointmentPaymentStatus(id, paymentStatus);
    loadDashboardData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás segura de eliminar este turno de la base de datos?")) {
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

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    router.push("/admin/login");
  };

  // Cálculo de los días de la semana actual
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeekDate, { weekStartsOn: 1 }); // Comienza en Lunes
    const end = endOfWeek(currentWeekDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeekDate]);

  // Filtrado de turnos para vista diaria
  const filteredAppointments = appointments.filter((apt) => {
    const matchDate = selectedDateFilter === "ALL" || apt.date === selectedDateFilter;
    const matchStatus = statusFilter === "ALL" || apt.status === statusFilter;
    return matchDate && matchStatus;
  });

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

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Cabecera del Panel */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-[#DCC5A3]/40">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agenda de Turnos & Manicuría</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
              Agenda — ÁGAPE STUDIO
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Selector de Vista: Semana vs Día */}
            <div className="bg-[#FFFFFF] p-1 rounded-full border border-[#DCC5A3] flex items-center shadow-2xs">
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === "week"
                    ? "bg-[#D4AF37] text-[#2B2B2B] shadow-xs"
                    : "text-[#666666] hover:text-[#2B2B2B]"
                }`}
              >
                Vista Semanal
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === "day"
                    ? "bg-[#D4AF37] text-[#2B2B2B] shadow-xs"
                    : "text-[#666666] hover:text-[#2B2B2B]"
                }`}
              >
                Vista Diaria
              </button>
            </div>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Turno</span>
            </button>

            <button
              onClick={() => setIsBlockModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#FFFFFF] text-[#2B2B2B] border border-[#DCC5A3] text-xs font-semibold hover:bg-[#F5F0E6] transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Bloquear Horario</span>
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-full border border-[#DCC5A3] bg-[#FFFFFF] text-[#737373] hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Rápidas */}
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

        {/* VISTA 1: VISTA SEMANAL (PRINCIPAL) */}
        {viewMode === "week" && (
          <div className="space-y-4">
            {/* Barra de navegación de semanas */}
            <div className="flex items-center justify-between bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCC5A3]/40 shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentWeekDate((prev) => subWeeks(prev, 1))}
                  className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE0D5] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
                  title="Semana anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-[#2B2B2B]" />
                </button>
                <button
                  onClick={() => setCurrentWeekDate(new Date())}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE0D5] text-xs font-semibold text-[#2B2B2B] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
                >
                  Esta Semana
                </button>
                <button
                  onClick={() => setCurrentWeekDate((prev) => addWeeks(prev, 1))}
                  className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE0D5] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
                  title="Semana siguiente"
                >
                  <ChevronRight className="w-4 h-4 text-[#2B2B2B]" />
                </button>
              </div>

              <div className="text-sm font-cinzel font-bold text-[#2B2B2B] capitalize">
                Semana del {format(weekDays[0], "d 'de' MMMM", { locale: es })} al{" "}
                {format(weekDays[6], "d 'de' MMMM yyyy", { locale: es })}
              </div>
            </div>

            {/* Cuadrícula de 7 Días */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
              {weekDays.map((day) => {
                const dayKey = formatDateKey(day);
                const isToday = isSameDay(day, new Date());
                const dayApts = appointments
                  .filter((a) => a.date === dayKey)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                const dayBlocks = blockedTimes.filter((b) => b.date === dayKey);

                return (
                  <div
                    key={dayKey}
                    className={`rounded-2xl border p-3 min-h-[380px] flex flex-col bg-[#FFFFFF] transition-all ${
                      isToday
                        ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-sm"
                        : "border-[#DCC5A3]/40 hover:border-[#DCC5A3]"
                    }`}
                  >
                    {/* Header del día */}
                    <div
                      className={`pb-2 mb-2 border-b text-center ${
                        isToday ? "border-[#D4AF37]/40" : "border-[#F5F0E6]"
                      }`}
                    >
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-[#777777] block capitalize">
                        {format(day, "EEEE", { locale: es })}
                      </span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isToday ? "bg-[#D4AF37] text-[#2B2B2B]" : "text-[#2B2B2B]"
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                        <span className="text-[10px] text-[#888888]">
                          ({dayApts.length} {dayApts.length === 1 ? "turno" : "turnos"})
                        </span>
                      </div>
                    </div>

                    {/* Bloqueos del día */}
                    {dayBlocks.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {dayBlocks.map((b) => (
                          <div
                            key={b.id}
                            className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] p-1.5 rounded-lg flex items-center justify-between"
                          >
                            <span>
                              🔒 {b.startTime}-{b.endTime}
                            </span>
                            <button
                              onClick={() => handleRemoveBlock(b.id)}
                              className="text-amber-900 hover:text-red-600"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Turnos del día */}
                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px]">
                      {dayApts.length === 0 ? (
                        <div className="h-28 flex items-center justify-center text-[11px] text-[#AAAAAA] text-center border-dashed border border-[#EAE0D5] rounded-xl p-2">
                          Libre
                        </div>
                      ) : (
                        dayApts.map((apt) => {
                          const badge = getPaymentBadge(apt.paymentStatus);
                          return (
                            <div
                              key={apt.id}
                              onClick={() => openEditModal(apt)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-xs group ${
                                apt.status === "COMPLETED"
                                  ? "bg-emerald-50/50 border-emerald-200"
                                  : apt.status === "CANCELLED"
                                  ? "bg-rose-50/50 border-rose-200 opacity-60 line-through"
                                  : apt.status === "NO_SHOW"
                                  ? "bg-gray-100 border-gray-300 opacity-70"
                                  : "bg-[#FAF8F5] border-[#EAE0D5] hover:border-[#D4AF37]"
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold text-[#2B2B2B]">
                                <span className="text-xs flex items-center gap-1 font-cinzel">
                                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                                  {apt.startTime}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full border ${badge.bg}`}
                                >
                                  {badge.label}
                                </span>
                              </div>

                              <p className="font-semibold text-[#2B2B2B] mt-1 truncate">
                                {apt.clientName}
                              </p>
                              <p className="text-[11px] text-[#777777] truncate">
                                {apt.serviceName}
                              </p>

                              <div className="mt-2 pt-1 border-t border-[#EAE0D5]/60 flex items-center justify-between text-[10px] text-[#888888]">
                                <span className="font-semibold text-[#2B2B2B]">
                                  ${apt.totalPrice?.toLocaleString("es-AR")}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit2 className="w-3 h-3 text-[#D4AF37]" />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA 2: VISTA DIARIA DETALLADA */}
        {viewMode === "day" && (
          <div className="space-y-4">
            {/* Barra de Filtros Diario */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-2xs mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2B2B2B]">
                  <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
                  <span>Día Seleccionado:</span>
                </div>
                <input
                  type="date"
                  value={selectedDateFilter === "ALL" ? "" : selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value || "ALL")}
                  className="px-3 py-1.5 rounded-xl border border-[#DCC5A3]/60 text-xs bg-[#FAF8F5] focus:outline-none"
                />
                <button
                  onClick={() => setSelectedDateFilter(formatDateKey(new Date()))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    selectedDateFilter === formatDateKey(new Date())
                      ? "bg-[#2B2B2B] text-[#FFFFFF]"
                      : "bg-[#F5F0E6] text-[#2B2B2B] hover:bg-[#DCC5A3]/40"
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setSelectedDateFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    selectedDateFilter === "ALL"
                      ? "bg-[#2B2B2B] text-[#FFFFFF]"
                      : "bg-[#F5F0E6] text-[#2B2B2B] hover:bg-[#DCC5A3]/40"
                  }`}
                >
                  Ver Todos
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#737373]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#DCC5A3]/60 text-xs bg-[#FAF8F5] focus:outline-none"
                >
                  <option value="ALL">Todos los Estados</option>
                  <option value="CONFIRMED">Confirmados</option>
                  <option value="COMPLETED">Asistieron</option>
                  <option value="CANCELLED">Cancelados</option>
                  <option value="NO_SHOW">No asistieron</option>
                </select>
              </div>
            </div>

            {/* Lista Diaria de Turnos */}
            {loading ? (
              <div className="p-12 text-center text-xs text-[#737373]">
                <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Cargando turnos...
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#FFFFFF] border border-[#DCC5A3]/40">
                <Clock className="w-8 h-8 text-[#DCC5A3] mx-auto mb-2" />
                <h3 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                  No hay turnos registrados para esta selección
                </h3>
                <p className="text-xs text-[#737373] mt-1 font-light">
                  Puedes cambiar la fecha o agregar un turno manualmente con el botón superior.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => {
                  const clientWaLink = `https://wa.me/${apt.clientPhone.replace(/\D/g, "")}`;
                  const pBadge = getPaymentBadge(apt.paymentStatus);
                  return (
                    <div
                      key={apt.id}
                      className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#DCC5A3]/40 shadow-xs hover:border-[#D4AF37] transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Horario y Estado */}
                        <div className="flex items-start gap-4">
                          <div className="text-center p-3 rounded-2xl bg-[#F5F0E6] border border-[#DCC5A3]/40 min-w-[90px]">
                            <div className="text-sm font-bold font-cinzel text-[#2B2B2B]">
                              {apt.startTime}
                            </div>
                            <div className="text-[10px] text-[#737373]">a {apt.endTime}</div>
                            <div className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold mt-1">
                              {formatDuration(apt.durationMinutes)}
                            </div>
                          </div>

                          {/* Datos de Clienta y Servicio */}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-sm text-[#2B2B2B]">{apt.clientName}</h3>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  apt.status === "CONFIRMED"
                                    ? "bg-amber-100 text-amber-800"
                                    : apt.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : apt.status === "CANCELLED"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {apt.status === "CONFIRMED"
                                  ? "Confirmado"
                                  : apt.status === "COMPLETED"
                                  ? "Asistió"
                                  : apt.status === "CANCELLED"
                                  ? "Cancelado"
                                  : "No asistió"}
                              </span>

                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pBadge.bg}`}
                              >
                                {pBadge.label}
                              </span>
                            </div>

                            <div className="text-xs text-[#8C7A5B] font-medium mt-0.5">
                              {apt.serviceName}
                              {apt.extraNames && apt.extraNames.length > 0 && (
                                <span className="text-[#737373] font-light">
                                  {" "}
                                  + {apt.extraNames.join(", ")}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#737373] mt-2">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                                {apt.date}
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-[#2B2B2B]">
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
                                {apt.clientPhone}
                              </a>
                            </div>

                            {apt.notes && (
                              <p className="text-[11px] text-[#525252] bg-[#FAF8F5] p-2 rounded-xl border border-[#DCC5A3]/30 mt-2 font-light">
                                <strong>Nota:</strong> {apt.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones para la manicurista */}
                        <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => openEditModal(apt)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#DCC5A3] text-[#2B2B2B] text-xs font-medium hover:bg-[#F5F0E6] transition-colors cursor-pointer"
                            title="Reagendar o modificar"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Reagendar</span>
                          </button>

                          {apt.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleStatusChange(apt.id, "COMPLETED")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-700 text-[#FFFFFF] text-xs font-medium hover:bg-emerald-800 transition-colors cursor-pointer"
                              title="Marcar como atendida"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Asistió</span>
                            </button>
                          )}

                          {apt.status !== "NO_SHOW" && apt.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleStatusChange(apt.id, "NO_SHOW")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Marcar que no vino"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>No-show</span>
                            </button>
                          )}

                          <a
                            href={clientWaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-[#25D366] text-[#FFFFFF] hover:bg-[#1EBE5D] transition-colors cursor-pointer"
                            title="Escribir por WhatsApp a la clienta"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL: REAGENDAR O MODIFICAR TURNO */}
        {editAptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#F5F0E6] mb-4">
                <div>
                  <h3 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    Modificar / Reagendar Turno
                  </h3>
                  <p className="text-xs text-[#666666]">{editAptModal.clientName} · {editAptModal.serviceName}</p>
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
                      onChange={(e) => setEditPaymentStatus(e.target.value as StoredAppointment["paymentStatus"])}
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
                  <label className="block font-semibold text-[#2B2B2B] mb-1">Notas / Motivo del cambio</label>
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
                    className="flex-1 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors"
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
                    className="flex-1 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors"
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
