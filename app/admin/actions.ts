"use server";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import {
  getDatabaseAsync as getDatabase,
  saveDatabaseAsync as saveDatabase,
  StoredAppointment,
  StoredClient,
  DynamicService,
  Expense,
  Promotion,
  Voucher,
  MessageTemplate,
  INITIAL_SERVICES,
} from "@/lib/db";
import { BlockedTime, formatDateKey, timeStringToMinutes } from "@/lib/availability";
import { SERVICIOS_AGAPE, EXTRAS_AGAPE, calculateTotalDuration, calculateTotalPrice } from "@/lib/services";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export interface DashboardStats {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  totalRevenue: number;
  pendingRevenue: number;
  payments?: {
    cash: number;
    transfer: number;
  };
  popularServices?: {
    name: string;
    count: number;
    revenue: number;
  }[];
}

/**
 * Obtiene todos los turnos del sistema ordenados por fecha y hora
 */
export async function getAdminAppointments(): Promise<StoredAppointment[]> {
  try {
    const db = await getDatabase();
    return (db.appointments || []).map((a) => {
      const cleanDate = a.date && a.date.includes("T") ? a.date.split("T")[0] : a.date;
      const client = db.clients?.find((c) => c.id === a.clientId);
      return {
        ...a,
        date: cleanDate || a.date,
        clientName: a.clientName || client?.name || "Clienta",
        clientPhone: a.clientPhone || client?.phone || "",
        serviceName: a.serviceName || "Servicio Ágape",
        totalPrice: typeof a.totalPrice === "number" ? a.totalPrice : 0,
        startTime: a.startTime || "10:00",
        endTime: a.endTime || "11:00",
        durationMinutes: a.durationMinutes || 60,
      };
    }).sort((a, b) => {
      const dateDiff = (a.date || "").localeCompare(b.date || "");
      if (dateDiff !== 0) return dateDiff;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
  } catch (error) {
    console.error("Error al obtener turnos de administración:", error);
    return [];
  }
}

/**
 * Obtiene los bloqueos manuales de horario
 */
export async function getAdminBlockedTimes(): Promise<BlockedTime[]> {
  try {
    const db = await getDatabase();
    return db.blockedTimes || [];
  } catch (error) {
    console.error("Error al obtener bloqueos:", error);
    return [];
  }
}

/**
 * Actualiza el estado de un turno (CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
 */
export async function updateAppointmentStatus(id: string, status: StoredAppointment["status"]) {
  try {
    const db = await getDatabase();
    const apt = db.appointments.find((a) => a.id === id);
    if (apt) {
      apt.status = status;
      apt.updatedAt = new Date().toISOString();
      await saveDatabase(db);
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/stats");
      revalidatePath("/admin/finances");
      return { success: true };
    }
    return { success: false, error: "Turno no encontrado" };
  } catch (error: any) {
    console.error("Error al actualizar estado del turno:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Elimina un turno permanentemente
 */
export async function deleteAppointment(id: string) {
  try {
    const db = await getDatabase();
    db.appointments = db.appointments.filter((a) => a.id !== id);
    await saveDatabase(db);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/stats");
    revalidatePath("/admin/finances");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar turno:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza el estado de pago o seña de un turno
 */
export async function updateAppointmentPaymentStatus(
  id: string,
  paymentStatus: StoredAppointment["paymentStatus"],
  paymentMethod?: StoredAppointment["paymentMethod"]
) {
  try {
    const db = await getDatabase();
    const apt = db.appointments.find((a) => a.id === id);
    if (apt) {
      apt.paymentStatus = paymentStatus;
      if (paymentMethod) apt.paymentMethod = paymentMethod;
      apt.updatedAt = new Date().toISOString();
      await saveDatabase(db);
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/stats");
      revalidatePath("/admin/finances");
      return { success: true };
    }
    return { success: false, error: "Turno no encontrado" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Permite reagendar o modificar fecha/hora/estado de un turno
 */
export async function rescheduleAppointment(
  id: string,
  data: {
    date: string;
    startTime: string;
    status?: StoredAppointment["status"];
    paymentStatus?: StoredAppointment["paymentStatus"];
    totalPrice?: number;
    notes?: string;
  }
) {
  try {
    const db = await getDatabase();
    const apt = db.appointments.find((a) => a.id === id);
    if (!apt) return { success: false, error: "Turno no encontrado" };

    const startMinutes = timeStringToMinutes(data.startTime);
    const endMinutes = startMinutes + (apt.durationMinutes || 60);
    const hours = Math.floor(endMinutes / 60).toString().padStart(2, "0");
    const minutes = (endMinutes % 60).toString().padStart(2, "0");

    apt.date = data.date;
    apt.startTime = data.startTime;
    apt.endTime = `${hours}:${minutes}`;
    if (data.status) apt.status = data.status;
    if (data.paymentStatus) apt.paymentStatus = data.paymentStatus;
    if (data.totalPrice !== undefined) apt.totalPrice = Number(data.totalPrice);
    if (data.notes !== undefined) apt.notes = data.notes;
    apt.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/finances");
    revalidatePath("/admin/stats");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


/**
 * Permite a la manicurista crear un turno manual desde el panel
 */
export async function createManualAppointment(data: {
  clientName: string;
  clientPhone: string;
  serviceId?: string;
  serviceName?: string;
  extraIds?: string[];
  date: string; // "YYYY-MM-DD"
  startTime: string; // "15:00"
  totalPrice?: number;
  status?: StoredAppointment["status"];
  paymentStatus?: StoredAppointment["paymentStatus"];
  paymentMethod?: StoredAppointment["paymentMethod"];
  notes?: string;
}) {
  try {
    const db = await getDatabase();
    const service = SERVICIOS_AGAPE.find((s) => s.id === data.serviceId) || SERVICIOS_AGAPE[0];
    const extras = EXTRAS_AGAPE.filter((e) => (data.extraIds || []).includes(e.id));

    const totalDuration = calculateTotalDuration(service, extras);
    const calculatedPrice = calculateTotalPrice(service, extras);
    const finalPrice = data.totalPrice !== undefined ? Number(data.totalPrice) : calculatedPrice;

    const startMinutes = timeStringToMinutes(data.startTime);
    const endMinutes = startMinutes + totalDuration;
    const hours = Math.floor(endMinutes / 60).toString().padStart(2, "0");
    const minutes = (endMinutes % 60).toString().padStart(2, "0");
    const endTime = `${hours}:${minutes}`;

    let client = db.clients.find((c) => c.phone.trim() === data.clientPhone.trim());
    if (!client) {
      client = {
        id: randomUUID(),
        name: data.clientName.trim(),
        phone: data.clientPhone.trim(),
        category: "Nueva",
        createdAt: new Date().toISOString(),
      };
      db.clients.push(client);
    }

    const newApt: StoredAppointment = {
      id: randomUUID(),
      clientId: client.id,
      clientName: data.clientName.trim(),
      clientPhone: data.clientPhone.trim(),
      serviceId: data.serviceId || service.id,
      serviceName: data.serviceName || service.nombre,
      extraIds: extras.map((e) => e.id),
      extraNames: extras.map((e) => e.nombre),
      date: data.date,
      startTime: data.startTime,
      endTime,
      durationMinutes: totalDuration,
      totalPrice: finalPrice,
      status: data.status || "CONFIRMED",
      paymentStatus: data.paymentStatus || "PENDING",
      paymentMethod: data.paymentMethod || "TRANSFERENCIA",
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.appointments.push(newApt);
    await saveDatabase(db);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/finances");
    revalidatePath("/admin/stats");
    return { success: true, appointmentId: newApt.id };
  } catch (error: any) {
    console.error("Error creando turno manual:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Agrega un bloqueo de horario personal en la agenda
 */
export async function addScheduleBlock(data: {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  try {
    const db = await getDatabase();
    const newBlock: BlockedTime = {
      id: randomUUID(),
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason || "Bloqueo personal",
    };
    db.blockedTimes.push(newBlock);
    await saveDatabase(db);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error al agregar bloqueo:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Elimina un bloqueo de horario
 */
export async function removeScheduleBlock(id: string) {
  try {
    const db = await getDatabase();
    db.blockedTimes = db.blockedTimes.filter((b) => b.id !== id);
    await saveDatabase(db);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar bloqueo:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Métricas para el panel de administración
 */
export async function getAdminStats(): Promise<DashboardStats> {
  try {
    const db = await getDatabase();
    const apts = db.appointments || [];
    const total = apts.length;
    const confirmed = apts.filter((a) => a.status === "CONFIRMED").length;
    const completed = apts.filter((a) => a.status === "COMPLETED").length;
    const cancelled = apts.filter((a) => a.status === "CANCELLED").length;
    const noShow = apts.filter((a) => a.status === "NO_SHOW").length;

    const getCollectedStat = (a: StoredAppointment) => {
      if (a.status === "CANCELLED") return 0;
      if (
        a.paymentStatus === "PENDING" ||
        a.paymentStatus === "DEPOSIT_REQUESTED" ||
        a.paymentStatus === "AWAITING_VERIFICATION"
      ) {
        return 0;
      }
      const price = Number(a.totalPrice) || 0;
      if (a.paymentStatus === "PAID") {
        return price;
      }
      if (a.paymentStatus === "DEPOSIT_PAID") {
        return Math.round(price * 0.5);
      }
      return 0;
    };

    const totalRevenue = apts.reduce((sum, a) => sum + getCollectedStat(a), 0);

    const pendingRevenue = apts
      .filter((a) => a.status !== "CANCELLED" && a.paymentStatus !== "PAID")
      .reduce((sum, a) => {
        const p = Number(a.totalPrice) || 0;
        if (a.paymentStatus === "DEPOSIT_PAID") return sum + Math.round(p * 0.5);
        return sum + p;
      }, 0);

    // Servicios populares
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    apts.forEach((apt) => {
      const name = apt.serviceName || "Servicio";
      const existing = serviceMap.get(name) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += Number(apt.totalPrice) || 0;
      serviceMap.set(name, existing);
    });

    const popularServices = Array.from(serviceMap.entries())
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      confirmed,
      completed,
      cancelled,
      noShow,
      totalRevenue,
      pendingRevenue,
      payments: {
        cash: Math.round(totalRevenue * 0.4), // Proporción aproximada
        transfer: Math.round(totalRevenue * 0.6),
      },
      popularServices,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return {
      total: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      payments: { cash: 0, transfer: 0 },
      popularServices: [],
    };
  }
}

/**
 * Alias de compatibilidad para getAdminStats
 */
export const getStats = getAdminStats;

// ==========================================
// 1. GESTIÓN DE SERVICIOS DINÁMICOS
// ==========================================

export async function getAdminServices(): Promise<DynamicService[]> {
  try {
    const db = await getDatabase();
    return db.services && db.services.length > 0 ? db.services : INITIAL_SERVICES;
  } catch (error) {
    console.error("Error al obtener servicios de administración:", error);
    return INITIAL_SERVICES;
  }
}

export async function saveAdminService(data: Partial<DynamicService>): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    db.services = db.services && db.services.length > 0 ? db.services : [...INITIAL_SERVICES];

    if (data.id) {
      // Editar existente
      const index = db.services.findIndex((s) => s.id === data.id);
      if (index !== -1) {
        db.services[index] = {
          ...db.services[index],
          ...data,
        } as DynamicService;
      } else {
        db.services.push({
          id: data.id,
          nombre: data.nombre || "Nuevo Servicio",
          categoria: data.categoria || "Manicura",
          precio: Number(data.precio) || 0,
          duracion: Number(data.duracion) || 60,
          mantenimientoDias: Number(data.mantenimientoDias) || 21,
          descripcion: data.descripcion || "",
          imagenUrl: data.imagenUrl || "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
          queIncluye: data.queIncluye || [],
          queNoIncluye: data.queNoIncluye || [],
          garantia: data.garantia || "5 días de garantía.",
          instrucciones: data.instrucciones || "Asistir con uñas limpias.",
          activo: data.activo !== undefined ? data.activo : true,
          destacado: data.destacado || false,
        });
      }
    } else {
      // Crear nuevo
      const newService: DynamicService = {
        id: randomUUID(),
        nombre: data.nombre || "Nuevo Servicio",
        categoria: data.categoria || "Manicura",
        precio: Number(data.precio) || 0,
        duracion: Number(data.duracion) || 60,
        mantenimientoDias: Number(data.mantenimientoDias) || 21,
        descripcion: data.descripcion || "",
        imagenUrl: data.imagenUrl || "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
        queIncluye: data.queIncluye || [],
        queNoIncluye: data.queNoIncluye || [],
        garantia: data.garantia || "5 días de garantía.",
        instrucciones: data.instrucciones || "Asistir con uñas limpias.",
        activo: data.activo !== undefined ? data.activo : true,
        destacado: data.destacado || false,
      };
      db.services.push(newService);
    }

    await saveDatabase(db);
    revalidatePath("/admin/services");
    revalidatePath("/servicios");
    revalidatePath("/book");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error al guardar servicio:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAdminService(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    if (!db.services) return { success: true };
    db.services = db.services.filter((s) => s.id !== id);
    await saveDatabase(db);
    revalidatePath("/admin/services");
    revalidatePath("/servicios");
    revalidatePath("/book");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleServiceStatus(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const service = (db.services || INITIAL_SERVICES).find((s) => s.id === id);
    if (service) {
      service.activo = !service.activo;
      await saveDatabase(db);
      revalidatePath("/admin/services");
      revalidatePath("/servicios");
      return { success: true };
    }
    return { success: false, error: "Servicio no encontrado" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 2. FINANZAS: GASTOS, INGRESOS Y RESULTADO
// ==========================================

export async function getAdminExpenses(): Promise<Expense[]> {
  try {
    const db = await getDatabase();
    return (db.expenses || []).sort((a, b) => b.fecha.localeCompare(a.fecha));
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return [];
  }
}

export async function saveAdminExpense(data: Omit<Expense, "id" | "createdAt">): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    db.expenses = db.expenses || [];
    const newExpense: Expense = {
      id: randomUUID(),
      fecha: data.fecha,
      categoria: data.categoria,
      descripcion: data.descripcion,
      monto: Number(data.monto),
      observaciones: data.observaciones,
      createdAt: new Date().toISOString(),
    };
    db.expenses.push(newExpense);
    await saveDatabase(db);
    revalidatePath("/admin/finances");
    revalidatePath("/admin/stats");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminExpense(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    db.expenses = (db.expenses || []).filter((e) => e.id !== id);
    await saveDatabase(db);
    revalidatePath("/admin/finances");
    revalidatePath("/admin/stats");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAdminExpense(
  id: string,
  data: {
    fecha: string;
    categoria: Expense["categoria"];
    descripcion: string;
    monto: number;
    observaciones?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const exp = (db.expenses || []).find((e) => e.id === id);
    if (exp) {
      exp.fecha = data.fecha;
      exp.categoria = data.categoria;
      exp.descripcion = data.descripcion;
      exp.monto = Number(data.monto);
      exp.observaciones = data.observaciones || "";
      await saveDatabase(db);
      revalidatePath("/admin/finances");
      revalidatePath("/admin/stats");
      return { success: true };
    }
    return { success: false, error: "Gasto no encontrado" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFinancialSummary() {
  try {
    const db = await getDatabase();
    const todayStr = formatDateKey(new Date());
    const currentMonth = todayStr.substring(0, 7); // "YYYY-MM"

    // Calcular inicio de semana (lunes)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const mondayStr = formatDateKey(monday);

    // Turnos válidos para cobro (excluye cancelados y pagos borrados/pendientes)
    const getCollected = (a: StoredAppointment) => {
      if (a.status === "CANCELLED") return 0; // Turno cancelado no genera ingreso
      // Si el pago no está explícitamente confirmado como PAID o DEPOSIT_PAID, es 0
      const price = Number(a.totalPrice) || 0;
      if (a.paymentStatus === "PAID") {
        return price;
      }
      if (a.paymentStatus === "DEPOSIT_PAID") {
        return Math.round(price * 0.5);
      }
      return 0;
    };

    const apts = (db.appointments || []).map((a) => {
      const cleanDate = a.date && a.date.includes("T") ? a.date.split("T")[0] : a.date;
      return { ...a, date: cleanDate };
    });

    const incomeApts = apts.filter((a) => getCollected(a) > 0);

    const totalIncome = incomeApts.reduce((sum, a) => sum + getCollected(a), 0);
    const todayIncome = incomeApts.filter((a) => a.date === todayStr).reduce((sum, a) => sum + getCollected(a), 0);
    const weekIncome = incomeApts.filter((a) => a.date >= mondayStr).reduce((sum, a) => sum + getCollected(a), 0);
    const monthIncome = incomeApts.filter((a) => a.date.startsWith(currentMonth)).reduce((sum, a) => sum + getCollected(a), 0);

    const expenses = db.expenses || [];
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.monto) || 0), 0);
    const monthExpenses = expenses.filter((e) => (e.fecha || "").startsWith(currentMonth)).reduce((sum, e) => sum + (Number(e.monto) || 0), 0);

    const cashIncome = incomeApts
      .filter((a) => a.paymentMethod === "EFECTIVO" || a.paymentMethod === ("CASH" as any))
      .reduce((sum, a) => sum + getCollected(a), 0);
    const transferIncome = incomeApts
      .filter((a) => a.paymentMethod === "TRANSFERENCIA" || a.paymentMethod === ("TRANSFER" as any) || !a.paymentMethod)
      .reduce((sum, a) => sum + getCollected(a), 0);

    const netResult = totalIncome - totalExpenses;
    const monthResult = monthIncome - monthExpenses;

    const incomeBreakdown = incomeApts.map((a) => {
      const client = db.clients?.find((c) => c.id === a.clientId);
      const isDeposit = a.paymentStatus === "DEPOSIT_PAID";
      return {
        id: a.id,
        clientName: a.clientName || client?.name || "Clienta",
        serviceName: a.serviceName || "Servicio Ágape",
        date: a.date,
        startTime: a.startTime || "10:00",
        paymentStatus: a.paymentStatus || "PAID",
        paymentMethod: a.paymentMethod || "TRANSFERENCIA",
        totalPrice: Number(a.totalPrice) || 0,
        collectedAmount: getCollected(a),
        type: isDeposit ? "Seña 50%" : "Pago Total 100%",
      };
    });

    return {
      totalIncome,
      todayIncome,
      weekIncome,
      monthIncome,
      totalExpenses,
      monthExpenses,
      netResult,
      monthResult,
      cashIncome,
      transferIncome,
      appointmentsCount: incomeApts.length,
      incomeBreakdown,
    };
  } catch (error) {
    console.error("Error calculando balance financiero:", error);
    return {
      totalIncome: 0,
      todayIncome: 0,
      weekIncome: 0,
      monthIncome: 0,
      totalExpenses: 0,
      monthExpenses: 0,
      netResult: 0,
      monthResult: 0,
      cashIncome: 0,
      transferIncome: 0,
      appointmentsCount: 0,
      incomeBreakdown: [],
    };
  }
}

// ==========================================
// 3. PAGOS, SEÑAS Y REPROGRAMACIÓN DE TURNOS
// ==========================================

export async function updateAppointmentPayment(
  id: string,
  paymentStatus: StoredAppointment["paymentStatus"],
  paymentMethod?: StoredAppointment["paymentMethod"],
  paymentReceipt?: string,
  status?: StoredAppointment["status"],
  totalPrice?: number
) {
  try {
    const db = await getDatabase();
    const apt = db.appointments.find((a) => a.id === id);
    if (apt) {
      apt.paymentStatus = paymentStatus;
      if (paymentMethod) {
        apt.paymentMethod = paymentMethod === ("CASH" as any) ? "EFECTIVO" : paymentMethod === ("TRANSFER" as any) ? "TRANSFERENCIA" : paymentMethod;
      }
      if (paymentReceipt !== undefined) apt.paymentReceipt = paymentReceipt;
      if (status !== undefined) apt.status = status;
      if (totalPrice !== undefined) apt.totalPrice = Number(totalPrice);
      apt.updatedAt = new Date().toISOString();
      await saveDatabase(db);
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/finances");
      revalidatePath("/admin/stats");
      return { success: true };
    }
    return { success: false, error: "Turno no encontrado" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rescheduleAdminAppointment(
  id: string,
  newDate: string,
  newStartTime: string
) {
  try {
    const db = await getDatabase();
    const apt = db.appointments.find((a) => a.id === id);
    if (!apt) return { success: false, error: "Turno no encontrado" };

    const startMinutes = timeStringToMinutes(newStartTime);
    const endMinutes = startMinutes + apt.durationMinutes;
    const hours = Math.floor(endMinutes / 60).toString().padStart(2, "0");
    const minutes = (endMinutes % 60).toString().padStart(2, "0");

    apt.date = newDate;
    apt.startTime = newStartTime;
    apt.endTime = `${hours}:${minutes}`;
    apt.updatedAt = new Date().toISOString();

    await saveDatabase(db);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 4. CLIENTAS, CUMPLEAÑOS Y CLIENTAS INACTIVAS
// ==========================================

export async function getAdminClientsEnhanced() {
  try {
    const today = new Date();
    const todayStr = formatDateKey(today);

    const clients = await prisma.client.findMany({
      include: {
        appointments: true,
      },
    });

    return clients.map((client) => {
      const completed = client.appointments.filter((a) => a.status === "COMPLETED");
      const sortedApts = [...client.appointments].sort((a, b) => b.date.localeCompare(a.date));
      const lastApt = sortedApts[0];

      let daysSinceLastVisit: number | undefined = undefined;
      if (lastApt) {
        const lastDate = new Date(lastApt.date);
        const diffMs = today.getTime() - lastDate.getTime();
        daysSinceLastVisit = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      let isBirthdaySoon = false;
      if (client.birthday) {
        let bMonth = 0;
        let bDay = 0;
        if (client.birthday.includes("-")) {
          const parts = client.birthday.split("-");
          bMonth = parseInt(parts[1], 10) - 1;
          bDay = parseInt(parts[2], 10);
        } else if (client.birthday.includes("/")) {
          const parts = client.birthday.split("/");
          bDay = parseInt(parts[0], 10);
          bMonth = parseInt(parts[1], 10) - 1;
        }

        if (bDay > 0) {
          const bDateThisYear = new Date(today.getFullYear(), bMonth, bDay);
          const diffDays = Math.ceil((bDateThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 15) {
            isBirthdaySoon = true;
          }
        }
      }

      return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        category: client.category as "Nueva" | "Recurrente" | "Frecuente" | "VIP" | undefined,
        birthday: client.birthday || undefined,
        notes: client.notes || undefined,
        createdAt: client.createdAt.toISOString(),
        totalVisits: client.totalVisits,
        technicalRecord: client.technicalRecord || undefined,
        appointmentsCount: client.appointments.length,
        completedCount: completed.length,
        lastVisit: lastApt?.date,
        lastService: lastApt?.serviceName,
        daysSinceLastVisit,
        isBirthdaySoon,
      };
    });
  } catch (error) {
    console.error("Error obteniendo clientas desde Prisma:", error);
    return [];
  }
}


export async function updateClientDetails(
  id: string,
  data: {
    name?: string;
    phone?: string;
    birthday?: string;
    category?: string;
    notes?: string;
  }
) {
  try {
    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.phone) updateData.phone = data.phone.trim();
    if (data.birthday !== undefined) updateData.birthday = data.birthday.trim() || null;
    if (data.category) updateData.category = data.category;
    if (data.notes !== undefined) updateData.notes = data.notes.trim() || null;

    await prisma.client.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/clients");
    return { success: true };
  } catch (error: any) {
    console.error("Error actualizando cliente en Prisma:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteClient(id: string) {
  try {
    // Primero eliminar turnos asociados para evitar error de clave foránea
    await prisma.appointment.deleteMany({
      where: { clientId: id },
    });

    await prisma.client.delete({
      where: { id },
    });
    revalidatePath("/admin/clients");
    return { success: true };
  } catch (error: any) {
    console.error("Error eliminando cliente en Prisma:", error);
    return { success: false, error: error.message };
  }
}


// ==========================================
// 5. PROMOCIONES Y VOUCHERS DE REGALO
// ==========================================

export async function getAdminPromotions(): Promise<Promotion[]> {
  try {
    const db = await getDatabase();
    return db.promotions || [];
  } catch (error) {
    return [];
  }
}

export async function saveAdminPromotion(data: Partial<Promotion>): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    db.promotions = db.promotions || [];
    if (data.id) {
      const idx = db.promotions.findIndex((p) => p.id === data.id);
      if (idx !== -1) {
        db.promotions[idx] = { ...db.promotions[idx], ...data } as Promotion;
      }
    } else {
      const newPromo: Promotion = {
        id: randomUUID(),
        nombre: data.nombre || "Promoción Especial",
        descripcion: data.descripcion || "",
        descuentoPorcentaje: data.descuentoPorcentaje,
        precioPromo: Number(data.precioPromo) || 0,
        fechaInicio: data.fechaInicio || formatDateKey(new Date()),
        fechaFin: data.fechaFin || formatDateKey(new Date(Date.now() + 15 * 86400000)),
        serviciosIds: data.serviciosIds || [],
        activo: data.activo !== undefined ? data.activo : true,
        createdAt: new Date().toISOString(),
      };
      db.promotions.push(newPromo);
    }
    await saveDatabase(db);
    revalidatePath("/admin/promotions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminPromotion(id: string) {
  try {
    const db = await getDatabase();
    db.promotions = (db.promotions || []).filter((p) => p.id !== id);
    await saveDatabase(db);
    revalidatePath("/admin/promotions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdminVouchers(): Promise<Voucher[]> {
  try {
    const db = await getDatabase();
    return (db.vouchers || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    return [];
  }
}

export async function createAdminVoucher(data: {
  para: string;
  de: string;
  servicioONombre: string;
  monto?: number;
  vencimiento: string;
}) {
  try {
    const db = await getDatabase();
    db.vouchers = db.vouchers || [];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const codigo = `AGAPE-${randomSuffix}`;

    const newVoucher: Voucher = {
      id: randomUUID(),
      codigo,
      para: data.para.trim(),
      de: data.de.trim(),
      servicioONombre: data.servicioONombre.trim(),
      monto: data.monto ? Number(data.monto) : undefined,
      vencimiento: data.vencimiento,
      estado: "DISPONIBLE",
      createdAt: new Date().toISOString(),
    };

    db.vouchers.push(newVoucher);
    await saveDatabase(db);
    revalidatePath("/admin/promotions");
    return { success: true, voucher: newVoucher };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateVoucherStatus(id: string, estado: Voucher["estado"]) {
  try {
    const db = await getDatabase();
    const v = (db.vouchers || []).find((voucher) => voucher.id === id);
    if (v) {
      v.estado = estado;
      await saveDatabase(db);
      revalidatePath("/admin/promotions");
      return { success: true };
    }
    return { success: false, error: "Voucher no encontrado" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminVoucher(id: string) {
  try {
    const db = await getDatabase();
    db.vouchers = (db.vouchers || []).filter((v) => v.id !== id);
    await saveDatabase(db);
    revalidatePath("/admin/promotions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 6. PLANTILLAS DE MENSAJES DE WHATSAPP
// ==========================================

export async function getAdminTemplates(): Promise<MessageTemplate[]> {
  try {
    const db = await getDatabase();
    return db.templates || [];
  } catch (error) {
    return [];
  }
}

export async function saveAdminTemplate(id: string, texto: string) {
  try {
    const db = await getDatabase();
    db.templates = db.templates || [];
    const t = db.templates.find((tpl) => tpl.id === id);
    if (t) {
      t.texto = texto;
      await saveDatabase(db);
      revalidatePath("/admin/messages");
      return { success: true };
    }
    return { success: false, error: "Plantilla no encontrada" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

