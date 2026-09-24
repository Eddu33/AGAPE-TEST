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
    const apt = appointments.find((a) => a.id === id);
    // Actualización optimista inmediata en 0ms para refrescar las 4 tarjetas de métricas al instante
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a))
    );
    try {
      await updateAppointmentStatus(id, status);
      if (status === "COMPLETED" && apt) {
        if (window.confirm("Turno completado. ¿Deseas programar el próximo turno de mantenimiento (sugerido en 15 días)?")) {
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + 15);
          setManualName(apt.clientName);
          setManualPhone(apt.clientPhone);
          setManualServiceId(apt.serviceId || "kapping-gel");
          setManualDate(formatDateKey(nextDate));
          setManualTime(apt.startTime);
          setIsManualModalOpen(true);
        }
      }
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
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          apt.status === "CONFIRMED"
            ? "bg-[#FFFFFF] dark:bg-[#1F1F1F] border-[#D4AF37] shadow-sm hover:border-[#D4AF37]"
            : apt.status === "COMPLETED"
            ? "bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-2xs"
            : apt.status === "CANCELLED"
            ? "bg-rose-50/40 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 opacity-65"
            : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 opacity-75"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Horario, Fecha y Clienta */}
          <div className="flex items-start gap-4">
            <div className="text-center p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#282828] border border-[#E2DBD0] dark:border-[#3A3A3A] min-w-[100px] shrink-0">
              {showDate && (
                <div className="text-[11px] font-bold text-[#8C7A5B] dark:text-[#D4AF37] pb-1 border-b border-[#E2DBD0] dark:border-[#3A3A3A] mb-1">
                  {apt.date?.split("-").reverse().join("/")}
                </div>
              )}
              <div className="text-base font-cinzel font-bold text-[#171717] dark:text-white">
                {apt.startTime}
              </div>
              <div className="text-[10px] text-[#777777] dark:text-[#A3A3A3]">a {apt.endTime} hs</div>
              <div className="text-[9px] uppercase tracking-wider text-[#B38E22] dark:text-[#D4AF37] font-bold mt-1">
                {formatDuration(apt.durationMinutes)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-base text-[#171717] dark:text-white">{apt.clientName}</h4>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pBadge.bg}`}
                >
                  {pBadge.label}
                </span>
              </div>

              <p className="text-xs font-semibold text-[#8C7A5B] dark:text-[#D4AF37]">
                {apt.serviceName}
                {apt.extraNames && apt.extraNames.length > 0 && (
                  <span className="text-[#666666] dark:text-[#A3A3A3] font-normal">
                    {" "}
                    + {apt.extraNames.join(", ")}
                  </span>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] dark:text-[#A3A3A3] pt-1">
                <span className="font-bold text-[#171717] dark:text-white flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
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
                <p className="text-[11px] text-[#555555] dark:text-[#D1D1D1] bg-[#FAF8F5] dark:bg-[#252525] p-2 rounded-xl border border-[#E2DBD0] dark:border-[#333333] mt-1">
                  <strong>Nota:</strong> {apt.notes}
                </p>
              )}
            </div>
          </div>

          {/* ASIGNACIÓN DE ESTADO Y ACCIONES RÁPIDAS */}
          <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E2DBD0] dark:border-[#333333]">
            {/* Selector directo de Estado del Turno */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] dark:text-[#A3A3A3]">
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
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#E2DBD0] dark:border-[#3A3A3A] bg-[#FAF8F5] dark:bg-[#282828] text-[#171717] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
              >
                <option value="CONFIRMED">🟡 Confirmado</option>
                <option value="COMPLETED">🟢 Asistió</option>
                <option value="NO_SHOW">⚪ No asistió</option>
                <option value="CANCELLED">🔴 Cancelado</option>
              </select>
            </div>

            {/* Selector directo de Estado del Pago */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] dark:text-[#A3A3A3]">
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
                className="text-xs font-medium px-3 py-1.5 rounded-xl border border-[#E2DBD0] dark:border-[#3A3A3A] bg-[#FAF8F5] dark:bg-[#282828] text-[#171717] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
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
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                  title="Borrar o anular este pago (resta el monto de la facturación)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span className="text-[11px]">Borrar Pago</span>
                </button>
              )}

              <button
                onClick={() => openEditModal(apt)}
                className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#282828] border border-[#E2DBD0] dark:border-[#3A3A3A] text-[#171717] dark:text-white hover:bg-[#F5F0E6] dark:hover:bg-[#333333] transition-colors cursor-pointer"
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
    <div className="flex flex-col min-h-screen bg-transparent">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Cabecera del Panel */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wider text-[#B38E22] dark:text-[#D4AF37] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agenda & Turnos</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-[#171717] dark:text-[#FFFFFF]">
              ALMANAQUE MENSUAL — ÁGAPE STUDIO
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A0A0A0] mt-1 font-montserrat font-light">
              Visualiza el mes completo y haz clic en cualquier día para gestionar sus turnos y estados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                setManualDate(formatDateKey(selectedDay));
                setIsManualModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#FFFFFF] dark:bg-[#181818] text-[#171717] dark:text-[#FFFFFF] border border-[#DDD8CF] dark:border-[#333333] hover:border-[#D4AF37] text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Turno Manual</span>
            </button>

            <button
              onClick={() => {
                setBlockDate(formatDateKey(selectedDay));
                setIsBlockModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#FFFFFF] dark:bg-[#181818] text-[#171717] dark:text-[#FFFFFF] border border-[#DDD8CF] dark:border-[#333333] hover:border-[#D4AF37] text-xs font-semibold transition-all shadow-xs cursor-pointer"
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
            <span className="text-xs text-[#666666] dark:text-[#888888] font-medium">
              {isSyncing ? "Sincronizando con base de datos..." : "Base de datos sincronizada en vivo"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FFFFFF] dark:bg-[#181818] hover:bg-[#F7F5F0] dark:hover:bg-[#222222] text-xs font-semibold text-[#171717] dark:text-[#E0E0E0] shadow-2xs transition-colors cursor-pointer"
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
            className={`text-left p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1A1A1A] border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] ${
              viewMode === "all" && statusFilter === "ALL"
                ? "border-[#1A1A1A] dark:border-[#D4AF37] ring-2 ring-[#1A1A1A]/20 dark:ring-[#D4AF37]/30"
                : "border-[#E2DFD8] dark:border-[#2D2D2D]"
            }`}
            title="Ver todos los turnos"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373] dark:text-[#A0A0A0]">Total Turnos</span>
            <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[#171717] dark:text-[#FFFFFF] mt-1.5">
              {liveStats.total}
            </div>
            <span className="text-xs text-[#8C857B] dark:text-[#888888] block mt-0.5">En historial</span>
          </button>

          <button
            onClick={() => {
              setViewMode("all");
              setStatusFilter("CONFIRMED");
            }}
            className={`text-left p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1A1A1A] border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] ${
              viewMode === "all" && statusFilter === "CONFIRMED"
                ? "border-[#B38E22] dark:border-[#D4AF37] ring-2 ring-[#B38E22]/30 dark:ring-[#D4AF37]/30"
                : "border-[#E2DFD8] dark:border-[#2D2D2D]"
            }`}
            title="Filtrar por confirmados"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373] dark:text-[#A0A0A0]">Confirmados</span>
            <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[#B38E22] dark:text-[#D4AF37] mt-1.5">
              {liveStats.confirmed}
            </div>
            <span className="text-xs text-[#8C857B] dark:text-[#888888] block mt-0.5">Por atender</span>
          </button>

          <button
            onClick={() => {
              setViewMode("all");
              setStatusFilter("COMPLETED");
            }}
            className={`text-left p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1A1A1A] border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] ${
              viewMode === "all" && statusFilter === "COMPLETED"
                ? "border-[#1E7B62] dark:border-[#2DD4BF] ring-2 ring-[#1E7B62]/30 dark:ring-[#2DD4BF]/30"
                : "border-[#E2DFD8] dark:border-[#2D2D2D]"
            }`}
            title="Filtrar por asistieron / completados"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373] dark:text-[#A0A0A0]">Asistieron</span>
            <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[#1E7B62] dark:text-[#2DD4BF] mt-1.5">
              {liveStats.completed}
            </div>
            <span className="text-xs text-[#8C857B] dark:text-[#888888] block mt-0.5">Completados</span>
          </button>

          <button
            onClick={() => {
              setViewMode("all");
              setStatusFilter("COMPLETED");
            }}
            className={`text-left p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1A1A1A] border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] ${
              viewMode === "all" && statusFilter === "COMPLETED"
                ? "border-[#1A1A1A] dark:border-[#D4AF37] ring-2 ring-[#1A1A1A]/20 dark:ring-[#D4AF37]/30"
                : "border-[#E2DFD8] dark:border-[#2D2D2D]"
            }`}
            title="Total recaudado"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373] dark:text-[#A0A0A0]">Facturación</span>
            <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[#171717] dark:text-[#FFFFFF] mt-1.5">
              {formatPrice(liveStats.totalRevenue)}
            </div>
            <span className="text-xs text-[#8C857B] dark:text-[#888888] block mt-0.5">Cobrado total</span>
          </button>
        </div>

        {/* SELECTOR DE MODO DE VISTA: ALMANAQUE VS LISTADO GENERAL */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === "calendar"
                ? "bg-[#D4AF37] text-[#121212] font-bold shadow-md"
                : "bg-[#FFFFFF] dark:bg-[#181818] border border-[#DDD8CF] dark:border-[#333333] text-[#555555] dark:text-[#CCCCCC] hover:border-[#D4AF37] hover:text-[#121212] dark:hover:text-white"
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
                : "bg-[#FFFFFF] dark:bg-[#181818] border border-[#DDD8CF] dark:border-[#333333] text-[#555555] dark:text-[#CCCCCC] hover:border-[#D4AF37] hover:text-[#121212] dark:hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
            <span>Todos los Turnos en Base de Datos ({liveStats.total})</span>
          </button>
        </div>

        {/* VISTA 1: ALMANAQUE MENSUAL COMPLETO */}
        {viewMode === "calendar" && (
          <div className="space-y-8">
            <div className="bg-[#F7F5F0] dark:bg-[#161616] rounded-3xl border border-[#DDD8CF] dark:border-[#2D2D2D] shadow-lg p-5 sm:p-7 space-y-6 relative overflow-hidden">
              {/* Marca de Agua ÁGAPE centralizada sobre el calendario */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                aria-hidden="true"
              >
                <img
                  src="/agape-watermark.png"
                  alt="ÁGAPE"
                  className="w-[460px] max-w-[80%] opacity-20 dark:opacity-10 object-contain"
                />
              </div>

              {/* Navegación del Mes */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#DDD8CF] dark:border-[#2D2D2D]">
                <div className="inline-flex items-center gap-2 bg-[#FFFFFF] dark:bg-[#202020] px-3 py-1.5 rounded-2xl border border-[#DDD8CF] dark:border-[#333333] shadow-2xs">
                  <button
                    onClick={() => setCurrentMonthDate((prev) => subMonths(prev, 1))}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#2B2B2B] dark:text-[#E0E0E0] transition-colors cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider min-w-[180px] text-center">
                    {format(currentMonthDate, "MMMM yyyy", { locale: es })}
                  </h2>

                  <button
                    onClick={() => setCurrentMonthDate((prev) => addMonths(prev, 1))}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#2B2B2B] dark:text-[#E0E0E0] transition-colors cursor-pointer"
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
                    className="px-4 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#202020] hover:bg-[#F2EFEB] dark:hover:bg-[#282828] border border-[#DDD8CF] dark:border-[#333333] text-xs font-bold text-[#1A1A1A] dark:text-white transition-colors shadow-2xs cursor-pointer"
                  >
                    Ir al Día de Hoy
                  </button>
                </div>
              </div>

              {/* Cuadrícula del Almanaque */}
              <div className="overflow-x-auto relative z-10">
                <div className="min-w-[700px]">
                  {/* Encabezados de los 7 días de la semana */}
                  <div className="grid grid-cols-7 gap-2.5 mb-2.5 text-center font-cinzel text-xs font-bold uppercase tracking-wider text-[#7A746B] dark:text-[#A0A0A0]">
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
                              ? "border-2 border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-[#FFFDF7] dark:bg-[#2A2415] shadow-md scale-[1.02]"
                              : isToday
                              ? "border-2 border-[#8C7A5B] dark:border-[#D4AF37] bg-[#FFFFFF] dark:bg-[#222222] shadow-xs"
                              : isCurrentMonth
                              ? "border border-[#DDD8CF] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#1C1C1C] hover:border-[#C5BFB4] dark:hover:border-[#444444] hover:shadow-xs"
                              : "border border-[#E2DFD8] dark:border-[#222222] bg-[#F5F3EF] dark:bg-[#141414] opacity-40"
                          }`}
                        >
                          {/* Número de Día y Badges */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs sm:text-sm font-bold ${
                                isSelected
                                  ? "text-[#B38E22] dark:text-[#D4AF37]"
                                  : isCurrentMonth
                                  ? "text-[#1A1A1A] dark:text-[#F0F0F0]"
                                  : "text-[#AAAAAA] dark:text-[#666666]"
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
                                  <div className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 w-full truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span>{dayConfirmed} conf.</span>
                                  </div>
                                )}

                                {dayCompleted > 0 && (
                                  <div className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 w-full truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span>{dayCompleted} asist.</span>
                                  </div>
                                )}

                                {dayConfirmed === 0 && dayCompleted === 0 && (
                                  <div className="text-[10px] font-semibold text-[#777777] dark:text-[#A0A0A0] px-1 truncate">
                                    {dayApts.length} {dayApts.length === 1 ? "turno" : "turnos"}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#A8A49C] dark:text-[#666666] italic block text-right pr-1">
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
            <div className="bg-[#FFFFFF] dark:bg-[#181818] rounded-3xl border border-[#DDD8CF] dark:border-[#2E2E2E] shadow-xl p-6 sm:p-8 space-y-6 text-[#171717] dark:text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EBE6DC] dark:border-[#2E2E2E]">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#B38E22] dark:text-[#D4AF37]">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Día Seleccionado</span>
                  </div>
                  <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#FFFFFF] capitalize">
                    {format(selectedDay, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#A0A0A0] mt-0.5 font-montserrat">
                    {selectedDayAppointments.length === 0
                      ? "No hay turnos agendados para este día."
                      : `${selectedDayAppointments.length} ${
                          selectedDayAppointments.length === 1 ? "turno reservado" : "turnos reservados"
                        } (${confirmedCountForSelectedDay} confirmados)`}
                  </p>
                </div>

                <button
                  onClick={() => openManualBookingForDate(selectedDayKey)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37] text-[#121212] font-bold text-xs hover:bg-[#B38E22] hover:text-white transition-colors cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agendar Turno para esta fecha</span>
                </button>
              </div>

              {/* Bloqueos en este día */}
              {selectedDayBlocks.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200">
                  <span className="text-xs font-bold block mb-2">
                    🔒 Franjas Horarias Bloqueadas:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedDayBlocks.map((b) => (
                      <div
                        key={b.id}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] dark:bg-[#222222] border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200"
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
                <div className="text-center py-12 px-4 border-2 border-dashed border-[#DDD8CF] dark:border-[#2E2E2E] rounded-3xl bg-[#FAF8F5] dark:bg-[#141414]">
                  <Clock className="w-10 h-10 text-[#DCC5A3] dark:text-[#666666] mx-auto mb-2 opacity-60" />
                  <h4 className="font-cinzel text-lg font-bold text-[#171717] dark:text-[#F0F0F0]">
                    Sin turnos en esta fecha
                  </h4>
                  <p className="text-xs text-[#777777] dark:text-[#A0A0A0] mt-1 max-w-sm mx-auto">
                    No hay citas agendadas por clientas para el{" "}
                    {format(selectedDay, "d 'de' MMMM", { locale: es })}.
                  </p>
                  <button
                    onClick={() => openManualBookingForDate(selectedDayKey)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#181818] dark:bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#181818] transition-colors cursor-pointer"
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
          <div className="bg-[#FFFFFF] dark:bg-[#181818] rounded-3xl border border-[#DDD8CF] dark:border-[#2E2E2E] shadow-lg p-6 sm:p-8 space-y-6 text-[#171717] dark:text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EBE6DC] dark:border-[#2E2E2E]">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#B38E22] dark:text-[#D4AF37]">
                  <CalendarCheck className="w-4 h-4" />
                  <span>Base de Datos General</span>
                </div>
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#FFFFFF]">
                  Todos los Turnos Registrados
                </h3>
                <p className="text-xs text-[#666666] dark:text-[#A0A0A0] mt-0.5">
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
                  className="w-full pl-9 pr-3 py-2 rounded-full border border-[#DDD8CF] dark:border-[#333333] text-xs bg-[#FAF8F5] dark:bg-[#121212] text-[#171717] dark:text-white placeholder-[#888888] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            {/* Píldoras de Filtro por Estado */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-[#181818] dark:bg-[#333333] text-[#FFFFFF]"
                    : "bg-[#FAF8F5] dark:bg-[#1A1A1A] border border-[#DDD8CF] dark:border-[#333333] text-[#333333] dark:text-[#CCCCCC] hover:bg-[#F5F0E6] dark:hover:bg-[#252525]"
                }`}
              >
                Todos ({liveStats.total})
              </button>
              <button
                onClick={() => setStatusFilter("CONFIRMED")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "CONFIRMED"
                    ? "bg-amber-600 text-[#FFFFFF]"
                    : "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60"
                }`}
              >
                Confirmados ({liveStats.confirmed})
              </button>
              <button
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "COMPLETED"
                    ? "bg-emerald-600 text-[#FFFFFF]"
                    : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                }`}
              >
                Asistieron ({liveStats.completed})
              </button>
              <button
                onClick={() => setStatusFilter("CANCELLED")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "CANCELLED"
                    ? "bg-rose-600 text-[#FFFFFF]"
                    : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                }`}
              >
                Cancelados ({liveStats.cancelled})
              </button>
              <button
                onClick={() => setStatusFilter("NO_SHOW")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "NO_SHOW"
                    ? "bg-slate-700 text-[#FFFFFF]"
                    : "bg-slate-100 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                No Asistió ({liveStats.noShow})
              </button>
            </div>

            {/* Listado de Turnos */}
            {filteredAllAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-[#DDD8CF] dark:border-[#2E2E2E] rounded-3xl bg-[#FAF8F5] dark:bg-[#141414]">
                <Clock className="w-10 h-10 text-[#DCC5A3] dark:text-[#666666] mx-auto mb-2 opacity-60" />
                <h4 className="font-cinzel text-lg font-bold text-[#171717] dark:text-[#F0F0F0]">
                  No se encontraron turnos
                </h4>
                <p className="text-xs text-[#777777] dark:text-[#A0A0A0] mt-1">
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
            <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#1A1A1A] rounded-3xl p-6 sm:p-8 border border-[#DDD8CF] dark:border-[#333333] shadow-2xl text-[#171717] dark:text-white">
              <div className="flex items-center justify-between pb-4 border-b border-[#EBE6DC] dark:border-[#2E2E2E] mb-4">
                <div>
                  <h3 className="font-cinzel text-xl font-bold text-[#171717] dark:text-[#FFFFFF]">
                    Modificar Turno
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#A0A0A0]">
                    {editAptModal.clientName} · {editAptModal.serviceName}
                  </p>
                </div>
                <button
                  onClick={() => setEditAptModal(null)}
                  className="p-1 rounded-full text-[#737373] hover:text-[#171717] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">Nueva Fecha</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">Nueva Hora</label>
                    <input
                      type="time"
                      required
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">Estado del Turno</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as StoredAppointment["status"])}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white font-semibold"
                    >
                      <option value="CONFIRMED" className="dark:bg-[#222222]">🟡 Confirmado</option>
                      <option value="COMPLETED" className="dark:bg-[#222222]">🟢 Asistió</option>
                      <option value="CANCELLED" className="dark:bg-[#222222]">🔴 Cancelado</option>
                      <option value="NO_SHOW" className="dark:bg-[#222222]">⚪ No asistió</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">Estado de Pago / Seña</label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) =>
                        setEditPaymentStatus(e.target.value as StoredAppointment["paymentStatus"])
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                    >
                      <option value="PENDING" className="dark:bg-[#222222]">❌ Sin Seña / Borrar Cobro ($0)</option>
                      <option value="DEPOSIT_REQUESTED" className="dark:bg-[#222222]">Seña Solicitada ($0)</option>
                      <option value="DEPOSIT_PAID" className="dark:bg-[#222222]">Seña Recibida (50%)</option>
                      <option value="PAID" className="dark:bg-[#222222]">Pagado Total (100%)</option>
                      <option value="AWAITING_VERIFICATION" className="dark:bg-[#222222]">A Verificar Comprobante ($0)</option>
                    </select>
                  </div>
                </div>

                {/* Acción rápida para anular o borrar cobro de este turno */}
                {editPaymentStatus !== "PENDING" && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">¿El pago no se acreditó o fue erróneo?</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight">Puedes anular el pago para que el turno quede en $0 pendiente y se reste de la facturación.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditPaymentStatus("PENDING");
                        if (editStatus === "COMPLETED") setEditStatus("CONFIRMED");
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
                    >
                      ↺ Borrar Cobro ($0)
                    </button>
                  </div>
                )}

                {/* Edición de Precio del Turno */}
                <div>
                  <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">
                    Precio Total del Servicio ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#737373] dark:text-[#A0A0A0] font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      placeholder="15000"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-xs font-semibold text-[#171717] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">
                    Notas / Motivo del cambio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Clienta solicitó cambio por horario laboral"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => sendWhatsAppReschedule(editAptModal)}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Avisar a clienta por WhatsApp</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#EBE6DC] dark:border-[#2E2E2E]">
                  <button
                    type="button"
                    onClick={() => setEditAptModal(null)}
                    className="flex-1 py-2.5 rounded-full border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#252525] font-semibold text-[#171717] dark:text-[#E0E0E0] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="flex-1 py-2.5 rounded-full bg-[#181818] dark:bg-[#D4AF37] text-[#FFFFFF] dark:text-[#121212] font-semibold hover:bg-[#D4AF37] hover:text-[#181818] dark:hover:bg-white transition-colors cursor-pointer"
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
            <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#1A1A1A] rounded-3xl p-6 sm:p-8 border border-[#DDD8CF] dark:border-[#333333] shadow-2xl max-h-[90vh] overflow-y-auto text-[#171717] dark:text-white">
              <div className="flex items-center justify-between pb-4 border-b border-[#EBE6DC] dark:border-[#2E2E2E] mb-4">
                <h3 className="font-cinzel text-xl font-bold text-[#171717] dark:text-[#FFFFFF]">
                  Agendar Turno Manual
                </h3>
                <button
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1 rounded-full text-[#737373] hover:text-[#171717] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">
                      Nombre de la Clienta *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Laura Pérez"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">
                      Teléfono WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 3511234567"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">Servicio *</label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                  >
                    {SERVICIOS_AGAPE.map((s) => (
                      <option key={s.id} value={s.id} className="dark:bg-[#222222]">
                        {s.nombre} — {formatDuration(s.duracion)} ({formatPrice(s.precio)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">
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
                              ? "bg-amber-100/70 dark:bg-amber-950/50 border-[#D4AF37] font-semibold text-[#171717] dark:text-white"
                              : "bg-[#FFFFFF] dark:bg-[#222222] border-[#DDD8CF] dark:border-[#333333] text-[#171717] dark:text-[#CCCCCC]"
                          }`}
                        >
                          <span>{ex.nombre}</span>
                          <span className="text-[10px] text-[#737373] dark:text-[#A0A0A0]">
                            +{formatPrice(ex.precio)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">Fecha *</label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">
                      Hora de Inicio *
                    </label>
                    <input
                      type="time"
                      required
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">
                    Notas u observaciones
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pagó seña por transferencia"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="flex-1 py-2.5 rounded-full border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#252525] font-semibold text-[#171717] dark:text-[#E0E0E0] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingManual}
                    className="flex-1 py-2.5 rounded-full bg-[#181818] dark:bg-[#D4AF37] text-[#FFFFFF] dark:text-[#121212] font-semibold hover:bg-[#D4AF37] hover:text-[#181818] dark:hover:bg-white transition-colors cursor-pointer"
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
            <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#1A1A1A] rounded-3xl p-6 sm:p-8 border border-[#DDD8CF] dark:border-[#333333] shadow-2xl text-[#171717] dark:text-white">
              <div className="flex items-center justify-between pb-4 border-b border-[#EBE6DC] dark:border-[#2E2E2E] mb-4">
                <h3 className="font-cinzel text-xl font-bold text-[#171717] dark:text-[#FFFFFF]">
                  Bloquear Franja Horaria
                </h3>
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="p-1 rounded-full text-[#737373] hover:text-[#171717] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">Desde</label>
                    <input
                      type="time"
                      required
                      value={blockStart}
                      onChange={(e) => setBlockStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">Hasta</label>
                    <input
                      type="time"
                      required
                      value={blockEnd}
                      onChange={(e) => setBlockEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] dark:text-[#E0E0E0] mb-1">
                    Motivo del Bloqueo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Turno médico / Trámite personal"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#222222] text-[#171717] dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsBlockModalOpen(false)}
                    className="flex-1 py-2.5 rounded-full border border-[#DDD8CF] dark:border-[#333333] bg-[#FAF8F5] dark:bg-[#252525] font-semibold text-[#171717] dark:text-[#E0E0E0] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBlock}
                    className="flex-1 py-2.5 rounded-full bg-[#181818] dark:bg-[#D4AF37] text-[#FFFFFF] dark:text-[#121212] font-semibold hover:bg-[#D4AF37] hover:text-[#181818] dark:hover:bg-white transition-colors cursor-pointer"
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
