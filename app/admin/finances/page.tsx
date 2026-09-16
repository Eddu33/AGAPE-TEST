"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import {
  getFinancialSummary,
  getAdminExpenses,
  saveAdminExpense,
  deleteAdminExpense,
  getAdminAppointments,
  updateAppointmentPayment,
} from "../actions";
import { Expense, StoredAppointment } from "@/lib/db";
import { formatPrice } from "@/lib/services";
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
} from "lucide-react";

export default function AdminFinancesPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [appointments, setAppointments] = useState<StoredAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para agregar gasto
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseFecha, setExpenseFecha] = useState(new Date().toISOString().split("T")[0]);
  const [expenseCategoria, setExpenseCategoria] = useState<Expense["categoria"]>("Materiales");
  const [expenseDescripcion, setExpenseDescripcion] = useState("");
  const [expenseMonto, setExpenseMonto] = useState("");
  const [expenseObservaciones, setExpenseObservaciones] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);
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

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDescripcion.trim() || !expenseMonto) {
      setFeedback({ text: "La descripción y el monto son obligatorios.", type: "error" });
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
        setFeedback({ text: "Gasto registrado correctamente.", type: "success" });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ text: res.error || "Error al registrar gasto.", type: "error" });
      }
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (!confirm(`¿Eliminar el gasto "${desc}"?`)) return;
    try {
      await deleteAdminExpense(id);
      await loadFinancialData();
      setFeedback({ text: "Gasto eliminado.", type: "success" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handlePaymentStatusChange = async (
    aptId: string,
    status: StoredAppointment["paymentStatus"],
    method?: StoredAppointment["paymentMethod"]
  ) => {
    try {
      await updateAppointmentPayment(aptId, status, method);
      await loadFinancialData();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
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
              Consulta cuánto dinero ingresa, registra tus costos de materiales y calcula el resultado real de tu emprendimiento.
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
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </div>

        {/* Mensaje de feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
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

        {/* Desglose: Tabla de Gastos vs Estado de Pagos de Turnos */}
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
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
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

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-cinzel font-bold text-rose-600 text-sm">
                        -{formatPrice(exp.monto)}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.descripcion)}
                        className="p-1.5 rounded-full hover:bg-rose-50 text-[#A3A3A3] hover:text-rose-600 transition-colors cursor-pointer"
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

          {/* COLUMNA 2: Estados de Pago de Turnos */}
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#DCC5A3]/40 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F5F0E6] pb-4">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                  Control de Señas y Pagos
                </h2>
                <p className="text-[11px] text-[#737373]">
                  Confirma transferencias y gestiona el cobro de cada turno.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F0E6] text-[#2B2B2B]">
                Últimos turnos
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A3A3A3]">
                <Clock className="w-8 h-8 text-[#DCC5A3] mx-auto mb-2" />
                No hay turnos registrados en la base de datos.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {appointments.slice(0, 10).map((apt) => {
                  const paymentStatus = apt.paymentStatus || "PENDING";
                  return (
                    <div
                      key={apt.id}
                      className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DCC5A3]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#2B2B2B]">{apt.clientName}</span>
                          <span className="text-[10px] text-[#737373]">
                            {apt.date} · {apt.startTime} hs
                          </span>
                        </div>
                        <div className="text-[11px] text-[#666666]">
                          {apt.serviceName} · {formatPrice(apt.totalPrice)}
                        </div>
                      </div>

                      {/* Selector de estado de pago */}
                      <div className="flex items-center gap-2">
                        <select
                          value={paymentStatus}
                          onChange={(e) =>
                            handlePaymentStatusChange(
                              apt.id,
                              e.target.value as any,
                              apt.paymentMethod || "TRANSFERENCIA"
                            )
                          }
                          className="px-2.5 py-1 rounded-xl border border-[#DCC5A3]/60 text-[11px] bg-[#FFFFFF] font-medium focus:outline-none focus:border-[#D4AF37]"
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="DEPOSIT_REQUESTED">Seña solicitada</option>
                          <option value="DEPOSIT_PAID">Seña recibida (50%)</option>
                          <option value="PAID">Totalmente pagado</option>
                          <option value="AWAITING_VERIFICATION">Comprobante pendiente</option>
                        </select>

                        <select
                          value={apt.paymentMethod || "TRANSFERENCIA"}
                          onChange={(e) =>
                            handlePaymentStatusChange(
                              apt.id,
                              paymentStatus,
                              e.target.value as any
                            )
                          }
                          className="px-2 py-1 rounded-xl border border-[#DCC5A3]/60 text-[11px] bg-[#FFFFFF] text-[#666666] focus:outline-none"
                        >
                          <option value="TRANSFERENCIA">Transferencia</option>
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal para Registrar Gasto */}
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
      </main>
    </div>
  );
}
