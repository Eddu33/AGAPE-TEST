import fs from "fs";
import path from "path";
import os from "os";
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

export interface NailRecord {
  nailShape?: "Almendra" | "Cuadrada" | "Stiletto" | "Coffin" | "Redonda" | "Ovalada" | string;
  nailLength?: "Corta" | "Media" | "Larga" | "Extra" | string;
  nailCondition?: "Sana" | "Débil / Quebradiza" | "Estriada" | "Onicofagia (Mordida)" | string;
  favoriteStyles?: string[];
  allergiesOrSensitivities?: string;
  notes?: string;
  lastServiceDate?: string;
  recommendedMaintenanceDate?: string;
}

export interface StoredClient {
  id: string;
  name: string;
  phone: string;
  category?: "Nueva" | "Recurrente" | "Frecuente" | "VIP";
  technicalRecord?: NailRecord;
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

const DEFAULT_SETTINGS: StudioSettings = {
  studioName: "ÁGAPE STUDIO",
  whatsappPhone: "5493516002716",
  depositPolicy: "Tolerancia máxima de 15 minutos de espera.",
};

// En plataformas como Vercel o AWS Lambda, el sistema de archivos raíz (/var/task) es de solo lectura.
// El único directorio con permisos de escritura es os.tmpdir() (/tmp).
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.VERCEL_ENV
);

function getDatabasePath(): string {
  if (IS_SERVERLESS) {
    return path.join(os.tmpdir(), "agape_db.json");
  }
  return path.join(process.cwd(), "data", "db.json");
}

const SEED_PATH = path.join(process.cwd(), "data", "db.json");

// Memoria en caliente para fallback y acceso ultra-rápido
let memoryDb: AppDatabase | null = null;

function ensureDatabaseExists(): void {
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);

  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  } catch (err) {
    console.warn("[ÁGAPE DB] No se pudo crear directorio en disco:", err);
  }

  if (!fs.existsSync(dbPath)) {
    let initialData: AppDatabase = {
      clients: [],
      appointments: [],
      blockedTimes: [],
      specialOpenings: [],
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
      settings: DEFAULT_SETTINGS,
    };

    // Si existe el archivo db.json en el proyecto empaquetado, lo leemos como semilla inicial
    try {
      if (fs.existsSync(SEED_PATH)) {
        const seedContent = fs.readFileSync(SEED_PATH, "utf-8");
        const parsedSeed = JSON.parse(seedContent);
        initialData = {
          clients: parsedSeed.clients || [],
          appointments: parsedSeed.appointments || [],
          blockedTimes: parsedSeed.blockedTimes || [],
          specialOpenings: parsedSeed.specialOpenings || [],
          weeklySchedule: parsedSeed.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE,
          settings: parsedSeed.settings || DEFAULT_SETTINGS,
        };
      }
    } catch (err) {
      console.warn("[ÁGAPE DB] No se pudo leer la semilla de datos:", err);
    }

    try {
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), "utf-8");
    } catch (err) {
      console.warn("[ÁGAPE DB] No se pudo escribir en disco, usando almacenamiento en memoria:", err);
    }

    memoryDb = initialData;
  }
}

export const getDatabase = (): AppDatabase => {
  try {
    ensureDatabaseExists();
    const dbPath = getDatabasePath();
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, "utf-8");
      const parsed = JSON.parse(content);
      memoryDb = {
        clients: parsed.clients || [],
        appointments: parsed.appointments || [],
        blockedTimes: parsed.blockedTimes || [],
        specialOpenings: parsed.specialOpenings || [],
        weeklySchedule: parsed.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE,
        settings: parsed.settings || DEFAULT_SETTINGS,
      };
      return memoryDb;
    }
  } catch (error) {
    console.error("[ÁGAPE DB] Error al leer base de datos, usando memoria:", error);
  }

  if (!memoryDb) {
    memoryDb = {
      clients: [],
      appointments: [],
      blockedTimes: [],
      specialOpenings: [],
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
      settings: DEFAULT_SETTINGS,
    };
  }
  return memoryDb;
};

export const saveDatabase = (data: AppDatabase): void => {
  memoryDb = data;
  try {
    ensureDatabaseExists();
    const dbPath = getDatabasePath();
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("[ÁGAPE DB] Error al persistir en disco (mantenido en memoria):", error);
  }
};
