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
  paymentStatus?: "PENDING" | "DEPOSIT_REQUESTED" | "DEPOSIT_PAID" | "PAID" | "AWAITING_VERIFICATION";
  paymentMethod?: "EFECTIVO" | "TRANSFERENCIA" | "OTRO";
  paymentReceipt?: string;
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
  birthday?: string; // "DD/MM" o "YYYY-MM-DD"
  category?: "Nueva" | "Recurrente" | "Frecuente" | "VIP";
  technicalRecord?: NailRecord;
  lastVisit?: string;
  totalVisits?: number;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  fecha: string; // "YYYY-MM-DD"
  categoria: "Materiales" | "Esmaltes" | "Herramientas" | "Insumos" | "Mobiliario" | "Publicidad" | "Packaging" | "Otros";
  descripcion: string;
  monto: number;
  observaciones?: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  nombre: string;
  descripcion: string;
  descuentoPorcentaje?: number;
  precioPromo: number;
  fechaInicio: string;
  fechaFin: string;
  serviciosIds: string[];
  activo: boolean;
  createdAt: string;
}

export interface Voucher {
  id: string;
  codigo: string; // ej. AGAPE-7482
  para: string;
  de: string;
  servicioONombre: string;
  monto?: number;
  vencimiento: string; // "YYYY-MM-DD"
  estado: "DISPONIBLE" | "CANJEADO" | "UTILIZADO" | "VENCIDO" | "CANCELADO";
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  tipo: "CONFIRMACION" | "RECORDATORIO_24H" | "RECORDATORIO_48H" | "CUMPLEANOS" | "RECUPERACION_INACTIVA" | "PROMO";
  titulo: string;
  texto: string;
  variables?: string[];
}


export interface DynamicService {
  id: string;
  nombre: string;
  categoria: "Manicura" | "Cejas" | "Pestañas" | string;
  precio: number;
  duracion: number; // en minutos
  mantenimientoDias: number;
  descripcion: string;
  imagenUrl: string;
  queIncluye: string[];
  queNoIncluye: string[];
  garantia: string;
  instrucciones: string;
  activo: boolean;
  destacado?: boolean;
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
  services?: DynamicService[];
  expenses?: Expense[];
  promotions?: Promotion[];
  vouchers?: Voucher[];
  templates?: MessageTemplate[];
  settings?: StudioSettings;
}

export const INITIAL_SERVICES: DynamicService[] = [
  {
    id: "kapping",
    nombre: "Kapping Gel",
    categoria: "Manicura",
    precio: 15000,
    duracion: 90,
    mantenimientoDias: 21,
    descripcion: "Capa protectora de gel nivelador sobre tu uña natural para evitar quiebres y permitir un crecimiento sano y fuerte.",
    imagenUrl: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Manicuría combinada / rusa",
      "Nivelación con gel estructurador",
      "Esmaltado liso o french clásico",
      "Aceite nutritivo para cutículas",
    ],
    queNoIncluye: [
      "Extensión o alargamiento de largo",
      "Remoción de material colocado en otro estudio",
    ],
    garantia: "5 días de garantía ante desprendimiento espontáneo sin golpe.",
    instrucciones: "Asistir con uñas limpias y sin restos de aceites para máxima adherencia.",
    activo: true,
    destacado: true,
  },
  {
    id: "semipermanente",
    nombre: "Esmaltado Semipermanente",
    categoria: "Manicura",
    precio: 12000,
    duracion: 60,
    mantenimientoDias: 18,
    descripcion: "Cuidado delicado de cutículas, preparación sin dañar la lámina y esmaltado de alta duración con acabado brillante por hasta 3 semanas.",
    imagenUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Limpieza profunda de cutículas",
      "Base vitaminada protectora",
      "Color a elección (hasta 2 tonos)",
      "Top coat ultra brillante",
    ],
    queNoIncluye: [
      "Nivelación con gel pesado",
      "Extensión del largo natural",
    ],
    garantia: "3 días de garantía ante salto espontáneo.",
    instrucciones: "Evitar agua muy caliente en las primeras 2 horas posteriores al esmaltado.",
    activo: true,
    destacado: false,
  },
  {
    id: "softgel",
    nombre: "Soft Gel Tips",
    categoria: "Manicura",
    precio: 19000,
    duracion: 120,
    mantenimientoDias: 21,
    descripcion: "Extensiones completas elaboradas con gel ultra resistente y flexible. Alargan tus uñas con apariencia natural, liviana y estilizada.",
    imagenUrl: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Preparación completa con fresas diamantadas",
      "Colocación y ajuste de tips de gel",
      "Limado a forma deseada (Almond, Coffin, Cuadrada)",
      "Esmaltado semipermanente",
    ],
    queNoIncluye: [
      "Nail Art complejo (elegir en extras)",
    ],
    garantia: "5 días de garantía ante desprendimiento.",
    instrucciones: "Si tienes acrílico previo, selecciona el extra de remoción.",
    activo: true,
    destacado: false,
  },
  {
    id: "belleza-manos",
    nombre: "Belleza de Manos Clásica",
    categoria: "Manicura",
    precio: 8500,
    duracion: 45,
    mantenimientoDias: 14,
    descripcion: "Cuidado higiénico integral para manos prolijas, limpias e hidratadas. Ideal para un look sobrio, natural y saludable.",
    imagenUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Tratamiento prolijo de cutículas",
      "Limado y pulido de uñas naturales",
      "Nutrición profunda con loción aromática",
      "Brillo protector o calcio fortalecedor",
    ],
    queNoIncluye: [
      "Esmaltado semipermanente o gel",
    ],
    garantia: "Garantía de higiene y prolijidad en el momento del servicio.",
    instrucciones: "Sin preparación previa requerida.",
    activo: true,
    destacado: false,
  },
  {
    id: "perfilado-cejas",
    nombre: "Perfilado & Diseño de Cejas",
    categoria: "Cejas",
    precio: 7500,
    duracion: 40,
    mantenimientoDias: 20,
    descripcion: "Diseño personalizado según tu fisonomía facial con pinza y cera de baja temperatura para resaltar tu mirada de forma armoniosa.",
    imagenUrl: "https://images.unsplash.com/photo-1595475207225-428b62bda831?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Visagismo facial y mapeo",
      "Depilación con cera suave / pinza",
      "Peinado y fijación con sérum",
    ],
    queNoIncluye: ["Laminado químico"],
    garantia: "Asesoría estética garantizada.",
    instrucciones: "Evitar exfoliar la zona 24 horas antes.",
    activo: true,
    destacado: false,
  },
  {
    id: "lifting-pestanas",
    nombre: "Lifting & Nutrición de Pestañas",
    categoria: "Pestañas",
    precio: 14000,
    duracion: 75,
    mantenimientoDias: 35,
    descripcion: "Curvatura natural desde la raíz y tinte profundo con baño de keratina que abre tu mirada sin necesidad de extensiones.",
    imagenUrl: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Lifting con moldes de silicona anatómicos",
      "Tinte negro intenso",
      "Baño nutritivo de keratina y colágeno",
    ],
    queNoIncluye: ["Extensiones pelo a pelo"],
    garantia: "Efecto visible de 4 a 6 semanas.",
    instrucciones: "Asistir sin rímel ni maquillaje en los ojos.",
    activo: true,
    destacado: false,
  },
];

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: "confirmacion",
    tipo: "CONFIRMACION",
    titulo: "Confirmación de Turno",
    texto: "Hola [nombre], te confirmamos tu turno en ÁGAPE STUDIO para el día [fecha] a las [hora] hs para [servicio]. Total: $[precio]. ¡Te esperamos con mucho amor! 💅✨",
    variables: ["[nombre]", "[fecha]", "[hora]", "[servicio]", "[precio]"],
  },
  {
    id: "recordatorio-24h",
    tipo: "RECORDATORIO_24H",
    titulo: "Recordatorio 24 Horas Antes",
    texto: "Hola [nombre], te recordamos que mañana tenés tu turno en ÁGAPE STUDIO a las [hora] hs para [servicio]. Por favor avisanos con anticipación si necesitas reprogramar. ¡Hasta mañana! 💖",
    variables: ["[nombre]", "[fecha]", "[hora]", "[servicio]"],
  },
  {
    id: "recordatorio-48h",
    tipo: "RECORDATORIO_48H",
    titulo: "Recordatorio 48 Horas Antes",
    texto: "Hola [nombre] ✨ Te recordamos que en 2 días tenés agendada tu cita en ÁGAPE STUDIO el día [fecha] a las [hora] hs para [servicio]. ¡Nos vemos pronto!",
    variables: ["[nombre]", "[fecha]", "[hora]", "[servicio]"],
  },
  {
    id: "cumpleanos",
    tipo: "CUMPLEANOS",
    titulo: "Saludo de Cumpleaños",
    texto: "¡Feliz cumple, [nombre]! 🎂💖 Desde ÁGAPE STUDIO queremos desearte un hermoso día. Tenemos un regalito especial para vos en tu próxima visita.",
    variables: ["[nombre]"],
  },
  {
    id: "recuperacion",
    tipo: "RECUPERACION_INACTIVA",
    titulo: "Recuperación de Clienta Inactiva",
    texto: "Hola [nombre] ✨ ¡Hace tiempo no te vemos por ÁGAPE STUDIO y extrañamos mimar tus uñas! ¿Te gustaría agendar un turno esta semana para renovar tu set? Te esperamos con un descuento especial.",
    variables: ["[nombre]"],
  },
];


const DEFAULT_SETTINGS: StudioSettings = {
  studioName: "ÁGAPE STUDIO",
  whatsappPhone: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || process.env.WHATSAPP_PHONE_NUMBER || "").replace(/\D/g, ""),
  depositPolicy: "Tolerancia máxima de 15 minutos de espera. Para confirmar el turno se solicita una seña del 50%.",
};


import { neon } from "@neondatabase/serverless";

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

function getNeonSql() {
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl) return null;
  try {
    return neon(dbUrl);
  } catch (err) {
    console.warn("[ÁGAPE NEON] Error inicializando cliente Neon:", err);
    return null;
  }
}

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
      services: INITIAL_SERVICES,
      expenses: [],
      promotions: [],
      vouchers: [],
      templates: INITIAL_TEMPLATES,
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
          services: parsedSeed.services && parsedSeed.services.length > 0 ? parsedSeed.services : INITIAL_SERVICES,
          expenses: parsedSeed.expenses || [],
          promotions: parsedSeed.promotions || [],
          vouchers: parsedSeed.vouchers || [],
          templates: parsedSeed.templates || INITIAL_TEMPLATES,
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
        services: parsed.services && parsed.services.length > 0 ? parsed.services : INITIAL_SERVICES,
        expenses: parsed.expenses || [],
        promotions: parsed.promotions || [],
        vouchers: parsed.vouchers || [],
        templates: parsed.templates || INITIAL_TEMPLATES,
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
      services: INITIAL_SERVICES,
      expenses: [],
      promotions: [],
      vouchers: [],
      templates: INITIAL_TEMPLATES,
      settings: DEFAULT_SETTINGS,
    };
  }
  return memoryDb;
};

export async function getDatabaseAsync(): Promise<AppDatabase> {
  const sql = getNeonSql();
  if (sql) {
    try {
      const rows = await sql`SELECT data FROM agape_db WHERE id = 1`;
      if (rows && rows.length > 0 && rows[0].data) {
        const parsed = rows[0].data as AppDatabase;
        memoryDb = {
          clients: parsed.clients || [],
          appointments: parsed.appointments || [],
          blockedTimes: parsed.blockedTimes || [],
          specialOpenings: parsed.specialOpenings || [],
          weeklySchedule: parsed.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE,
          services: parsed.services && parsed.services.length > 0 ? parsed.services : INITIAL_SERVICES,
          expenses: parsed.expenses || [],
          promotions: parsed.promotions || [],
          vouchers: parsed.vouchers || [],
          templates: parsed.templates || INITIAL_TEMPLATES,
          settings: parsed.settings || DEFAULT_SETTINGS,
        };
        // Guardar en caché de disco local
        try {
          const dbPath = getDatabasePath();
          fs.writeFileSync(dbPath, JSON.stringify(memoryDb, null, 2), "utf-8");
        } catch (e) {}
        return memoryDb;
      }
    } catch (neonErr) {
      console.warn("[ÁGAPE NEON] Error al consultar Neon en getDatabaseAsync:", neonErr);
    }
  }
  return getDatabase();
}

export const saveDatabase = (data: AppDatabase): void => {
  // Asegurar que las colecciones no queden undefined
  data.services = data.services && data.services.length > 0 ? data.services : INITIAL_SERVICES;
  data.expenses = data.expenses || [];
  data.promotions = data.promotions || [];
  data.vouchers = data.vouchers || [];
  data.templates = data.templates || INITIAL_TEMPLATES;

  memoryDb = data;
  try {
    ensureDatabaseExists();
    const dbPath = getDatabasePath();
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("[ÁGAPE DB] Error al persistir en disco (mantenido en memoria):", error);
  }

  // Sincronizar en segundo plano con Neon si está disponible
  const sql = getNeonSql();
  if (sql) {
    sql`CREATE TABLE IF NOT EXISTS agape_db (
      id INT PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
      .then(() => {
        return sql`INSERT INTO agape_db (id, data, updated_at)
          VALUES (1, ${JSON.stringify(data)}, NOW())
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`;
      })
      .catch((e) => console.warn("[ÁGAPE NEON BG] Error sincronizando:", e));
  }
};

export async function saveDatabaseAsync(data: AppDatabase): Promise<void> {
  data.services = data.services && data.services.length > 0 ? data.services : INITIAL_SERVICES;
  data.expenses = data.expenses || [];
  data.promotions = data.promotions || [];
  data.vouchers = data.vouchers || [];
  data.templates = data.templates || INITIAL_TEMPLATES;

  memoryDb = data;
  try {
    ensureDatabaseExists();
    const dbPath = getDatabasePath();
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("[ÁGAPE DB] Error al persistir en disco (mantenido en memoria):", error);
  }

  const sql = getNeonSql();
  if (sql) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS agape_db (
        id INT PRIMARY KEY DEFAULT 1,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`;
      await sql`INSERT INTO agape_db (id, data, updated_at)
        VALUES (1, ${JSON.stringify(data)}, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`;
    } catch (neonErr) {
      console.error("[ÁGAPE NEON] Error persistiendo en Neon PostgreSQL:", neonErr);
    }
  }
}

