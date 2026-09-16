"use server";

import { getDatabase, saveDatabase, StoredAppointment, StoredClient } from "@/lib/db";
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
}

/**
 * Obtiene todos los turnos del sistema ordenados por fecha y hora
 */
export async function getAdminAppointments(): Promise<StoredAppointment[]> {
  try {
    const db = getDatabase();
    return db.appointments.sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
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
    const db = getDatabase();
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
    const db = getDatabase();
    const apt = db.appointments.find((a) => a.id === id);
    if (apt) {
      apt.status = status;
      apt.updatedAt = new Date().toISOString();
      saveDatabase(db);
      revalidatePath("/admin/dashboard");
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
    const db = getDatabase();
    db.appointments = db.appointments.filter((a) => a.id !== id);
    saveDatabase(db);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar turno:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Permite a la manicurista crear un turno manual desde el panel
 */
export async function createManualAppointment(data: {
  clientName: string;
  clientPhone: string;
  serviceId: string;
  extraIds: string[];
  date: string; // "YYYY-MM-DD"
  startTime: string; // "15:00"
  notes?: string;
}) {
  try {
    const db = getDatabase();
    const service = SERVICIOS_AGAPE.find((s) => s.id === data.serviceId) || SERVICIOS_AGAPE[0];
    const extras = EXTRAS_AGAPE.filter((e) => data.extraIds.includes(e.id));

    const totalDuration = calculateTotalDuration(service, extras);
    const totalPrice = calculateTotalPrice(service, extras);

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
      serviceId: service.id,
      serviceName: service.nombre,
      extraIds: extras.map((e) => e.id),
      extraNames: extras.map((e) => e.nombre),
      date: data.date,
      startTime: data.startTime,
      endTime,
      durationMinutes: totalDuration,
      totalPrice,
      status: "CONFIRMED",
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.appointments.push(newApt);
    saveDatabase(db);
    revalidatePath("/admin/dashboard");
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
    const db = getDatabase();
    const newBlock: BlockedTime = {
      id: randomUUID(),
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason || "Bloqueo personal",
    };
    db.blockedTimes.push(newBlock);
    saveDatabase(db);
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
    const db = getDatabase();
    db.blockedTimes = db.blockedTimes.filter((b) => b.id !== id);
    saveDatabase(db);
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
    const db = getDatabase();
    const total = db.appointments.length;
    const confirmed = db.appointments.filter((a) => a.status === "CONFIRMED").length;
    const completed = db.appointments.filter((a) => a.status === "COMPLETED").length;
    const cancelled = db.appointments.filter((a) => a.status === "CANCELLED").length;
    const noShow = db.appointments.filter((a) => a.status === "NO_SHOW").length;

    const totalRevenue = db.appointments
      .filter((a) => a.status === "COMPLETED")
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);

    const pendingRevenue = db.appointments
      .filter((a) => a.status === "CONFIRMED" || a.status === "PENDING")
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);

    return {
      total,
      confirmed,
      completed,
      cancelled,
      noShow,
      totalRevenue,
      pendingRevenue,
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
    };
  }
}
