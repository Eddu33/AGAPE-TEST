"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import {
  getFinancialSummary,
  getAdminExpenses,
  saveAdminExpense,
  deleteAdminExpense,
  updateAdminExpense,
  getAdminAppointments,
  updateAppointmentPayment,
  deleteAppointment,
  createManualAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
} from "../actions";
import { Expense, StoredAppointment } from "@/lib/db";
import { formatPrice, SERVICIOS_AGAPE } from "@/lib/services";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  RefreshCw,
  AlertCircle,
  FileText,
  Edit2,
  Check,
  X,
  Search,
  Filter,
  Ban,
  RotateCcw,
} from "lucide-react";

function normalizePaymentMethod(method?: string): StoredAppointment["paymentMethod"] {
  const m = (method || "").toUpperCase();
  if (m === "CASH" || m === "EFECTIVO") return "EFECTIVO";
  if (m === "TRANSFER" || m === "TRANSFERENCIA") return "TRANSFERENCIA";
  if (m === "OTRO") return "OTRO";
  return "TRANSFERENCIA";
}

export default function AdminFinancesPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [appointments, setAppointments] = useState<StoredAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de Control de Señas y Pagos
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PENDING" | "DEPOSIT" | "PAID" | "CANCELLED">("ALL");
  const [searchAppointmentQuery, setSearchAppointmentQuery] = useState("");

  // Modal para ver desglose de de dónde son los montos
  const [isIncomeBreakdownOpen, setIsIncomeBreakdownOpen] = useState(false);

  // Modal para agregar gasto
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseFecha, setExpenseFecha] = useState(new Date().toISOString().split("T")[0]);
  const [expenseCategoria, setExpenseCategoria] = useState<Expense["categoria"]>("Materiales");
  const [expenseDescripcion, setExpenseDescripcion] = useState("");
  const [expenseMonto, setExpenseMonto] = useState("");
  const [expenseObservaciones, setExpenseObservaciones] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  // Modal para editar gasto existente
  const [editExpenseModal, setEditExpenseModal] = useState<Expense | null>(null);
  const [editExpFecha, setEditExpFecha] = useState("");
  const [editExpCategoria, setEditExpCategoria] = useState<Expense["categoria"]>("Materiales");
  const [editExpDescripcion, setEditExpDescripcion] = useState("");
  const [editExpMonto, setEditExpMonto] = useState("");
  const [editExpObservaciones, setEditExpObservaciones] = useState("");
  const [savingEditExpense, setSavingEditExpense] = useState(false);

  // Modal para agregar cobro / turno manual desde finanzas
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newServiceName, setNewServiceName] = useState("Kapping Gel");
  const [newAmount, setNewAmount] = useState("15000");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("12:00");
  const [newPaymentStatus, setNewPaymentStatus] = useState<StoredAppointment["paymentStatus"]>("PAID");
  const [newPaymentMethod, setNewPaymentMethod] = useState<StoredAppointment["paymentMethod"]>("TRANSFERENCIA");
  const [newAppointmentStatus, setNewAppointmentStatus] = useState<StoredAppointment["status"]>("COMPLETED");
  const [savingNewPayment, setSavingNewPayment] = useState(false);

  // Modal para editar cobro / turno existente
  const [editAptModal, setEditAptModal] = useState<StoredAppointment | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editServiceName, setEditServiceName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editStatus, setEditStatus] = useState<StoredAppointment["status"]>("CONFIRMED");
  const [editPaymentStatus, setEditPaymentStatus] = useState<StoredAppointment["paymentStatus"]>("PENDING");
  const [editPaymentMethod, setEditPaymentMethod] = useState<StoredAppointment["paymentMethod"]>("TRANSFERENCIA");
  const [savingEditApt, setSavingEditApt] = useState(false);

  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    loadFinancialData();
  }, [router]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const [sumData, expData, aptData] = await Promise.all([
        getFinancialSummary(),
        getAdminExpenses(),
        getAdminAppointments(),
      ]);
      setSummary(sumData);
      setExpenses(expData);
      setAppointments(aptData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (text: string, type: "success" | "error") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ==========================================
  // GESTIÓN DE GASTOS
  // ==========================================
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDescripcion.trim() || !expenseMonto) {
      showFeedback("La descripción y el monto son obligatorios.", "error");
      return;
    }

    setSavingExpense(true);
    try {
      const res = await saveAdminExpense({
        fecha: expenseFecha,
        categoria: expenseCategoria,
        descripcion: expenseDescripcion.trim(),
        monto: Number(expenseMonto),
        observaciones: expenseObservaciones.trim() || undefined,
      });

      if (res.success) {
        setIsExpenseModalOpen(false);
        setExpenseDescripcion("");
        setExpenseMonto("");
        setExpenseObservaciones("");
        await loadFinancialData();
        showFeedback("Gasto registrado correctamente.", "success");
      } else {
        showFeedback(res.error || "Error al registrar gasto.", "error");
      }
    } catch (err: any) {
      showFeedback(err.message, "error");
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (!confirm(`¿Eliminar el gasto "${desc}"?`)) return;
    try {
      await deleteAdminExpense(id);
      await loadFinancialData();
      showFeedback("Gasto eliminado.", "success");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const openEditExpenseModal = (exp: Expense) => {
    setEditExpenseModal(exp);
    setEditExpFecha(exp.fecha);
    setEditExpCategoria(exp.categoria);
    setEditExpDescripcion(exp.descripcion);
    setEditExpMonto(String(exp.monto));
    setEditExpObservaciones(exp.observaciones || "");
  };

  const handleSaveEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExpenseModal) return;
    if (!editExpDescripcion.trim() || !editExpMonto) {
      showFeedback("La descripción y el monto son obligatorios.", "error");
      return;
    }

    setSavingEditExpense(true);
    try {
      const res = await updateAdminExpense(editExpenseModal.id, {
        fecha: editExpFecha,
        categoria: editExpCategoria,
        descripcion: editExpDescripcion.trim(),
        monto: Number(editExpMonto),
        observaciones: editExpObservaciones.trim() || undefined,
      });

      if (res.success) {
        setEditExpenseModal(null);
        await loadFinancialData();
        showFeedback("Gasto modificado correctamente.", "success");
      } else {
        showFeedback(res.error || "Error al modificar gasto.", "error");
      }
    } catch (err: any) {
      showFeedback(err.message, "error");
    } finally {
      setSavingEditExpense(false);
    }
  };

  // ==========================================
  // GESTIÓN DE COBROS, SEÑAS Y ESTADOS DE TURNOS
  // ==========================================

  // 1. Cambio rápido de estado de pago o método
  const handlePaymentChange = async (
    aptId: string,
    status: StoredAppointment["paymentStatus"],
    method?: StoredAppointment["paymentMethod"]
  ) => {
    const targetApt = appointments.find((a) => a.id === aptId);
    const nextStatus = status === "PENDING" && targetApt?.status === "COMPLETED" ? "CONFIRMED" : undefined;

    // Optimista
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === aptId
          ? {
              ...a,
              paymentStatus: status,
              paymentMethod: method || a.paymentMethod,
              status: nextStatus || a.status,
            }
          : a
      )
    );
    try {
      await updateAppointmentPayment(aptId, status, method, undefined, nextStatus);
      await loadFinancialData();
      showFeedback(
        status === "PENDING"
          ? "Pago anulado/borrado. Se restó del balance."
          : "Estado de pago actualizado.",
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showFeedback("Error al actualizar pago.", "error");
    }
  };

  // 2. Confirmar Pago Total con un clic
  const handleConfirmTotalPaid = async (apt: StoredAppointment) => {
    const nextStatus = apt.status === "CANCELLED" ? "COMPLETED" : apt.status;
    const method = normalizePaymentMethod(apt.paymentMethod);

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apt.id ? { ...a, paymentStatus: "PAID", status: nextStatus, paymentMethod: method } : a
      )
    );
    try {
      await updateAppointmentPayment(apt.id, "PAID", method, undefined, nextStatus);
      await loadFinancialData();
      showFeedback(`Pago de ${apt.clientName} confirmado como Pagado Total.`, "success");
    } catch (err: any) {
      console.error(err);
      showFeedback("Error al confirmar pago.", "error");
    }
  };

  // 3. Confirmar Seña 50% con un clic
  const handleConfirmDeposit = async (apt: StoredAppointment) => {
    const nextStatus = apt.status === "CANCELLED" ? "CONFIRMED" : apt.status;
    const method = normalizePaymentMethod(apt.paymentMethod);

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apt.id ? { ...a, paymentStatus: "DEPOSIT_PAID", status: nextStatus, paymentMethod: method } : a
      )
    );
    try {
      await updateAppointmentPayment(apt.id, "DEPOSIT_PAID", method, undefined, nextStatus);
      await loadFinancialData();
      showFeedback(`Seña 50% registrada para ${apt.clientName}.`, "success");
    } catch (err: any) {
      console.error(err);
      showFeedback("Error al registrar seña.", "error");
    }
  };

  // 3b. Borrar / Anular Pago (si no se realizó correctamente o fue un error)
  const handleResetPayment = async (apt: StoredAppointment) => {
    if (
      !confirm(
        `¿Deseas BORRAR / ANULAR el cobro del turno de "${apt.clientName}"?\n\nEl estado pasará a "Sin Pago / Pendiente" ($0) y el monto se restará automáticamente de tus ingresos y balance de ganancias.`
      )
    ) {
      return;
    }

    const nextStatus = apt.status === "COMPLETED" ? "CONFIRMED" : apt.status;
    const method = normalizePaymentMethod(apt.paymentMethod);

    // Optimista
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apt.id
          ? { ...a, paymentStatus: "PENDING", status: nextStatus, paymentMethod: method }
          : a
      )
    );
    try {
      await updateAppointmentPayment(apt.id, "PENDING", method, undefined, nextStatus);
      await loadFinancialData();
      showFeedback(`Pago de "${apt.clientName}" anulado y borrado. Se restó del balance de ganancias.`, "success");
    } catch (err: any) {
      console.error(err);
      showFeedback("Error al borrar el pago.", "error");
    }
  };

  // 4. Cancelar Turno / Anular Cobro (no suma a ganancias)
  const handleCancelTurno = async (apt: StoredAppointment) => {
    if (!confirm(`¿Deseas marcar como CANCELADO el turno de "${apt.clientName}"? No sumará a las ganancias del balance.`)) {
      return;
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === apt.id ? { ...a, status: "CANCELLED", paymentStatus: "PENDING" } : a))
    );
    try {
      await updateAppointmentPayment(apt.id, "PENDING", apt.paymentMethod, undefined, "CANCELLED");
      await loadFinancialData();
      showFeedback(`Turno de ${apt.clientName} cancelado (no computará en ganancias).`, "success");
    } catch (err: any) {
      console.error(err);
      showFeedback("Error al cancelar turno.", "error");
    }
  };

  // 5. Reactivar Turno Cancelado
  const handleReactivateTurno = async (apt: StoredAppointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === apt.id ? { ...a, status: "CONFIRMED" } : a))
    );
    try {
      await updateAppointmentPayment(apt.id, apt.paymentStatus || "PENDING", apt.paymentMethod, undefined, "CONFIRMED");
      await loadFinancialData();
      showFeedback(`Turno de ${apt.clientName} reactivado.`, "success");
    } catch (err: any) {
      console.error(err);
      showFeedback("Error al reactivar turno.", "error");
    }
  };

  // 6. Eliminar Turno permanentemente de la base de datos
  const handleDeleteAppointment = async (id: string, name: string) => {
    if (!confirm(`¿Estás segura de eliminar permanentemente el turno de "${name}"? Esta acción borrará el registro de la base de datos.`)) {
      return;
    }

    setAppointments((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAppointment(id);
      await loadFinancialData();
      showFeedback(`Turno de "${name}" eliminado permanentemente.`, "success");
    } catch (err: any) {
      console.error(err);
      showFeedback("Error al eliminar turno.", "error");
    }
  };

  // 7. Abrir modal de edición de turno
  const openEditModal = (apt: StoredAppointment) => {
    setEditAptModal(apt);
    setEditClientName(apt.clientName || "");
    setEditServiceName(apt.serviceName || "");
    setEditAmount(String(apt.totalPrice || 0));
    setEditDate(apt.date && apt.date.includes("T") ? apt.date.split("T")[0] : apt.date);
    setEditTime(apt.startTime || "12:00");
    setEditStatus(apt.status || "CONFIRMED");
    setEditPaymentStatus(apt.paymentStatus || "PENDING");
    setEditPaymentMethod(normalizePaymentMethod(apt.paymentMethod));
  };

  // 8. Guardar edición de turno
  const handleSaveEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAptModal) return;

    setSavingEditApt(true);
    const parsedPrice = Number(editAmount) || 0;

    try {
      await rescheduleAppointment(editAptModal.id, {
        date: editDate,
        startTime: editTime,
        status: editStatus,
        paymentStatus: editPaymentStatus,
        totalPrice: parsedPrice,
      });

      // Actualizar método de pago si cambió
      await updateAppointmentPayment(
        editAptModal.id,
        editPaymentStatus,
        editPaymentMethod,
        undefined,
        editStatus,
        parsedPrice
      );

      setEditAptModal(null);
      await loadFinancialData();
      showFeedback("Turno actualizado correctamente.", "success");
    } catch (err: any) {
      showFeedback("Error al guardar cambios.", "error");
    } finally {
      setSavingEditApt(false);
    }
  };

  // 9. Crear nuevo cobro / turno manual desde finanzas
  const handleSaveNewPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      showFeedback("El nombre de la clienta es obligatorio.", "error");
      return;
    }

    setSavingNewPayment(true);
    try {
      const res = await createManualAppointment({
        clientName: newClientName.trim(),
        clientPhone: newClientPhone.trim() || "3510000000",
        serviceId: "kapping",
        serviceName: newServiceName.trim() || "Servicio Ágape",
        extraIds: [],
        date: newDate,
        startTime: newTime,
        totalPrice: Number(newAmount) || 0,
        status: newAppointmentStatus,
        paymentStatus: newPaymentStatus,
        paymentMethod: newPaymentMethod,
      });

      if (res.success) {
        setIsAddPaymentModalOpen(false);
        setNewClientName("");
        setNewClientPhone("");
        setNewAmount("15000");
        await loadFinancialData();
        showFeedback("Cobro / Turno registrado con éxito.", "success");
      } else {
        showFeedback(res.error || "Error al crear cobro.", "error");
      }
    } catch (err: any) {
      showFeedback(err.message, "error");
    } finally {
      setSavingNewPayment(false);
    }
  };

  // ==========================================
  // FILTRADO DE TURNOS EN CONTROL DE SEÑAS Y PAGOS
  // ==========================================
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Filtro de estado de pago / turno
      if (paymentFilter === "CANCELLED" && apt.status !== "CANCELLED") return false;
      if (paymentFilter === "PAID" && (apt.paymentStatus !== "PAID" && apt.status !== "COMPLETED")) return false;
      if (paymentFilter === "DEPOSIT" && apt.paymentStatus !== "DEPOSIT_PAID") return false;
      if (paymentFilter === "PENDING" && (apt.paymentStatus === "PAID" || apt.status === "COMPLETED" || apt.status === "CANCELLED")) return false;

      // Filtro de búsqueda
      if (searchAppointmentQuery.trim()) {
        const q = searchAppointmentQuery.toLowerCase();
        const matchName = (apt.clientName || "").toLowerCase().includes(q);
        const matchService = (apt.serviceName || "").toLowerCase().includes(q);
        const matchDate = (apt.date || "").includes(q);
        const matchPhone = (apt.clientPhone || "").includes(q);
        if (!matchName && !matchService && !matchDate && !matchPhone) return false;
      }
      return true;
    });
  }, [appointments, paymentFilter, searchAppointmentQuery]);

  // Contadores para píldoras
  const counts = useMemo(() => {
    const total = appointments.length;
    const paid = appointments.filter((a) => a.paymentStatus === "PAID" || a.status === "COMPLETED").length;
    const deposit = appointments.filter((a) => a.paymentStatus === "DEPOSIT_PAID").length;
    const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;
    const pending = appointments.filter(
      (a) => a.status !== "CANCELLED" && a.paymentStatus !== "PAID" && a.status !== "COMPLETED"
    ).length;
    return { total, paid, deposit, cancelled, pending };
  }, [appointments]);

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <AdminNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCC5A3]/40 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F0E6] text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              Gestión Financiera & Rentabilidad
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
              Ingresos, Gastos & Balance
            </h1>
            <p className="text-xs text-[#666666] font-light mt-1">
              Control total de cobros, transferencias, cancelaciones y costos para el resultado neto real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadFinancialData}
              disabled={loading}
              className="p-2.5 rounded-full bg-[#FFFFFF] border border-[#DCC5A3] text-[#2B2B2B] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
              title="Actualizar finanzas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setIsAddPaymentModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#D4AF37] text-[#2B2B2B] text-xs font-bold hover:bg-[#C29D26] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cobro / Turno</span>
            </button>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </div>

        {/* Mensaje de feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2 border animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Tarjetas Principales de Balance */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Ingresos */}
            <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#DCC5A3]/40 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-[#737373] text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Ingresos Cobrados</span>
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="font-cinzel text-2xl font-bold text-emerald-700">
                {formatPrice(summary.totalIncome)}
              </div>
              <div className="text-[11px] text-[#737373] mt-2 flex items-center justify-between">
                <span>Este mes:</span>
                <strong className="text-[#2B2B2B]">{formatPrice(summary.monthIncome)}</strong>
              </div>

              <button
                onClick={() => setIsIncomeBreakdownOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/70 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer w-full justify-center shadow-2xs"
                title="Ver lista detallada de turnos y montos cobrados"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ver de dónde son los montos</span>
              </button>
            </div>

            {/* Total Gastos */}
            <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#DCC5A3]/40 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-[#737373] text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Gastos / Inversión</span>
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="font-cinzel text-2xl font-bold text-rose-600">
                {formatPrice(summary.totalExpenses)}
              </div>
              <div className="text-[11px] text-[#737373] mt-2 flex items-center justify-between">
                <span>Este mes:</span>
                <strong className="text-[#2B2B2B]">{formatPrice(summary.monthExpenses)}</strong>
              </div>
            </div>

            {/* Resultado Neto (Ganancia) */}
            <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#DCC5A3]/40 shadow-xs relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-[#737373] text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Resultado Neto</span>
                <div className="w-7 h-7 rounded-full bg-[#F5F0E6] text-[#D4AF37] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`font-cinzel text-2xl font-bold ${
                  summary.netResult >= 0 ? "text-[#2B2B2B]" : "text-rose-600"
                }`}
              >
                {formatPrice(summary.netResult)}
              </div>
              <div className="text-[11px] text-[#737373] mt-2 flex items-center justify-between">
                <span>Mes (Ganancia):</span>
                <strong className={summary.monthResult >= 0 ? "text-emerald-700" : "text-rose-600"}>
                  {formatPrice(summary.monthResult)}
                </strong>
              </div>
            </div>

            {/* Medios de Pago */}
            <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#DCC5A3]/40 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-3 flex items-center gap-1.5">
                <PieChartIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Métodos de Pago</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#666666] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Efectivo:
                  </span>
                  <strong className="text-[#2B2B2B]">{formatPrice(summary.cashIncome)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#666666] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Transferencia:
                  </span>
                  <strong className="text-[#2B2B2B]">{formatPrice(summary.transferIncome)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desglose: Tabla de Gastos vs Control de Señas y Pagos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* COLUMNA 1: Registro de Gastos */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#DCC5A3]/40 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F5F0E6] pb-4">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                  Gastos e Insumos
                </h2>
                <p className="text-[11px] text-[#737373]">
                  Esmaltes, fresas, aparatología, packaging, mobiliario.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F0E6] text-[#2B2B2B]">
                {expenses.length} registros
              </span>
            </div>

            {expenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A3A3A3]">
                <Tag className="w-8 h-8 text-[#DCC5A3] mx-auto mb-2" />
                No hay gastos registrados todavía. Usa el botón &quot;Registrar Gasto&quot;.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DCC5A3]/30 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#DCC5A3]/40 text-[10px] font-semibold text-[#8C7A5B]">
                          {exp.categoria}
                        </span>
                        <span className="text-[11px] text-[#737373]">{exp.fecha}</span>
                      </div>
                      <div className="font-semibold text-[#2B2B2B]">{exp.descripcion}</div>
                      {exp.observaciones && (
                        <div className="text-[10px] text-[#737373] italic">
                          {exp.observaciones}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-cinzel font-bold text-rose-600 text-sm mr-1">
                        -{formatPrice(exp.monto)}
                      </span>
                      <button
                        onClick={() => openEditExpenseModal(exp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FFFFFF] border border-[#DCC5A3] text-[#2B2B2B] hover:bg-[#F5F0E6] text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                        title="Modificar este gasto si se cargó mal"
                      >
                        <Edit2 className="w-3 h-3 text-[#D4AF37]" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.descripcion)}
                        className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA 2: Control de Señas y Pagos Completo e Interactivo */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#DCC5A3]/40 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F5F0E6] pb-4">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                  Control de Señas y Pagos
                </h2>
                <p className="text-[11px] text-[#737373]">
                  Confirma transferencias, registra cobros o anula/cancela turnos.
                </p>
              </div>

              <button
                onClick={() => setIsAddPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] hover:bg-[#D4AF37] hover:text-[#2B2B2B] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Cobro</span>
              </button>
            </div>

            {/* Buscador y Filtros */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8C7A5B]" />
                <input
                  type="text"
                  placeholder="Buscar por clienta, fecha o servicio..."
                  value={searchAppointmentQuery}
                  onChange={(e) => setSearchAppointmentQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setPaymentFilter("ALL")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                    paymentFilter === "ALL"
                      ? "bg-[#2B2B2B] text-[#FFFFFF]"
                      : "bg-[#FAF8F5] border border-[#DCC5A3] text-[#2B2B2B] hover:bg-[#F5F0E6]"
                  }`}
                >
                  Todos ({counts.total})
                </button>
                <button
                  onClick={() => setPaymentFilter("PENDING")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                    paymentFilter === "PENDING"
                      ? "bg-amber-600 text-[#FFFFFF]"
                      : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  Pendientes ({counts.pending})
                </button>
                <button
                  onClick={() => setPaymentFilter("DEPOSIT")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                    paymentFilter === "DEPOSIT"
                      ? "bg-blue-600 text-[#FFFFFF]"
                      : "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100"
                  }`}
                >
                  Señas ({counts.deposit})
                </button>
                <button
                  onClick={() => setPaymentFilter("PAID")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                    paymentFilter === "PAID"
                      ? "bg-emerald-600 text-[#FFFFFF]"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  Pagados ({counts.paid})
                </button>
                <button
                  onClick={() => setPaymentFilter("CANCELLED")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                    paymentFilter === "CANCELLED"
                      ? "bg-rose-600 text-[#FFFFFF]"
                      : "bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100"
                  }`}
                >
                  Cancelados ({counts.cancelled})
                </button>
              </div>
            </div>

            {/* Listado de Turnos y Cobros */}
            {filteredAppointments.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A3A3A3]">
                <Clock className="w-8 h-8 text-[#DCC5A3] mx-auto mb-2" />
                No se encontraron turnos con los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredAppointments.map((apt) => {
                  const paymentStatus = apt.paymentStatus || "PENDING";
                  const isCancelled = apt.status === "CANCELLED";
                  const isPaid = paymentStatus === "PAID" || apt.status === "COMPLETED";
                  const isDeposit = paymentStatus === "DEPOSIT_PAID";
                  const methodVal = normalizePaymentMethod(apt.paymentMethod);

                  return (
                    <div
                      key={apt.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                        isCancelled
                          ? "bg-rose-50/40 border-rose-200 opacity-75"
                          : isPaid
                          ? "bg-emerald-50/30 border-emerald-200"
                          : isDeposit
                          ? "bg-blue-50/30 border-blue-200"
                          : "bg-[#FAF8F5] border-[#DCC5A3]/40"
                      }`}
                    >
                      {/* Fila superior: Clienta, Fecha, Estado y Monto */}
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold ${isCancelled ? "line-through text-rose-900" : "text-[#2B2B2B]"}`}>
                              {apt.clientName}
                            </span>
                            <span className="text-[11px] text-[#737373]">
                              {apt.date} · {apt.startTime} hs
                            </span>

                            {/* Badge de Estado del Turno */}
                            {isCancelled ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-bold border border-rose-300">
                                ❌ Cancelado
                              </span>
                            ) : apt.status === "COMPLETED" ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-300">
                                ✓ Asistió
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-300">
                                Confirmado
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-[#666666] mt-0.5 flex items-center gap-2">
                            <span>{apt.serviceName}</span>
                            <span>·</span>
                            <span className={`font-bold ${isCancelled ? "line-through text-[#999999]" : "text-[#2B2B2B]"}`}>
                              {formatPrice(apt.totalPrice)}
                            </span>
                            {isDeposit && !isCancelled && (
                              <span className="text-blue-700 text-[10px] font-semibold">
                                (Seña cobrada: {formatPrice(Math.round((apt.totalPrice || 0) * 0.5))})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción rápida: Editar y Borrar */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openEditModal(apt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FFFFFF] border border-[#DCC5A3] text-[#2B2B2B] hover:bg-[#F5F0E6] text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            title="Modificar clienta, servicio, precio o fecha"
                          >
                            <Edit2 className="w-3 h-3 text-[#D4AF37]" />
                            <span>Modificar</span>
                          </button>

                          <button
                            onClick={() => handleDeleteAppointment(apt.id, apt.clientName)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            title="Eliminar este turno permanentemente de la base de datos"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Borrar Turno</span>
                          </button>
                        </div>
                      </div>

                      {/* Fila inferior: Selectores de Pago y Botones Rápidos de Cobro / Cancelación */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F5F0E6]/80 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Selector de estado de pago */}
                          <select
                            value={paymentStatus}
                            onChange={(e) =>
                              handlePaymentChange(apt.id, e.target.value as any, methodVal)
                            }
                            className="px-2.5 py-1 rounded-xl border border-[#DCC5A3]/60 text-[11px] bg-[#FFFFFF] font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                          >
                            <option value="PENDING">❌ Sin Pago / Borrar Cobro ($0)</option>
                            <option value="DEPOSIT_REQUESTED">Seña solicitada ($0)</option>
                            <option value="DEPOSIT_PAID">Seña recibida (50%)</option>
                            <option value="PAID">Totalmente pagado (100%)</option>
                            <option value="AWAITING_VERIFICATION">Comprobante pendiente ($0)</option>
                          </select>

                          {/* Selector de medio de pago */}
                          <select
                            value={methodVal}
                            onChange={(e) =>
                              handlePaymentChange(apt.id, paymentStatus, e.target.value as any)
                            }
                            className="px-2 py-1 rounded-xl border border-[#DCC5A3]/60 text-[11px] bg-[#FFFFFF] text-[#666666] focus:outline-none cursor-pointer"
                          >
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="OTRO">Otro</option>
                          </select>
                        </div>

                        {/* Botones de acción rápida: Confirmar Pago / Seña / Borrar Pago / Cancelar Turno */}
                        <div className="flex items-center gap-1.5">
                          {!isPaid && !isCancelled && (
                            <button
                              onClick={() => handleConfirmTotalPaid(apt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[#FFFFFF] text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                              title="Marcar como totalmente pagado"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirmar Pago</span>
                            </button>
                          )}

                          {!isDeposit && !isPaid && !isCancelled && (
                            <button
                              onClick={() => handleConfirmDeposit(apt)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 border border-blue-300 text-blue-800 hover:bg-blue-100 text-[10px] font-semibold transition-colors cursor-pointer"
                              title="Registrar cobro de seña del 50%"
                            >
                              <span>Seña 50%</span>
                            </button>
                          )}

                          {/* Botón directo para Borrar / Anular Pago */}
                          {apt.paymentStatus !== "PENDING" && !isCancelled && (
                            <button
                              onClick={() => handleResetPayment(apt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                              title="Borrar o anular este pago si no se realizó correctamente (resta el dinero del balance)"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-700" />
                              <span>↺ Borrar Pago</span>
                            </button>
                          )}

                          {!isCancelled ? (
                            <button
                              onClick={() => handleCancelTurno(apt)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10px] font-medium transition-colors cursor-pointer"
                              title="Cancelar turno (no sumará a las ganancias)"
                            >
                              <Ban className="w-3 h-3 text-rose-600" />
                              <span>Cancelar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateTurno(apt)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-[10px] font-medium transition-colors cursor-pointer"
                              title="Reactivar turno cancelado"
                            >
                              <RotateCcw className="w-3 h-3 text-emerald-600" />
                              <span>Reactivar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MODAL 1: REGISTRAR GASTO */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#2B2B2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F0E6] mb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                    Egresos & Costos
                  </span>
                  <h2 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    Registrar Nuevo Gasto
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-sm font-bold flex items-center justify-center hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseFecha}
                    onChange={(e) => setExpenseFecha(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Categoría *
                  </label>
                  <select
                    value={expenseCategoria}
                    onChange={(e) => setExpenseCategoria(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs bg-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Materiales">Materiales (Geles, Tips, Líquidos)</option>
                    <option value="Esmaltes">Esmaltes & Colores</option>
                    <option value="Herramientas">Herramientas & Fresas</option>
                    <option value="Insumos">Insumos Descartables (Algodón, Guantes)</option>
                    <option value="Mobiliario">Mobiliario & Lámparas</option>
                    <option value="Publicidad">Publicidad / Redes Sociales</option>
                    <option value="Packaging">Packaging & Regalos</option>
                    <option value="Otros">Otros Gastos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Reposición de geles y top coat"
                    value={expenseDescripcion}
                    onChange={(e) => setExpenseDescripcion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Monto ($ ARS) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ej: 15000"
                    value={expenseMonto}
                    onChange={(e) => setExpenseMonto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Observaciones (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Comprado en distribuidora X, factura #..."
                    value={expenseObservaciones}
                    onChange={(e) => setExpenseObservaciones(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F5F0E6]">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-xs font-semibold hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingExpense}
                    className="px-5 py-2 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {savingExpense ? "Guardando..." : "Guardar Gasto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: AGREGAR COBRO / TURNO MANUAL DESDE FINANZAS */}
        {isAddPaymentModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#2B2B2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F0E6] mb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                    Ingresos & Cobros
                  </span>
                  <h2 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    Registrar Cobro / Turno
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-sm font-bold flex items-center justify-center hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNewPayment} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Nombre de la Clienta *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Micaela Gómez"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Teléfono WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej: 3515580382"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Servicio / Concepto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Kapping Gel / Esmaltado"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Monto Total ($) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[#737373] font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        required
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Fecha *</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Hora *</label>
                    <input
                      type="time"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Estado de Pago *
                    </label>
                    <select
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] font-medium"
                    >
                      <option value="PAID">Pagado Total</option>
                      <option value="DEPOSIT_PAID">Seña Recibida (50%)</option>
                      <option value="PENDING">Sin Seña / Pendiente</option>
                      <option value="AWAITING_VERIFICATION">A Verificar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Medio de Pago *
                    </label>
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] font-medium"
                    >
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Estado del Turno
                    </label>
                    <select
                      value={newAppointmentStatus}
                      onChange={(e) => setNewAppointmentStatus(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] font-medium"
                    >
                      <option value="COMPLETED">Asistió / Realizado</option>
                      <option value="CONFIRMED">Confirmado</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F5F0E6]">
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentModalOpen(false)}
                    className="px-4 py-2 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-xs font-semibold hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingNewPayment}
                    className="px-5 py-2 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {savingNewPayment ? "Guardando..." : "Registrar Cobro"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: EDITAR TURNO / COBRO EXISTENTE */}
        {editAptModal && (
          <div className="fixed inset-0 z-50 bg-[#2B2B2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F0E6] mb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                    Modificar Registro
                  </span>
                  <h2 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    Editar Turno / Cobro
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAptModal(null)}
                  className="w-8 h-8 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-sm font-bold flex items-center justify-center hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditAppointment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Nombre de la Clienta
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editClientName}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] opacity-75 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Fecha</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">Hora</label>
                    <input
                      type="time"
                      required
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Precio Total Cobrado ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#737373] font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] font-bold text-[#2B2B2B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Estado del Turno
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] font-semibold"
                    >
                      <option value="CONFIRMED">🟡 Confirmado</option>
                      <option value="COMPLETED">🟢 Asistió / Realizado</option>
                      <option value="CANCELLED">🔴 Cancelado (Sin ganancia)</option>
                      <option value="NO_SHOW">⚪ No Asistió</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#2B2B2B] mb-1">
                      Estado de Pago
                    </label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] font-semibold"
                    >
                      <option value="PENDING">❌ Sin Seña / Borrar Cobro ($0)</option>
                      <option value="DEPOSIT_REQUESTED">Seña solicitada ($0)</option>
                      <option value="DEPOSIT_PAID">Seña recibida (50%)</option>
                      <option value="PAID">Pagado Total (100%)</option>
                      <option value="AWAITING_VERIFICATION">A Verificar ($0)</option>
                    </select>
                  </div>
                </div>

                {/* Acción rápida para anular o borrar cobro de este turno */}
                {editPaymentStatus !== "PENDING" && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-amber-900 text-xs">¿El pago fue erróneo o no se acreditó?</p>
                      <p className="text-[10px] text-amber-700 leading-tight">Puedes anular el pago para que el turno vuelva a $0 y se descuente de las ganancias.</p>
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

                <div>
                  <label className="block font-semibold text-[#2B2B2B] mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#DCC5A3]/60 bg-[#FAF8F5] font-semibold"
                  >
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#F5F0E6]">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `¿Estás segura de eliminar permanentemente el turno de "${editClientName}"?\n\nEsta acción borrará el registro de la base de datos y no computará en estadísticas ni finanzas.`
                        )
                      ) {
                        handleDeleteAppointment(editAptModal.id, editClientName);
                        setEditAptModal(null);
                      }
                    }}
                    className="px-3 py-2 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Eliminar Turno</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditAptModal(null)}
                      className="px-4 py-2 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-xs font-semibold hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingEditApt}
                      className="px-5 py-2 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {savingEditApt ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: EDITAR GASTO EXISTENTE */}
        {editExpenseModal && (
          <div className="fixed inset-0 z-50 bg-[#2B2B2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F0E6] mb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                    Modificar Costo / Gasto
                  </span>
                  <h2 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    Editar Gasto
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditExpenseModal(null)}
                  className="w-8 h-8 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-sm font-bold flex items-center justify-center hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    required
                    value={editExpFecha}
                    onChange={(e) => setEditExpFecha(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Categoría *
                  </label>
                  <select
                    value={editExpCategoria}
                    onChange={(e) => setEditExpCategoria(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs bg-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Materiales">Materiales (Geles, Tips, Líquidos)</option>
                    <option value="Esmaltes">Esmaltes & Colores</option>
                    <option value="Herramientas">Herramientas & Fresas</option>
                    <option value="Insumos">Insumos Descartables (Algodón, Guantes)</option>
                    <option value="Mobiliario">Mobiliario & Lámparas</option>
                    <option value="Publicidad">Publicidad / Redes Sociales</option>
                    <option value="Alquiler/Servicios">Alquiler o Servicios (Luz, Internet)</option>
                    <option value="Otros">Otros Egresos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Descripción del Gasto *
                  </label>
                  <input
                    type="text"
                    required
                    value={editExpDescripcion}
                    onChange={(e) => setEditExpDescripcion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Monto Abonado ($) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    required
                    value={editExpMonto}
                    onChange={(e) => setEditExpMonto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs font-bold text-[#2B2B2B] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Observaciones (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editExpObservaciones}
                    onChange={(e) => setEditExpObservaciones(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#F5F0E6]">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar permanentemente el gasto "${editExpDescripcion}"?`)) {
                        handleDeleteExpense(editExpenseModal.id, editExpDescripcion);
                        setEditExpenseModal(null);
                      }
                    }}
                    className="px-3 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Gasto</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditExpenseModal(null)}
                      className="px-4 py-2 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-xs font-semibold hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingEditExpense}
                      className="px-5 py-2 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {savingEditExpense ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: DESGLOSE DE INGRESOS COBRADOS */}
        {isIncomeBreakdownOpen && (
          <div className="fixed inset-0 z-50 bg-[#2B2B2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F0E6] mb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                    Transparencia & Detalle
                  </span>
                  <h2 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    ¿De dónde son los {formatPrice(summary?.totalIncome || 0)}?
                  </h2>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Detalle turno por turno de los cobros computados en el balance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIncomeBreakdownOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-sm font-bold flex items-center justify-center hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {(!summary?.incomeBreakdown || summary.incomeBreakdown.length === 0) ? (
                <div className="py-10 text-center text-xs text-[#737373] space-y-2">
                  <Clock className="w-10 h-10 text-[#DCC5A3] mx-auto opacity-60" />
                  <p className="font-bold text-[#2B2B2B] text-sm">No hay cobros acreditados todavía ($0)</p>
                  <p className="text-[11px] text-[#888888] max-w-sm mx-auto leading-relaxed">
                    Los turnos en estado &quot;Pendiente&quot; no suman dinero a tus ingresos hasta que hagas clic en &quot;Confirmar Pago&quot; o &quot;Seña 50%&quot; en el panel de control.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-[#737373] flex justify-between items-center">
                    <span>{summary.incomeBreakdown.length} cobro(s) registrado(s)</span>
                    <span className="text-emerald-700 font-bold">Total: {formatPrice(summary.totalIncome)}</span>
                  </div>

                  <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {summary.incomeBreakdown.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DCC5A3]/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#2B2B2B] flex items-center gap-2 flex-wrap">
                            <span>{item.clientName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                              {item.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#737373] mt-0.5">
                            {item.serviceName} · {item.date} {item.startTime} hs
                          </div>
                          <div className="text-[10px] text-[#8C7A5B] font-medium">
                            Medio: {item.paymentMethod}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-cinzel text-base font-bold text-emerald-700">
                            +{formatPrice(item.collectedAmount)}
                          </div>
                          {item.type === "Seña 50%" && (
                            <div className="text-[10px] text-[#737373]">
                              (Total serv: {formatPrice(item.totalPrice)})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#F5F0E6] flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsIncomeBreakdownOpen(false)}
                  className="px-5 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors cursor-pointer shadow-xs"
                >
                  Entendido / Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
