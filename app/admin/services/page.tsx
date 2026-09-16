"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminNavbar from "@/components/AdminNavbar";
import {
  getAdminServices,
  saveAdminService,
  deleteAdminService,
  toggleServiceStatus,
} from "../actions";
import { DynamicService } from "@/lib/db";
import { formatPrice, formatDuration } from "@/lib/services";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
  Tag,
  AlertCircle,
  Search,
} from "lucide-react";

// Presets de imágenes de alta calidad para facilitar la selección rápida
const PRESET_IMAGES = [
  {
    label: "Kapping / Gel Nivelador",
    url: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Semipermanente / Color",
    url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Soft Gel Tips / Esculpidas",
    url: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Belleza Natural / Spa",
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Diseño & Perfilado de Cejas",
    url: "https://images.unsplash.com/photo-1595475207225-428b62bda831?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Lifting & Pestañas",
    url: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=800&q=80",
  },
];

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<DynamicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  // Estado del Modal de Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<DynamicService> | null>(null);
  const [incluyeText, setIncluyeText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    loadServices();
  }, [router]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getAdminServices();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewModal = () => {
    setEditingService({
      nombre: "",
      categoria: "Manicura",
      precio: 15000,
      duracion: 90,
      mantenimientoDias: 21,
      descripcion: "",
      imagenUrl: PRESET_IMAGES[0].url,
      queIncluye: [],
      activo: true,
      destacado: false,
    });
    setIncluyeText("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: DynamicService) => {
    setEditingService({ ...service });
    setIncluyeText((service.queIncluye || []).join("\n"));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.nombre?.trim()) {
      setMessage({ text: "El nombre del servicio es obligatorio.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const queIncluyeParsed = incluyeText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const res = await saveAdminService({
        ...editingService,
        queIncluye: queIncluyeParsed,
      });

      if (res.success) {
        setIsModalOpen(false);
        setEditingService(null);
        await loadServices();
        setMessage({ text: "Servicio guardado exitosamente. Ya se refleja en el sitio de clientas.", type: "success" });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ text: res.error || "Error al guardar el servicio.", type: "error" });
      }
    } catch (error: any) {
      setMessage({ text: error.message || "Error al procesar la solicitud.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás segura de que deseas eliminar el servicio "${name}"?`)) return;
    try {
      await deleteAdminService(id);
      await loadServices();
      setMessage({ text: `Servicio "${name}" eliminado.`, type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert("Error al eliminar servicio: " + err.message);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleServiceStatus(id);
      await loadServices();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Categorías únicas
  const categories = ["Todas", ...Array.from(new Set(services.map((s) => s.categoria || "Manicura")))];

  // Filtrado de servicios
  const filteredServices = services.filter((s) => {
    const matchesCategory = selectedCategory === "Todas" || s.categoria === selectedCategory;
    const matchesSearch =
      s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
      <AdminNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCC5A3]/40 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F0E6] text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Catálogo Dinámico & Precios
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
              Gestión de Servicios
            </h1>
            <p className="text-xs text-[#666666] font-light mt-1">
              Modifica precios, duraciones, fotos y descripciones. Cualquier cambio se actualiza inmediatamente en el sitio de las clientas.
            </p>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-sm cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Servicio</span>
          </button>
        </div>

        {/* Mensaje de feedback */}
        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium mb-6 flex items-center gap-2 border ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filtros de Categorías y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Pestañas de categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#2B2B2B] text-[#FFFFFF] shadow-xs"
                    : "bg-[#FFFFFF] text-[#666666] border border-[#DCC5A3]/40 hover:border-[#D4AF37]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Barra de búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs bg-[#FFFFFF] border border-[#DCC5A3]/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Grilla de Servicios */}
        {loading ? (
          <div className="p-16 text-center text-xs text-[#737373]">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando servicios del catálogo...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFFFF] rounded-3xl border border-[#DCC5A3]/40">
            <Tag className="w-8 h-8 text-[#DCC5A3] mx-auto mb-2" />
            <h3 className="font-cinzel text-base font-bold text-[#2B2B2B]">
              No se encontraron servicios
            </h3>
            <p className="text-xs text-[#737373] mt-1">
              Prueba cambiando la categoría o crea un nuevo servicio con el botón superior.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-[#FFFFFF] rounded-3xl border overflow-hidden transition-all flex flex-col justify-between ${
                  service.activo
                    ? "border-[#DCC5A3]/50 shadow-xs hover:shadow-md hover:border-[#D4AF37]"
                    : "border-gray-200 opacity-60 bg-gray-50"
                }`}
              >
                <div>
                  {/* Imagen del servicio */}
                  <div className="relative w-full h-44 bg-[#F5F0E6] overflow-hidden">
                    {service.imagenUrl ? (
                      <img
                        src={service.imagenUrl}
                        alt={service.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#A3A3A3]">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Sin imagen asignada</span>
                      </div>
                    )}

                    {/* Badges superiores */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#2B2B2B]/80 text-[#FFFFFF] backdrop-blur-xs text-[10px] font-semibold">
                        {service.categoria || "Manicura"}
                      </span>
                      {service.destacado && (
                        <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#2B2B2B] text-[10px] font-bold uppercase tracking-wider">
                          Destacado
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleToggleActive(service.id)}
                        className={`p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                          service.activo
                            ? "bg-emerald-600/90 text-[#FFFFFF]"
                            : "bg-gray-600/90 text-[#FFFFFF]"
                        }`}
                        title={service.activo ? "Servicio visible para clientas" : "Servicio oculto"}
                      >
                        {service.activo ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                        {service.nombre}
                      </h3>
                      <span className="font-cinzel text-base font-bold text-[#D4AF37] whitespace-nowrap">
                        {formatPrice(service.precio)}
                      </span>
                    </div>

                    <p className="text-xs text-[#666666] font-light line-clamp-2 mb-4">
                      {service.descripcion}
                    </p>

                    <div className="grid grid-cols-2 gap-2 py-2.5 px-3 rounded-2xl bg-[#FAF8F5] border border-[#DCC5A3]/30 text-[11px] text-[#525252] mb-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{formatDuration(service.duracion)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Mant. {service.mantenimientoDias} días</span>
                      </div>
                    </div>

                    {/* Qué incluye */}
                    {service.queIncluye && service.queIncluye.length > 0 && (
                      <div className="space-y-1 mb-4">
                        <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">
                          Incluye:
                        </span>
                        <ul className="text-xs text-[#525252] space-y-1">
                          {service.queIncluye.slice(0, 3).map((inc, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-[#D4AF37] shrink-0" />
                              <span className="truncate">{inc}</span>
                            </li>
                          ))}
                          {service.queIncluye.length > 3 && (
                            <li className="text-[10px] text-[#A3A3A3] italic pl-4">
                              + {service.queIncluye.length - 3} detalles más
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones inferiores */}
                <div className="p-4 bg-[#FAF8F5]/60 border-t border-[#F5F0E6] flex items-center justify-between">
                  <div className="text-[10px] font-semibold text-[#737373]">
                    {service.activo ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Activo en reserva
                      </span>
                    ) : (
                      <span className="text-gray-500">Pausado</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(service)}
                      className="p-1.5 rounded-full hover:bg-[#FFFFFF] border border-transparent hover:border-[#DCC5A3] text-[#2B2B2B] text-xs transition-colors cursor-pointer"
                      title="Editar servicio"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#2B2B2B]" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id, service.nombre)}
                      className="p-1.5 rounded-full hover:bg-red-50 border border-transparent hover:border-red-200 text-red-600 text-xs transition-colors cursor-pointer"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para Crear / Editar Servicio */}
        {isModalOpen && editingService && (
          <div className="fixed inset-0 z-50 bg-[#2B2B2B]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#FFFFFF] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-[#F5F0E6] mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                    Editor de Catálogo
                  </span>
                  <h2 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    {editingService.id ? `Modificar: ${editingService.nombre}` : "Nuevo Servicio"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-sm font-bold flex items-center justify-center hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Nombre y Categoría */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                      Nombre del Servicio *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingService.nombre || ""}
                      onChange={(e) =>
                        setEditingService({ ...editingService, nombre: e.target.value })
                      }
                      placeholder="Ej: Kapping Gel, Soft Gel Tips..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      list="categories-list"
                      value={editingService.categoria || "Manicura"}
                      onChange={(e) =>
                        setEditingService({ ...editingService, categoria: e.target.value })
                      }
                      placeholder="Manicura, Cejas, Pestañas..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <datalist id="categories-list">
                      <option value="Manicura" />
                      <option value="Cejas" />
                      <option value="Pestañas" />
                      <option value="Spa de Manos" />
                      <option value="Belleza Facial" />
                    </datalist>
                  </div>
                </div>

                {/* Precio, Duración y Mantenimiento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                      Precio ($ ARS) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      value={editingService.precio ?? 15000}
                      onChange={(e) =>
                        setEditingService({ ...editingService, precio: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                      Duración (minutos) *
                    </label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      required
                      value={editingService.duracion ?? 90}
                      onChange={(e) =>
                        setEditingService({ ...editingService, duracion: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <span className="text-[10px] text-[#737373]">
                      Equivale a: {formatDuration(editingService.duracion || 0)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                      Días de Mantenimiento
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingService.mantenimientoDias ?? 21}
                      onChange={(e) =>
                        setEditingService({
                          ...editingService,
                          mantenimientoDias: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <span className="text-[10px] text-[#737373]">
                      Para calcular avisos a clientas
                    </span>
                  </div>
                </div>

                {/* Imagen del Servicio */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#2B2B2B]">
                    Imagen del Servicio (URL o Selección Rápida)
                  </label>
                  <input
                    type="url"
                    value={editingService.imagenUrl || ""}
                    onChange={(e) =>
                      setEditingService({ ...editingService, imagenUrl: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />

                  {/* Galería de presets rápidos */}
                  <div>
                    <span className="text-[10px] text-[#737373] block mb-1.5">
                      O selecciona una foto modelo de alta calidad:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PRESET_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setEditingService({ ...editingService, imagenUrl: preset.url })
                          }
                          className={`relative h-16 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                            editingService.imagenUrl === preset.url
                              ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/50 scale-95"
                              : "border-gray-200 hover:border-[#DCC5A3]"
                          }`}
                          title={preset.label}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Descripción del Servicio
                  </label>
                  <textarea
                    rows={2}
                    value={editingService.descripcion || ""}
                    onChange={(e) =>
                      setEditingService({ ...editingService, descripcion: e.target.value })
                    }
                    placeholder="Detalla en qué consiste el procedimiento y el acabado final..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Qué incluye (un ítem por línea) */}
                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    ¿Qué incluye el servicio? (Un ítem por línea)
                  </label>
                  <textarea
                    rows={4}
                    value={incluyeText}
                    onChange={(e) => setIncluyeText(e.target.value)}
                    placeholder="Manicuría combinada&#10;Nivelación con gel&#10;Esmaltado liso o french&#10;Aceite para cutículas"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-[10px] text-[#737373]">
                    Escribe cada detalle en un renglón diferente para que aparezca con un tilde en la web.
                  </span>
                </div>

                {/* Opciones booleanas */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#2B2B2B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingService.activo ?? true}
                      onChange={(e) =>
                        setEditingService({ ...editingService, activo: e.target.checked })
                      }
                      className="rounded border-[#DCC5A3] text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span>Servicio Activo (visible para reservas)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-[#2B2B2B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingService.destacado ?? false}
                      onChange={(e) =>
                        setEditingService({ ...editingService, destacado: e.target.checked })
                      }
                      className="rounded border-[#DCC5A3] text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span>Destacado en Página Principal</span>
                  </label>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F5F0E6]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-xs font-semibold hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar Servicio"}
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
