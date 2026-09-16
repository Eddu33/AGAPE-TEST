export interface Service {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  duracion: number; // en minutos
  mantenimientoDias: number;
  descripcion: string;
  imagenUrl?: string;
  queIncluye: string[];
  queNoIncluye: string[];
  garantia: string;
  instrucciones: string;
  activo: boolean;
  destacado?: boolean;
}

export interface Extra {
  id: string;
  nombre: string;
  precio: number;
  duracion: number; // en minutos
  descripcion: string;
  activo: boolean;
}

export const SERVICIOS_AGAPE: Service[] = [
  {
    id: "kapping",
    nombre: "Kapping Gel",
    categoria: "Manicura",
    precio: 15000,
    duracion: 90,
    mantenimientoDias: 21,
    descripcion: "Capa protectora de gel nivelador aplicada sobre tu uña natural para darle grosor, resistencia y permitir un crecimiento sano sin roturas.",
    imagenUrl: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Manicuría combinada / rusa detallada",
      "Limpieza y preparación profunda de cutículas",
      "Nivelación con gel estructurador",
      "Esmaltado semipermanente liso o french clásico",
      "Aceite nutritivo para cutículas y masaje de manos",
    ],
    queNoIncluye: [
      "Extensión o alargamiento de uñas",
      "Remoción de material colocado en otro estudio",
      "Diseños artísticos a mano alzada (disponibles como extras)",
    ],
    garantia: "5 días de garantía ante desprendimiento espontáneo sin causa de golpe.",
    instrucciones: "Asistir con las manos limpias, sin restos de cremas o aceites para asegurar la adherencia del producto.",
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
    descripcion: "Tratamiento de belleza enfocado en cutículas prolijas y esmaltado de alta adherencia con curado en lámpara LED/UV por hasta 3 semanas.",
    imagenUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Repujado y remoción estética de cutículas",
      "Limado anatómico según la forma deseada",
      "Base vitaminada protectora",
      "Color liso a elección (hasta 2 tonos)",
      "Top coat ultra brillante o efecto mate",
    ],
    queNoIncluye: [
      "Nivelación con gel pesado para uñas débiles o quebradizas",
      "Extensión del largo natural",
    ],
    garantia: "3 días de garantía ante salto espontáneo de esmalte.",
    instrucciones: "No sumergir las manos en agua caliente prolongada ni usar químicos abrasivos sin guantes antes de la cita.",
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
    descripcion: "Técnica avanzada de extensiones mediante tips de gel preformados que cubren toda la uña. Son flexibles, livianos y no dañan la matriz ungueal.",
    imagenUrl: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Preparación completa con fresas diamantadas",
      "Selección y ajuste personalizado del tamaño de tips",
      "Adhesión segura con gel constructor",
      "Perfilado de forma (Almond, Cuadrada, Coffin o Stiletto)",
      "Esmaltado semipermanente con color a elección",
    ],
    queNoIncluye: [
      "Nail art complejo (se selecciona en la sección de extras)",
    ],
    garantia: "5 días de garantía ante desprendimientos imprevistos.",
    instrucciones: "Si tus uñas tienen restos de acrílico previo, agrega el servicio de remoción para preparar el lecho.",
    activo: true,
    destacado: false,
  },
  {
    id: "belleza-manos",
    nombre: "Belleza de Manos Clásica",
    categoria: "Manicura",
    precio: 9000,
    duracion: 45,
    mantenimientoDias: 14,
    descripcion: "Ritual de spa y cuidado natural para manos impecables, cutículas hidratadas y uñas prolijas sin uso de lámpara UV.",
    imagenUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    queIncluye: [
      "Exfoliación suave con aroma floral",
      "Limpieza y acondicionamiento de cutículas",
      "Limado y pulido de brillo natural",
      "Tratamiento fortalecedor con calcio o base natural",
      "Masaje relajante con crema hidratante",
    ],
    queNoIncluye: [
      "Curado de gel en lámpara",
      "Esmaltado de larga duración",
    ],
    garantia: "Servicio de cuidado inmediato.",
    instrucciones: "Excelente opción para descansar del gel o mantener tus manos suaves y elegantes.",
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

export const EXTRAS_AGAPE: Extra[] = [
  {
    id: "nail-art-simple",
    nombre: "Nail Art Simple (2 a 4 uñas)",
    precio: 2000,
    duracion: 15,
    descripcion: "Líneas finas, puntitos, stickers, degradé suave, foil o francesa clásica en uñas seleccionadas.",
    activo: true,
  },
  {
    id: "nail-art-completo",
    nombre: "Nail Art Complejo / Mano Alzada",
    precio: 4500,
    duracion: 30,
    descripcion: "Diseño detallado a mano alzada en todas las uñas, efecto mármol, flores o cromo metálico.",
    activo: true,
  },
  {
    id: "remocion-externa",
    nombre: "Remoción de Trabajo Previo",
    precio: 3000,
    duracion: 30,
    descripcion: "Retiro seguro con torno y removedor de gel o semipermanente realizado en otro estudio.",
    activo: true,
  },
  {
    id: "reparacion-una",
    nombre: "Reparación de Uña Rota",
    precio: 1500,
    duracion: 15,
    descripcion: "Reconstrucción con fibra de vidrio o gel nivelador para emparejar una uña fisurada.",
    activo: true,
  },
  {
    id: "cristales",
    nombre: "Cristalería & Strass",
    precio: 2500,
    duracion: 15,
    descripcion: "Aplique de cristales con gel de alta fijación para un toque de luz sofisticado.",
    activo: true,
  },
];

/**
 * Calcula la duración total sumando el servicio principal y los extras seleccionados
 */
export function calculateTotalDuration(service: Service, extras: Extra[]): number {
  const extrasDuration = extras.reduce((acc, curr) => acc + curr.duracion, 0);
  return service.duracion + extrasDuration;
}

/**
 * Calcula el precio total sumando el servicio principal y los extras seleccionados
 */
export function calculateTotalPrice(service: Service, extras: Extra[]): number {
  const extrasPrice = extras.reduce((acc, curr) => acc + curr.precio, 0);
  return service.precio + extrasPrice;
}

/**
 * Formatea un monto numérico a moneda argentina (ej: $ 15.000)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formatea minutos a un formato legible (ej: 90 -> "1h 30m" o 45 -> "45 min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
