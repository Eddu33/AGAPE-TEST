"use server";

import {
  calculateAvailableSlots,
  formatDateKey,
  timeStringToMinutes,
  TimeInterval,
  SlotAvailability,
} from "@/lib/availability";
import { getDatabase, saveDatabase, StoredAppointment, StoredClient } from "@/lib/db";
import { SERVICIOS_AGAPE, EXTRAS_AGAPE } from "@/lib/services";
import { randomUUID } from "crypto";

/**
 * Obtiene la disponibilidad horaria calculada para un día y duración determinados
 * Evita cualquier tipo de solapamiento con turnos existentes, descansos o bloqueos.
 */
export async function getCalculatedAvailability(
  dateString: string, // "YYYY-MM-DD"
  totalDurationMinutes: number = 90
): Promise<{
  success: boolean;
  slots: SlotAvailability[];
  date: string;
  isClosedDay?: boolean;
}> {
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);

    const db = getDatabase();

    // 1. Filtrar turnos activos para esa fecha
    const dayAppointments = db.appointments.filter(
      (apt) => apt.date === dateString && apt.status !== "CANCELLED"
    );

    // 2. Convertir los turnos a intervalos ocupados en minutos
    const busyIntervals: TimeInterval[] = dayAppointments.map((apt) => ({
      startMinutes: timeStringToMinutes(apt.startTime),
      endMinutes: timeStringToMinutes(apt.endTime),
      reason: "TURNO_EXISTENTE",
      title: `${apt.serviceName} (${apt.clientName})`,
    }));

    // 3. Ejecutar el motor de disponibilidad matemática
    const slots = calculateAvailableSlots({
      date: targetDate,
      totalDurationMinutes,
      busyIntervals,
      blockedTimes: db.blockedTimes,
      specialOpenings: db.specialOpenings,
      weeklySchedule: db.weeklySchedule,
      slotStepMinutes: 30,
    });

    return {
      success: true,
      slots,
      date: dateString,
      isClosedDay: slots.length === 0,
    };
  } catch (error: any) {
    console.error("Error al calcular disponibilidad:", error);
    return {
      success: false,
      slots: [],
      date: dateString,
    };
  }
}

/**
 * Registra un nuevo turno en el sistema de ÁGAPE STUDIO
 */
export async function bookAgapeAppointment(data: {
  name: string;
  phone: string;
  serviceId: string;
  extraIds: string[];
  date: string; // "YYYY-MM-DD"
  startTime: string; // "15:00"
  notes?: string;
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    const db = getDatabase();

    // 1. Buscar servicio principal (dinámico o fallback)
    const allServices = db.services && db.services.length > 0 ? db.services : SERVICIOS_AGAPE;
    const service = allServices.find((s) => s.id === data.serviceId);
    if (!service) {
      return { success: false, error: "El servicio seleccionado no existe o no está activo." };
    }

    // 2. Buscar extras
    const extras = EXTRAS_AGAPE.filter((e) => data.extraIds.includes(e.id));
    const extrasDuration = extras.reduce((acc, curr) => acc + curr.duracion, 0);
    const extrasPrice = extras.reduce((acc, curr) => acc + curr.precio, 0);

    const totalDuration = service.duracion + extrasDuration;
    const totalPrice = service.precio + extrasPrice;

    // Calcular hora de fin
    const startMinutes = timeStringToMinutes(data.startTime);
    const endMinutes = startMinutes + totalDuration;
    const hours = Math.floor(endMinutes / 60).toString().padStart(2, "0");
    const minutes = (endMinutes % 60).toString().padStart(2, "0");
    const endTime = `${hours}:${minutes}`;

    // 3. Validar que el horario sigue libre (prevención de condiciones de carrera)
    const availabilityCheck = await getCalculatedAvailability(data.date, totalDuration);
    const targetSlot = availabilityCheck.slots.find((s) => s.time === data.startTime);

    if (!targetSlot || !targetSlot.available) {
      return {
        success: false,
        error: "El horario seleccionado ya no se encuentra disponible. Por favor elige otro horario.",
      };
    }

    // 4. Buscar o crear clienta
    let client = db.clients.find((c) => c.phone.trim() === data.phone.trim());
    if (!client) {
      client = {
        id: randomUUID(),
        name: data.name.trim(),
        phone: data.phone.trim(),
        category: "Nueva",
        createdAt: new Date().toISOString(),
      };
      db.clients.push(client);
    } else {
      client.name = data.name.trim();
    }

    // 5. Crear el turno
    const appointmentId = randomUUID();
    const newAppointment: StoredAppointment = {
      id: appointmentId,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
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

    db.appointments.push(newAppointment);
    saveDatabase(db);

    return { success: true, appointmentId };
  } catch (error: any) {
    console.error("Error al registrar turno:", error);
    return { success: false, error: error?.message || "Ocurrió un error inesperado al procesar la reserva." };
  }
}

/**
 * Obtiene los detalles de un turno por su ID
 */
export async function getAgapeAppointmentById(id: string): Promise<StoredAppointment | null> {
  try {
    const db = getDatabase();
    const appointment = db.appointments.find((a) => a.id === id);
    return appointment || null;
  } catch (error) {
    console.error("Error al buscar turno:", error);
    return null;
  }
}

// Alias de compatibilidad para evitar roturas
export const getAppointmentById = getAgapeAppointmentById;

export async function getAvailability(date: Date): Promise<Record<string, number>> {
  try {
    const dateKey = formatDateKey(new Date(date));
    const result = await getCalculatedAvailability(dateKey, 60);
    const availability: Record<string, number> = {};
    result.slots.forEach((s) => {
      if (!s.available) {
        availability[s.time] = 1;
      }
    });
    return availability;
  } catch {
    return {};
  }
}

export async function bookAppointment(data: {
  name: string;
  phone: string;
  date: Date;
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    const d = new Date(data.date);
    const dateStr = formatDateKey(d);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    const startTime = `${h}:${m}`;
    return await bookAgapeAppointment({
      name: data.name,
      phone: data.phone,
      serviceId: "kapping",
      extraIds: [],
      date: dateStr,
      startTime,
    });
  } catch (error: any) {
    return { success: false, appointmentId: undefined, error: error.message };
  }
}

export async function getStudioSettings() {
  try {
    const db = getDatabase();
    return db.settings || {
      studioName: "ÁGAPE STUDIO",
      whatsappPhone: "5493516002716",
      depositPolicy: "Tolerancia máxima de 15 minutos de espera.",
    };
  } catch {
    return {
      studioName: "ÁGAPE STUDIO",
      whatsappPhone: "5493516002716",
      depositPolicy: "Tolerancia máxima de 15 minutos de espera.",
    };
  }
}

export async function updateStudioSettings(data: { whatsappPhone: string }) {
  try {
    const db = getDatabase();
    db.settings = {
      ...(db.settings || {
        studioName: "ÁGAPE STUDIO",
        depositPolicy: "Tolerancia máxima de 15 minutos de espera.",
      }),
      whatsappPhone: data.whatsappPhone.trim(),
    };
    saveDatabase(db);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene los servicios activos de la base de datos para la vista del cliente
 */
export async function getPublicServices() {
  try {
    const db = getDatabase();
    const services = db.services && db.services.length > 0 ? db.services : SERVICIOS_AGAPE;
    return services.filter((s) => s.activo);
  } catch (error) {
    console.error("Error al obtener servicios públicos:", error);
    return SERVICIOS_AGAPE.filter((s) => s.activo);
  }
}


