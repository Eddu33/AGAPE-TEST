import fs from "fs";
import path from "path";
import {
  BlockedTime,
  SpecialOpening,
  DaySchedule,
  DEFAULT_WEEKLY_SCHEDULE,
} from "./availability";

export interface StoredAppointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  extraIds: string[];
  extraNames: string[];
  date: string; // "YYYY-MM-DD"
  startTime: string; // "15:00"
  endTime: string; // "16:30"
  durationMinutes: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredClient {
  id: string;
  name: string;
  phone: string;
  category?: "Nueva" | "Recurrente" | "Frecuente" | "VIP";
  createdAt: string;
}

export interface StudioSettings {
  studioName: string;
  whatsappPhone: string;
  depositPolicy: string;
}

export interface AppDatabase {
  clients: StoredClient[];
  appointments: StoredAppointment[];
  blockedTimes: BlockedTime[];
  specialOpenings: SpecialOpening[];
  weeklySchedule: DaySchedule[];
  settings?: StudioSettings;
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const DEFAULT_SETTINGS: StudioSettings = {
  studioName: "ÁGAPE STUDIO",
  whatsappPhone: "5493516002716",
  depositPolicy: "Tolerancia máxima de 15 minutos de espera.",
};

function ensureDatabaseExists(): void {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialData: AppDatabase = {
      clients: [],
      appointments: [],
      blockedTimes: [],
      specialOpenings: [],
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
      settings: DEFAULT_SETTINGS,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

export const getDatabase = (): AppDatabase => {
  ensureDatabaseExists();
  try {
    const content = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(content);
    return {
      clients: parsed.clients || [],
      appointments: parsed.appointments || [],
      blockedTimes: parsed.blockedTimes || [],
      specialOpenings: parsed.specialOpenings || [],
      weeklySchedule: parsed.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE,
      settings: parsed.settings || DEFAULT_SETTINGS,
    };
  } catch (error) {
    console.error("Error reading database:", error);
    return {
      clients: [],
      appointments: [],
      blockedTimes: [],
      specialOpenings: [],
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
      settings: DEFAULT_SETTINGS,
    };
  }
};

export const saveDatabase = (data: AppDatabase): void => {
  ensureDatabaseExists();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
};
