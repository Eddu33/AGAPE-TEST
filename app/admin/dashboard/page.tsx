"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/AdminNavbar";
import Footer from "@/components/Footer";
import {
  getAdminAppointments,
  getAdminBlockedTimes,
  updateAppointmentStatus,
  updateAppointmentPaymentStatus,
  rescheduleAppointment,
  deleteAppointment,
  createManualAppointment,
  addScheduleBlock,
  removeScheduleBlock,
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
  RefreshCw,
  Search,
  List,
  CalendarCheck,
  CalendarDays,
  RotateCcw,
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
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Modo de vista: 'calendar' (Almanaque mensual) o 'all' (Listado completo de base de datos)
  const [viewMode, setViewMode] = useState<"calendar" | "all">("calendar");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
  const [editPrice, setEditPrice] = useState<number | string>("");
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

  // ==========================================
  // MÉTRICAS EN TIEMPO REAL VINCULADAS A LA BASE DE DATOS Y MODIFICACIONES
  // ==========================================
  const liveStats = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;
    const noShow = appointments.filter((a) => a.status === "NO_SHOW").length;

    // Cobrado total: turnos completados o con pago confirmado
    const getCollectedLive = (a: StoredAppointment) => {
      if (a.status === "CANCELLED") return 0;
      if (
        a.paymentStatus === "PENDING" ||
        a.paymentStatus === "DEPOSIT_REQUESTED" ||
        a.paymentStatus === "AWAITING_VERIFICATION"
      ) {
        return 0;
      }
      const price = Number(a.totalPrice) || 0;
      if (a.paymentStatus === "PAID" || (!a.paymentStatus && a.status === "COMPLETED")) {
        return price;
      }
      if (a.paymentStatus === "DEPOSIT_PAID") {
        return Math.round(price * 0.5);
      }
      return 0;
    };

    const totalRevenue = appointments.reduce((sum, a) => sum + getCollectedLive(a), 0);

    // Facturación pendiente en turnos no cancelados ni pagados al 100%
    const pendingRevenue = appointments
      .filter((a) => a.status !== "CANCELLED" && a.paymentStatus !== "PAID")
      .reduce((sum, a) => {
        const p = Number(a.totalPrice) || 0;
        if (a.paymentStatus === "DEPOSIT_PAID") return sum + Math.round(p * 0.5);
        return sum + p;
      }, 0);

    return {
      total,
      confirmed,
      completed,
      cancelled,
      noShow,
      totalRevenue,
      pendingRevenue,
    };
  }, [appointments]);

  // Cargar datos de la base de datos
  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const [apts, blocks] = await Promise.all([
        getAdminAppointments(),
        getAdminBlockedTimes(),
      ]);
      setAppointments(apts);
      setBlockedTimes(blocks);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Error al sincronizar datos del dashboard con la base de datos:", err);
    } finally {
      if (!silent) setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    loadDashboardData(false);

    // Polling periódico cada 8 segundos para detectar nuevos turnos desde la web
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 8000);

    // Sincronización instantánea al volver a la pestaña
    const handleFocus = () => loadDashboardData(true);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handleFocus();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  // ==========================================
  // ACCIONES ADMINISTRATIVAS CON ACTUALIZACIÓN EN TIEMPO REAL
  // ==========================================

  // 1. Cambio de Estado del Turno (Confirmado, Asistió, Cancelado, No asistió)
  const handleStatusChange = async (id: string, status: StoredAppointment["status"]) => {
    // Actualización optimista inmediata en 0ms para refrescar las 4 tarjetas de métricas al instante
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a))
    );
    try {
      await updateAppointmentStatus(id, status);
    } catch (err) {
      console.error("Error al persistir estado en BD:", err);
    }
  };

  // 2. Cambio de Estado de Pago / Seña
  const handlePaymentStatusChange = async (
    id: string,
    paymentStatus: StoredAppointment["paymentStatus"]
  ) => {
    const targetApt = appointments.find((a) => a.id === id);
    const nextStatus = paymentStatus === "PENDING" && targetApt?.status === "COMPLETED" ? "CONFIRMED" : undefined;

    // Actualización optimista inmediata
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              paymentStatus,
              status: nextStatus || a.status,
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );
    try {
      await updateAppointmentPaymentStatus(id, paymentStatus);
      if (nextStatus) {
        await updateAppointmentStatus(id, nextStatus);
      }
    } catch (err) {
      console.error("Error al persistir pago en BD:", err);
    }
  };

  // 2b. Borrar / Anular Pago (si no se realizó correctamente o fue un error)
  const handleResetPayment = async (apt: StoredAppointment) => {
    if (
      !confirm(
        `¿Deseas BORRAR / ANULAR el cobro del turno de "${apt.clientName}"?\n\nEl pago volverá a $0 (Sin Seña / Pendiente) y se restará automáticamente de la facturación.`
      )
    ) {
      return;
    }
    const nextStatus = apt.status === "COMPLETED" ? "CONFIRMED" : apt.status;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apt.id
          ? {
              ...a,
              paymentStatus: "PENDING",
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );
    try {
      await updateAppointmentPaymentStatus(apt.id, "PENDING");
      if (apt.status === "COMPLETED") {
        await updateAppointmentStatus(apt.id, "CONFIRMED");
      }
    } catch (err) {
      console.error("Error al anular cobro en BD:", err);
    }
  };

  // 3. Eliminar Turno permanentemente
  const handleDelete = async (id: string) => {
    if (confirm("¿Estás segura de eliminar este turno permanentemente de la base de datos?")) {
      // Actualización optimista inmediata
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      try {
        await deleteAppointment(id);
      } catch (err) {
        console.error("Error al eliminar turno en BD:", err);
      }
    }
  };

  // 4. Abrir Modal de Edición
  const openEditModal = (apt: StoredAppointment) => {
    setEditAptModal(apt);
    const cleanDate = apt.date && apt.date.includes("T") ? apt.date.split("T")[0] : apt.date;
    setEditDate(cleanDate);
    setEditTime(apt.startTime);
    setEditStatus(apt.status);
    setEditPaymentStatus(apt.paymentStatus || "PENDING");
    setEditPrice(apt.totalPrice !== undefined ? apt.totalPrice : "");
    setEditNotes(apt.notes || "");
  };

  // 5. Guardar Edición de Turno (Reagendar, Precio, Notas, Estados)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAptModal) return;
    setSubmittingEdit(true);
    const parsedPrice = Number(editPrice) || 0;

    try {
      // Actualización optimista inmediata
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editAptModal.id
            ? {
                ...a,
                date: editDate,
                startTime: editTime,
                status: editStatus,
                paymentStatus: editPaymentStatus,
                totalPrice: parsedPrice,
                notes: editNotes,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
      setEditAptModal(null);
      await rescheduleAppointment(editAptModal.id, {
        date: editDate,
        startTime: editTime,
        status: editStatus,
        paymentStatus: editPaymentStatus,
        totalPrice: parsedPrice,
        notes: editNotes,
      });
    } catch (err) {
      alert("Error al guardar cambios del turno.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // 6. Crear Turno Manual
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
      await loadDashboardData(true);
    } catch (err) {
      alert("Error al agendar turno manual.");
    } finally {
      setSubmittingManual(false);
    }
  };

  // 7. Crear y Eliminar Bloqueo
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
      await loadDashboardData(true);
    } catch (err) {
      alert("Error al guardar bloqueo de horario.");
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleRemoveBlock = async (id: string) => {
    setBlockedTimes((prev) => prev.filter((b) => b.id !== id));
    await removeScheduleBlock(id);
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
      .filter((a) => {
        const aDate = a.date && a.date.includes("T") ? a.date.split("T")[0] : a.date;
        return aDate === selectedDayKey;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDayKey]);

  const selectedDayBlocks = useMemo(() => {
    return blockedTimes.filter((b) => b.date === selectedDayKey);
  }, [blockedTimes, selectedDayKey]);

  const confirmedCountForSelectedDay = selectedDayAppointments.filter(
    (a) => a.status === "CONFIRMED"
  ).length;

  // Filtrado para listado completo de todos los turnos
  const filteredAllAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        if (statusFilter !== "ALL" && apt.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = apt.clientName?.toLowerCase().includes(q);
          const matchPhone = apt.clientPhone?.toLowerCase().includes(q);
          const matchService = apt.serviceName?.toLowerCase().includes(q);
          const matchDate = apt.date?.includes(q);
          if (!matchName && !matchPhone && !matchService && !matchDate) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateDiff = (b.date || "").localeCompare(a.date || "");
        if (dateDiff !== 0) return dateDiff;
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
  }, [appointments, statusFilter, searchQuery]);

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

  // Renderizador unificado para cada tarjeta de turno con control interactivo
  const renderAppointmentCard = (apt: StoredAppointment, showDate = false) => {
    const clientWaLink = `https://wa.me/${apt.clientPhone.replace(/\D/g, "")}`;
    const pBadge = getPaymentBadge(apt.paymentStatus);

    return (
      <div
        key={apt.id}
        className={`p-5 rounded-3xl border transition-all ${
          apt.status === "CONFIRMED"
            ? "bg-[#FFFFFF] border-[#D4AF37] shadow-sm hover:border-[#D4AF37]"
            : apt.status === "COMPLETED"
            ? "bg-emerald-50/40 border-emerald-300 shadow-2xs"
            : apt.status === "CANCELLED"
            ? "bg-rose-50/40 border-rose-200 opacity-65"
            : "bg-slate-50 border-slate-200 opacity-75"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Horario, Fecha y Clienta */}
          <div className="flex items-start gap-4">
            <div className="text-center p-3 rounded-2xl bg-[#F5F0E6] border border-[#DCC5A3]/40 min-w-[100px] shrink-0">
              {showDate && (
                <div className="text-[11px] font-bold text-[#8C7A5B] pb-1 border-b border-[#DCC5A3]/30 mb-1">
                  {apt.date}
                </div>
              )}
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
                <span className="font-bold text-[#2B2B2B] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
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
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#DCC5A3] bg-[#FAF8F5] text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
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
                className="text-xs font-medium px-3 py-1.5 rounded-xl border border-[#DCC5A3] bg-[#FAF8F5] text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
              >
                <option value="PENDING">❌ Sin Seña / Borrar Cobro ($0)</option>
                <option value="DEPOSIT_REQUESTED">Seña Solicitada ($0)</option>
                <option value="DEPOSIT_PAID">Seña Recibida (50%)</option>
                <option value="PAID">Pagado Total (100%)</option>
                <option value="AWAITING_VERIFICATION">A Verificar Comp. ($0)</option>
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-1.5 self-end">
              {/* Botón directo Borrar Pago en Dashboard */}
              {(apt.paymentStatus === "PAID" || apt.paymentStatus === "DEPOSIT_PAID" || apt.paymentStatus === "AWAITING_VERIFICATION") && apt.status !== "CANCELLED" && (
                <button
                  onClick={() => handleResetPayment(apt)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                  title="Borrar o anular este pago (resta el monto de la facturación)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-[11px]">Borrar Pago</span>
                </button>
              )}

              <button
                onClick={() => openEditModal(apt)}
                className="p-2 rounded-xl bg-[#FAF8F5] border border-[#DCC5A3] text-[#2B2B2B] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
                title="Editar precio, horario o notas"
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
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                title="Eliminar registro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0E0E0E] text-white">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Cabecera del Panel */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wider text-[#D4AF37] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agenda & Turnos</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-[#FFFFFF]">
              ALMANAQUE MENSUAL — ÁGAPE STUDIO
            </h1>
            <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1 font-montserrat font-light">
              Visualiza el mes completo y haz clic en cualquier día para gestionar sus turnos y estados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                setManualDate(formatDateKey(selectedDay));
                setIsManualModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#181818] text-[#FFFFFF] border border-[#333333] hover:border-[#D4AF37] text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Turno Manual</span>
            </button>

            <button
              onClick={() => {
                setBlockDate(formatDateKey(selectedDay));
                setIsBlockModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#181818] text-[#FFFFFF] border border-[#333333] hover:border-[#D4AF37] text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Bloquear Horario</span>
            </button>
          </div>
        </div>

        {/* Barra de Estado de Sincronización en Vivo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSyncing ? "bg-amber-400" : "bg-emerald-400"} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSyncing ? "bg-amber-500" : "bg-emerald-500"}`}></span>
            </span>
            <span className="text-xs text-[#888888] font-medium">
              {isSyncing ? "Sincronizando con base de datos..." : "Base de datos sincronizada en vivo"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#333333] bg-[#181818] hover:bg-[#222222] text-xs font-semibold text-[#E0E0E0] shadow-2xs transition-colors cursor-pointer"
              title="Refrescar datos de la base de datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isSyncing ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* TARJETAS DE MÉTRICAS RÁPIDAS INTERACTIVAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <button
            onClick={() => {
              setViewMode("all");
              setStatusFilter("ALL");
            }}
            className={`text-left p-4 rounded-2xl bg-[#FBF9F6] border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] ${
              viewMode === "all" && statusFilter === "ALL"
                ? "border-[#1A1A1A] ring-2 ring-[#1A1A1A]/20"
                : "border-[#E2DFD8]"
            }`}
            title="Ver todos los turnos"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373]">Total Turnos</span>
            <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-1.5">
              {liveStats.total}
            </div>
            <span className="text-xs text-[#8C857B] block mt-0.5">En historial</span>
          </button>

          <button
            onClick={() => {
              setViewMode("all");
              setStatusFilter("CONFIRMED");
            }}
            className={`text-left p-4 rounded-2xl bg-[#FBF9F6] border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] ${
              viewMode === "all" && statusFilter === "CONFIRMED"
                ? "border-[#8C7A5B] ring-2 ring-[#8C7A5B]/30"
                : "border-[#E2DFD8]"
            }`}
            title="Filtrar por confirmados"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373]">Confirmados</span>
            <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[#8C7A5B] mt-1.5">
              {liveStats.confirmed}
            </div>
            <span className="text-xs text-[#8C857B] block mt-0.5">Por atender</span>
          </button>

          <button
            onClick={() => {
              setViewMode("all");
              setStatusFilter("COMPLETED");
            }}
            className={`text-left p-4 rounded-2xl bg-[#FBF9F6] border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] ${
              viewMode === "all" && statusFilter === "COMPLETED"
                ? "border-[#2A7260] ring-2 ring-[#2A7260]/30"
                : "border-[#E2DFD8]"
            }`}
            title="Filtrar por asistieron / completados"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373]">Asistieron</span>
            <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[#2A7260] mt-1.5">
              {liveStats.completed}
            </div>
            <span className="text-xs text-[#8C857B] block mt-0.5">Completados</span>
          </button>

          <button
            onClick={() => {
              setViewMode("all");
              setStatusFilter("COMPLETED");
            }}
            className={`text-left p-4 rounded-2xl bg-[#FBF9F6] border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] ${
              viewMode === "all" && statusFilter === "COMPLETED"
                ? "border-[#1A1A1A] ring-2 ring-[#1A1A1A]/20"
                : "border-[#E2DFD8]"
            }`}
            title="Total recaudado"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373]">Facturación</span>
            <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-1.5">
              {formatPrice(liveStats.totalRevenue)}
            </div>
            <span className="text-xs text-[#8C857B] block mt-0.5">Cobrado total</span>
          </button>
        </div>

        {/* SELECTOR DE MODO DE VISTA: ALMANAQUE VS LISTADO GENERAL */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === "calendar"
                ? "bg-[#D4AF37] text-[#121212] font-bold shadow-md"
                : "bg-[#181818] border border-[#333333] text-[#CCCCCC] hover:border-[#D4AF37] hover:text-white"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Almanaque Mensual</span>
          </button>

          <button
            onClick={() => setViewMode("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === "all"
                ? "bg-[#D4AF37] text-[#121212] font-bold shadow-md"
                : "bg-[#181818] border border-[#333333] text-[#CCCCCC] hover:border-[#D4AF37] hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
            <span>Todos los Turnos en Base de Datos ({liveStats.total})</span>
          </button>
        </div>

        {/* VISTA 1: ALMANAQUE MENSUAL COMPLETO */}
        {viewMode === "calendar" && (
          <div className="space-y-8">
            <div className="bg-[#E5E2DA] rounded-3xl border border-[#D5D0C5] shadow-lg p-5 sm:p-7 space-y-6 relative overflow-hidden">
              {/* Marca de Agua ÁGAPE centralizada sobre el calendario como en la foto */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                aria-hidden="true"
              >
                <img
                  src="/agape-watermark.png"
                  alt="ÁGAPE"
                  className="w-[460px] max-w-[80%] opacity-25 object-contain"
                />
              </div>

              {/* Navegación del Mes */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#D5D0C5]/60">
                <div className="inline-flex items-center gap-2 bg-[#F2EFEB] px-3 py-1.5 rounded-2xl border border-[#D5D0C5] shadow-2xs">
                  <button
                    onClick={() => setCurrentMonthDate((prev) => subMonths(prev, 1))}
                    className="p-1.5 rounded-lg hover:bg-black/5 text-[#2B2B2B] transition-colors cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#1A1A1A] uppercase tracking-wider min-w-[180px] text-center">
                    {format(currentMonthDate, "MMMM yyyy", { locale: es })}
                  </h2>

                  <button
                    onClick={() => setCurrentMonthDate((prev) => addMonths(prev, 1))}
                    className="p-1.5 rounded-lg hover:bg-black/5 text-[#2B2B2B] transition-colors cursor-pointer"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      setCurrentMonthDate(today);
                      setSelectedDay(today);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#F2EFEB] hover:bg-white border border-[#D5D0C5] text-xs font-bold text-[#1A1A1A] transition-colors shadow-2xs cursor-pointer"
                  >
                    Ir al Día de Hoy
                  </button>
                </div>
              </div>

              {/* Cuadrícula del Almanaque */}
              <div className="overflow-x-auto relative z-10">
                <div className="min-w-[700px]">
                  {/* Encabezados de los 7 días de la semana */}
                  <div className="grid grid-cols-7 gap-2.5 mb-2.5 text-center font-cinzel text-xs font-bold uppercase tracking-wider text-[#7A746B]">
                    <div className="py-1">Lunes</div>
                    <div className="py-1">Martes</div>
                    <div className="py-1">Miércoles</div>
                    <div className="py-1">Jueves</div>
                    <div className="py-1">Viernes</div>
                    <div className="py-1">Sábado</div>
                    <div className="py-1">Domingo</div>
                  </div>

                  {/* Días del Mes en Grilla */}
                  <div className="grid grid-cols-7 gap-2.5">
                    {calendarDays.map((day) => {
                      const dayKey = formatDateKey(day);
                      const isCurrentMonth = isSameMonth(day, currentMonthDate);
                      const isToday = isSameDay(day, new Date());
                      const isSelected = isSameDay(day, selectedDay);

                      // Turnos de este día
                      const dayApts = appointments.filter((a) => {
                        const aDate = a.date && a.date.includes("T") ? a.date.split("T")[0] : a.date;
                        return aDate === dayKey;
                      });
                      const dayConfirmed = dayApts.filter((a) => a.status === "CONFIRMED").length;
                      const dayCompleted = dayApts.filter((a) => a.status === "COMPLETED").length;
                      const dayBlocks = blockedTimes.filter((b) => b.date === dayKey);

                      return (
                        <div
                          key={dayKey}
                          onClick={() => setSelectedDay(day)}
                          className={`min-h-[100px] sm:min-h-[110px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                            isSelected
                              ? "border-2 border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-[#FFFDF9] shadow-md scale-[1.02]"
                              : isToday
                              ? "border-2 border-[#8C7A5B] bg-[#FFFFFF] shadow-xs"
                              : isCurrentMonth
                              ? "border border-[#DDD8CF] bg-[#FFFFFF] hover:border-[#C5BFB4] hover:shadow-xs"
                              : "border border-[#E2DFD8] bg-[#F5F3EF] opacity-40"
                          }`}
                        >
                          {/* Número de Día y Badges */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs sm:text-sm font-bold ${
                                isSelected
                                  ? "text-[#D4AF37]"
                                  : isCurrentMonth
                                  ? "text-[#1A1A1A]"
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

                          {/* Resumen de turnos en la celda o 'Libre' */}
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
                              <span className="text-[10px] text-[#A8A49C] italic block text-right pr-1">
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
            <div className="bg-[#181818] rounded-3xl border border-[#2E2E2E] shadow-xl p-6 sm:p-8 space-y-6 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#D4AF37]">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Día Seleccionado</span>
                  </div>
                  <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#FFFFFF] capitalize">
                    {format(selectedDay, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </h3>
                  <p className="text-xs text-[#A0A0A0] mt-0.5 font-montserrat">
                    {selectedDayAppointments.length === 0
                      ? "No hay turnos agendados para este día."
                      : `${selectedDayAppointments.length} ${
                          selectedDayAppointments.length === 1 ? "turno reservado" : "turnos reservados"
                        } (${confirmedCountForSelectedDay} confirmados)`}
                  </p>
                </div>

                <button
                  onClick={() => openManualBookingForDate(selectedDayKey)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37] text-[#121212] font-bold text-xs hover:bg-white transition-colors cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
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
                          className="hover:text-red-600 font-bold cursor-pointer"
                          title="Eliminar bloqueo"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de Turnos del Día Seleccionado */}
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
                  {selectedDayAppointments.map((apt) => renderAppointmentCard(apt, false))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA 2: LISTADO GENERAL DE TODOS LOS TURNOS EN LA BASE DE DATOS */}
        {viewMode === "all" && (
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#DCC5A3] shadow-lg p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F0E6]">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#D4AF37]">
                  <CalendarCheck className="w-4 h-4" />
                  <span>Base de Datos General</span>
                </div>
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#2B2B2B]">
                  Todos los Turnos Registrados
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">
                  Mostrando {filteredAllAppointments.length} de {appointments.length} turnos en la base de datos.
                </p>
              </div>

              {/* Barra de Búsqueda */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C7A5B]" />
                <input
                  type="text"
                  placeholder="Buscar clienta, teléfono, servicio o fecha..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-[#DCC5A3] text-xs bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            {/* Píldoras de Filtro por Estado */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-[#2B2B2B] text-[#FFFFFF]"
                    : "bg-[#FAF8F5] border border-[#DCC5A3] text-[#2B2B2B] hover:bg-[#F5F0E6]"
                }`}
              >
                Todos ({liveStats.total})
              </button>
              <button
                onClick={() => setStatusFilter("CONFIRMED")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "CONFIRMED"
                    ? "bg-amber-600 text-[#FFFFFF]"
                    : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
                }`}
              >
                Confirmados ({liveStats.confirmed})
              </button>
              <button
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "COMPLETED"
                    ? "bg-emerald-600 text-[#FFFFFF]"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                Asistieron ({liveStats.completed})
              </button>
              <button
                onClick={() => setStatusFilter("CANCELLED")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "CANCELLED"
                    ? "bg-rose-600 text-[#FFFFFF]"
                    : "bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100"
                }`}
              >
                Cancelados ({liveStats.cancelled})
              </button>
              <button
                onClick={() => setStatusFilter("NO_SHOW")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "NO_SHOW"
                    ? "bg-slate-700 text-[#FFFFFF]"
                    : "bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200"
                }`}
              >
                No Asistió ({liveStats.noShow})
              </button>
            </div>

            {/* Listado de Turnos */}
            {filteredAllAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-[#EAE0D5] rounded-3xl bg-[#FAF8F5]">
                <Clock className="w-10 h-10 text-[#DCC5A3] mx-auto mb-2 opacity-60" />
                <h4 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                  No se encontraron turnos
                </h4>
                <p className="text-xs text-[#777777] mt-1">
                  No hay turnos que coincidan con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAllAppointments.map((apt) => renderAppointmentCard(apt, true))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: REAGENDAR O MODIFICAR TURNO (CON EDICIÓN DE PRECIO) */}
        {editAptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#F5F0E6] mb-4">
                <div>
                  <h3 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    Modificar Turno
                  </h3>
                  <p className="text-xs text-[#666666]">
                    {editAptModal.clientName} · {editAptModal.serviceName}
                  </p>
                </div>
                <button
                  onClick={() => setEditAptModal(null)}
                  className="p-1 rounded-full text-[#737373] hover:text-[#2B2B2B] cursor-pointer"
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
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] font-semibold"
                    >
                      <option value="CONFIRMED">🟡 Confirmado</option>
                      <option value="COMPLETED">🟢 Asistió</option>
                      <option value="CANCELLED">🔴 Cancelado</option>
                      <option value="NO_SHOW">⚪ No asistió</option>
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
                      <option value="PENDING">❌ Sin Seña / Borrar Cobro ($0)</option>
                      <option value="DEPOSIT_REQUESTED">Seña Solicitada ($0)</option>
                      <option value="DEPOSIT_PAID">Seña Recibida (50%)</option>
                      <option value="PAID">Pagado Total (100%)</option>
                      <option value="AWAITING_VERIFICATION">A Verificar Comprobante ($0)</option>
                    </select>
                  </div>
                </div>

                {/* Acción rápida para anular o borrar cobro de este turno */}
                {editPaymentStatus !== "PENDING" && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-amber-900 text-xs">¿El pago no se acreditó o fue erróneo?</p>
                      <p className="text-[10px] text-amber-700 leading-tight">Puedes anular el pago para que el turno quede en $0 pendiente y se reste de la facturación.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditPaymentStatus("PENDING");
                        if (editStatus === "COMPLETED") setEditStatus("CONFIRMED");
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
                    >
                      ↺ Borrar Cobro ($0)
                    </button>
                  </div>
                )}

                {/* Edición de Precio del Turno */}
                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Precio Total del Servicio ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#737373] font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      placeholder="15000"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] text-xs font-semibold text-[#2B2B2B]"
                    />
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
                    className="inline-flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-semibold cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Avisar a clienta por WhatsApp</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#F5F0E6]">
                  <button
                    type="button"
                    onClick={() => setEditAptModal(null)}
                    className="flex-1 py-2.5 rounded-full border border-[#DCC5A3] bg-[#FAF8F5] font-semibold text-[#2B2B2B] cursor-pointer"
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
                  Agendar Turno Manual
                </h3>
                <button
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1 rounded-full text-[#737373] hover:text-[#2B2B2B] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Nombre de la Clienta *
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
                      Teléfono WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 3511234567"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">Servicio *</label>
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
                    className="flex-1 py-2.5 rounded-full border border-[#DCC5A3] bg-[#FAF8F5] font-semibold text-[#2B2B2B] cursor-pointer"
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
                  className="p-1 rounded-full text-[#737373] hover:text-[#2B2B2B] cursor-pointer"
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
                    className="flex-1 py-2.5 rounded-full border border-[#DCC5A3] bg-[#FAF8F5] font-semibold text-[#2B2B2B] cursor-pointer"
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
