export interface WorkingHours {
  open: string; // ej: "09:00"
  close: string; // ej: "19:00"
  hasBreak: boolean;
  breakStart?: string; // ej: "13:00"
  breakEnd?: string; // ej: "14:00"
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  nombreDia: string;
  isWorkingDay: boolean;
  hours: WorkingHours;
}

export interface TimeInterval {
  startMinutes: number; // minutos desde las 00:00 (ej: 09:00 = 540)
  endMinutes: number; // minutos desde las 00:00 (ej: 10:30 = 630)
  reason?: string; // "TURNO", "DESCANSO", "BLOQUEO_PERSONAL", etc.
  title?: string;
}

export interface BlockedTime {
  id: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "14:00"
  endTime: string; // "16:00"
  reason: string; // "Médico", "Personal", etc.
}

export interface SpecialOpening {
  id: string;
  date: string; // "YYYY-MM-DD"
  open: string;
  close: string;
  reason: string;
}

export interface SlotAvailability {
  time: string; // "15:00"
  endTime: string; // "16:30"
  durationMinutes: number;
  available: boolean;
  conflictReason?: string;
}

/**
 * Horario laboral predeterminado de ÁGAPE STUDIO
 * Martes a Viernes: 09:00 a 19:00 (Almuerzo 13:00 a 14:00)
 * Sábados: 09:00 a 18:00 (Almuerzo 13:00 a 14:00)
 * Domingos y Lunes: Días de descanso
 */
export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    dayOfWeek: 0,
    nombreDia: "Domingo",
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "19:00",
      hasBreak: true,
      breakStart: "13:00",
      breakEnd: "14:00",
    },
  },
  {
    dayOfWeek: 1,
    nombreDia: "Lunes",
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "19:00",
      hasBreak: true,
      breakStart: "13:00",
      breakEnd: "14:00",
    },
  },
  {
    dayOfWeek: 2,
    nombreDia: "Martes",
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "19:00",
      hasBreak: true,
      breakStart: "13:00",
      breakEnd: "14:00",
    },
  },
  {
    dayOfWeek: 3,
    nombreDia: "Miércoles",
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "19:00",
      hasBreak: true,
      breakStart: "13:00",
      breakEnd: "14:00",
    },
  },
  {
    dayOfWeek: 4,
    nombreDia: "Jueves",
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "19:00",
      hasBreak: true,
      breakStart: "13:00",
      breakEnd: "14:00",
    },
  },
  {
    dayOfWeek: 5,
    nombreDia: "Viernes",
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "19:00",
      hasBreak: true,
      breakStart: "13:00",
      breakEnd: "14:00",
    },
  },
  {
    dayOfWeek: 6,
    nombreDia: "Sábado",
    isWorkingDay: true,
    hours: {
      open: "09:00",
      close: "18:00",
      hasBreak: true,
      breakStart: "13:00",
      breakEnd: "14:00",
    },
  },
];

/**
 * Convierte una hora en formato "HH:mm" a minutos desde las 00:00 (ej: "09:30" -> 570)
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde las 00:00 a formato "HH:mm" (ej: 570 -> "09:30")
 */
export function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hStr = hours.toString().padStart(2, "0");
  const mStr = minutes.toString().padStart(2, "0");
  return `${hStr}:${mStr}`;
}

/**
 * Verifica si dos intervalos de tiempo se solapan
 * Regla matemática: hay solapamiento si y solo si:
 * InicioA < FinB Y FinA > InicioB
 */
export function checkIntervalOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Formatea una fecha Date a string "YYYY-MM-DD"
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * MOTOR PRINCIPAL DE DISPONIBILIDAD:
 * Calcula qué horarios están disponibles para un servicio de cierta duración total
 * teniendo en cuenta:
 * 1. Horario de apertura y cierre del día
 * 2. Horario de descanso / almuerzo
 * 3. Bloqueos personales o vacaciones
 * 4. Aperturas extraordinarias
 * 5. Turnos ya reservados (evitando cualquier superposición)
 * 6. Límite de cierre (el turno debe terminar antes o a la hora de cierre)
 */
export function calculateAvailableSlots(params: {
  date: Date;
  totalDurationMinutes: number;
  busyIntervals?: TimeInterval[]; // turnos ya agendados en ese día
  blockedTimes?: BlockedTime[]; // bloqueos de la manicurista
  specialOpenings?: SpecialOpening[]; // aperturas extraordinarias
  weeklySchedule?: DaySchedule[];
  slotStepMinutes?: number; // intervalo de inicio (por defecto cada 30 minutos)
}): SlotAvailability[] {
  const {
    date,
    totalDurationMinutes,
    busyIntervals = [],
    blockedTimes = [],
    specialOpenings = [],
    weeklySchedule = DEFAULT_WEEKLY_SCHEDULE,
    slotStepMinutes = 30,
  } = params;

  const dateKey = formatDateKey(date);
  const dayOfWeek = date.getDay(); // 0 = Domingo, ..., 6 = Sábado

  // 1. Verificar si hay una apertura extraordinaria para esta fecha
  const specialOpening = specialOpenings.find((s) => s.date === dateKey);

  // 2. Obtener la configuración del día de la semana
  const dayConfig = weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);

  const isWorking = specialOpening ? true : Boolean(dayConfig?.isWorkingDay);

  if (!isWorking) {
    return []; // No atiende este día
  }

  // Horario de inicio y cierre
  const openTimeStr = specialOpening ? specialOpening.open : dayConfig!.hours.open;
  const closeTimeStr = specialOpening ? specialOpening.close : dayConfig!.hours.close;

  const openMinutes = timeStringToMinutes(openTimeStr);
  const closeMinutes = timeStringToMinutes(closeTimeStr);

  // 3. Recopilar todos los intervalos ocupados del día
  const allBusyBlocks: TimeInterval[] = [...busyIntervals];

  // Agregar descanso si aplica y no es apertura especial
  if (!specialOpening && dayConfig?.hours.hasBreak && dayConfig.hours.breakStart && dayConfig.hours.breakEnd) {
    allBusyBlocks.push({
      startMinutes: timeStringToMinutes(dayConfig.hours.breakStart),
      endMinutes: timeStringToMinutes(dayConfig.hours.breakEnd),
      reason: "DESCANSO_ALMUERZO",
      title: "Horario de Almuerzo / Descanso",
    });
  }

  // Agregar bloqueos manuales de la manicurista para esta fecha
  const dayBlocked = blockedTimes.filter((b) => b.date === dateKey);
  for (const block of dayBlocked) {
    allBusyBlocks.push({
      startMinutes: timeStringToMinutes(block.startTime),
      endMinutes: timeStringToMinutes(block.endTime),
      reason: "BLOQUEO_MANUAL",
      title: block.reason || "Horario Bloqueado",
    });
  }

  // 4. Generar posibles horarios de inicio desde openMinutes hasta closeMinutes
  const slots: SlotAvailability[] = [];

  for (
    let currentStart = openMinutes;
    currentStart + slotStepMinutes <= closeMinutes;
    currentStart += slotStepMinutes
  ) {
    const currentEnd = currentStart + totalDurationMinutes;
    const timeStr = minutesToTimeString(currentStart);
    const endTimeStr = minutesToTimeString(currentEnd);

    // Condición A: ¿El turno termina después del horario de cierre?
    if (currentEnd > closeMinutes) {
      slots.push({
        time: timeStr,
        endTime: endTimeStr,
        durationMinutes: totalDurationMinutes,
        available: false,
        conflictReason: `El servicio termina a las ${endTimeStr}, posterior al horario de cierre (${closeTimeStr})`,
      });
      continue;
    }

    // Condición B: ¿Se solapa con algún turno existente, descanso o bloqueo?
    let hasConflict = false;
    let conflictDescription = "";

    for (const busy of allBusyBlocks) {
      if (checkIntervalOverlap(currentStart, currentEnd, busy.startMinutes, busy.endMinutes)) {
        hasConflict = true;
        const busyStartStr = minutesToTimeString(busy.startMinutes);
        const busyEndStr = minutesToTimeString(busy.endMinutes);
        conflictDescription = busy.reason === "DESCANSO_ALMUERZO"
          ? `Coincide con descanso (${busyStartStr} - ${busyEndStr})`
          : busy.reason === "BLOQUEO_MANUAL"
          ? `Bloqueado por la manicurista: ${busy.title || "No disponible"}`
          : `Ocupado por otro turno (${busyStartStr} - ${busyEndStr})`;
        break;
      }
    }

    slots.push({
      time: timeStr,
      endTime: endTimeStr,
      durationMinutes: totalDurationMinutes,
      available: !hasConflict,
      conflictReason: hasConflict ? conflictDescription : undefined,
    });
  }

  return slots;
}
