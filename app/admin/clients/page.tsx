"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import { getAdminClientsEnhanced, updateClientDetails } from "../actions";
import { StoredClient } from "@/lib/db";
import {
  Users,
  Cake,
  Clock,
  Search,
  MessageCircle,
  Edit2,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
  Phone,
  FileText,
  UserCheck,
  UserX,
  Heart,
} from "lucide-react";

type ClientWithMetrics = StoredClient & {
  appointmentsCount: number;
  completedCount: number;
  lastVisit?: string;
  lastService?: string;
  daysSinceLastVisit?: number;
  isBirthdaySoon?: boolean;
};

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "birthdays" | "inactive">("all");
  const [inactiveDaysThreshold, setInactiveDaysThreshold] = useState<number>(30);

  // Modal para editar perfil de clienta
  const [editingClient, setEditingClient] = useState<ClientWithMetrics | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editCategory, setEditCategory] = useState<StoredClient["category"]>("Nueva");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    fetchClientsData();
  }, [router]);

  const fetchClientsData = async () => {
    setLoading(true);
    try {
      const data = await getAdminClientsEnhanced();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (c: ClientWithMetrics) => {
    setEditingClient(c);
    setEditName(c.name || "");
    setEditPhone(c.phone || "");
    setEditBirthday(c.birthday || "");
    setEditCategory(c.category || "Nueva");
    setEditNotes(c.notes || "");
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setSaving(true);
    try {
      const res = await updateClientDetails(editingClient.id, {
        name: editName,
        phone: editPhone,
        birthday: editBirthday,
        category: editCategory,
        notes: editNotes,
      });

      if (res.success) {
        setEditingClient(null);
        await fetchClientsData();
        setFeedback("Datos de la clienta actualizados.");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Abrir WhatsApp con mensaje dinámico
  const openWhatsApp = (phone: string, message: string) => {
    const clean = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Filtrado
  const filteredAll = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const birthdayClients = clients.filter((c) => c.isBirthdaySoon || Boolean(c.birthday));

  const inactiveClients = clients.filter(
    (c) => c.daysSinceLastVisit !== undefined && c.daysSinceLastVisit >= inactiveDaysThreshold
  );

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <AdminNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCC5A3]/40 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F0E6] text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] mb-2">
              <Users className="w-3.5 h-3.5" />
              Gestión de Clientas & Fidelización
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
              Fichas de Clientas & Cumpleaños
            </h1>
            <p className="text-xs text-[#666666] font-light mt-1">
              Consulta su historial, felicítalas en su día especial o reconecta con clientas que hace tiempo no reservan.
            </p>
          </div>

          <div className="text-xs font-semibold px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#DCC5A3]/50 text-[#2B2B2B] shadow-2xs self-start md:self-auto">
            Total registradas: <strong className="text-[#D4AF37]">{clients.length}</strong>
          </div>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Pestañas de Navegación del CRM */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#FFFFFF] border border-[#DCC5A3]/40 w-fit">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-[#2B2B2B] text-[#FFFFFF]"
                  : "text-[#666666] hover:text-[#2B2B2B]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Todas ({clients.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("birthdays")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "birthdays"
                  ? "bg-[#D4AF37] text-[#2B2B2B]"
                  : "text-[#666666] hover:text-[#2B2B2B]"
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>Cumpleaños ({birthdayClients.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("inactive")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "inactive"
                  ? "bg-rose-600 text-[#FFFFFF]"
                  : "text-[#666666] hover:text-[#2B2B2B]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Inactivas ({inactiveClients.length})</span>
            </button>
          </div>

          {/* Búsqueda rápida */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-full text-xs bg-[#FFFFFF] border border-[#DCC5A3]/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA */}
        {loading ? (
          <div className="p-16 text-center text-xs text-[#737373]">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando base de clientas de ÁGAPE...
          </div>
        ) : activeTab === "all" ? (
          /* TAB 1: TODAS LAS CLIENTAS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAll.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-[#FFFFFF] rounded-3xl border border-[#DCC5A3]/40 text-xs text-[#737373]">
                No se encontraron clientas con ese criterio de búsqueda.
              </div>
            ) : (
              filteredAll.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#DCC5A3]/40 shadow-xs hover:border-[#D4AF37] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-cinzel text-base font-bold text-[#2B2B2B]">
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-[#737373] mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{c.phone}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.category === "VIP"
                            ? "bg-[#D4AF37] text-[#2B2B2B]"
                            : c.category === "Frecuente"
                            ? "bg-purple-100 text-purple-800"
                            : c.category === "Recurrente"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.category || "Nueva"}
                      </span>
                    </div>

                    {/* Ficha rápida */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#FAF8F5] border border-[#DCC5A3]/30 text-[11px] text-[#525252]">
                      <div>
                        <span className="text-[10px] text-[#737373] block uppercase font-bold">
                          Visitas:
                        </span>
                        <strong className="text-[#2B2B2B]">
                          {c.completedCount} completadas ({c.appointmentsCount} turnos)
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#737373] block uppercase font-bold">
                          Último turno:
                        </span>
                        <span>{c.lastVisit || "Sin registros"}</span>
                      </div>
                    </div>

                    {c.birthday && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                        <Cake className="w-3.5 h-3.5 text-rose-500" />
                        <span>Cumpleaños: <strong>{c.birthday}</strong></span>
                      </div>
                    )}

                    {c.notes && (
                      <div className="text-xs text-[#666666] bg-[#FFFFFF] p-2.5 rounded-xl border border-[#DCC5A3]/30 text-[11px]">
                        <span className="font-semibold text-[#2B2B2B]">Notas:</span> {c.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F5F0E6]">
                    <button
                      onClick={() => handleOpenEditModal(c)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2B2B2B] hover:text-[#D4AF37] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Perfil</span>
                    </button>

                    <button
                      onClick={() =>
                        openWhatsApp(
                          c.phone,
                          `Hola ${c.name} ✨ Te saludamos desde ÁGAPE STUDIO. ¡Esperamos que estés teniendo un lindo día!`
                        )
                      }
                      className="p-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-[#FFFFFF] transition-colors cursor-pointer"
                      title="Escribir por WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "birthdays" ? (
          /* TAB 2: PRÓXIMOS CUMPLEAÑOS */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[#F5F0E6] border border-[#DCC5A3] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFFFFF] flex items-center justify-center text-[#D4AF37] shadow-2xs">
                  <Cake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-[#2B2B2B]">
                    Fidelización por Cumpleaños
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Envía un saludo cálido con beneficio exclusivo para mimar a tu clienta en su mes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {birthdayClients.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-[#FFFFFF] rounded-3xl border border-[#DCC5A3]/40 text-xs text-[#737373]">
                  No hay clientas con fecha de cumpleaños registrada aún. Agrégalas editando su perfil.
                </div>
              ) : (
                birthdayClients.map((c) => {
                  const bMsg = `¡Feliz cumple, ${c.name}! 🎂💖 Desde ÁGAPE STUDIO queremos desearte un hermoso día. Tenemos un regalito especial para vos en tu próxima visita. ¡Que lo disfrutes mucho! ✨`;
                  return (
                    <div
                      key={c.id}
                      className="bg-[#FFFFFF] rounded-3xl p-5 border border-rose-200 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
                            <Cake className="w-3.5 h-3.5" />
                            {c.birthday}
                          </span>
                          {c.isBirthdaySoon && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                              ¡Cumple Pronto!
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                            {c.name}
                          </h3>
                          <p className="text-xs text-[#737373]">{c.phone}</p>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#DCC5A3]/30 text-[11px] text-[#525252]">
                          <span className="font-semibold block mb-1 text-[#2B2B2B]">Mensaje preparado:</span>
                          <p className="italic leading-relaxed">{bMsg}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => openWhatsApp(c.phone, bMsg)}
                        className="mt-4 w-full py-2.5 px-4 rounded-full bg-emerald-600 text-[#FFFFFF] text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Enviar Saludo por WhatsApp</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* TAB 3: CLIENTAS INACTIVAS / RECUPERACIÓN */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCC5A3]/40">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-[#2B2B2B]">
                    Campañas de Reactivación
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Clientas que hace tiempo no se atienden y pueden renovar su set.
                  </p>
                </div>
              </div>

              {/* Selector de umbral de días */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#737373]">Sin turnos hace más de:</span>
                {[30, 60, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setInactiveDaysThreshold(days)}
                    className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                      inactiveDaysThreshold === days
                        ? "bg-[#2B2B2B] text-[#FFFFFF]"
                        : "bg-[#F5F0E6] text-[#2B2B2B] hover:bg-[#DCC5A3]/40"
                    }`}
                  >
                    {days} días
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inactiveClients.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-[#FFFFFF] rounded-3xl border border-[#DCC5A3]/40 text-xs text-[#737373]">
                  ¡Buenas noticias! No hay clientas inactivas por más de {inactiveDaysThreshold} días.
                </div>
              ) : (
                inactiveClients.map((c) => {
                  const winbackMsg = `Hola ${c.name} ✨ ¡Hace tiempo no te vemos por ÁGAPE STUDIO y extrañamos mimar tus uñas! ¿Te gustaría agendar un turno esta semana para renovar tu set? Te esperamos con un descuento especial. 💅`;
                  return (
                    <div
                      key={c.id}
                      className="bg-[#FFFFFF] rounded-3xl p-5 border border-rose-200 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            Hace {c.daysSinceLastVisit} días
                          </span>
                          <span className="text-[11px] text-[#737373]">
                            Último: {c.lastVisit || "N/A"}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                            {c.name}
                          </h3>
                          <p className="text-xs text-[#737373]">{c.phone}</p>
                          {c.lastService && (
                            <p className="text-[11px] text-[#8C7A5B] font-medium mt-1">
                              Servicio anterior: {c.lastService}
                            </p>
                          )}
                        </div>

                        <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#DCC5A3]/30 text-[11px] text-[#525252]">
                          <span className="font-semibold block mb-1 text-[#2B2B2B]">Mensaje de reconexión:</span>
                          <p className="italic leading-relaxed">{winbackMsg}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => openWhatsApp(c.phone, winbackMsg)}
                        className="mt-4 w-full py-2.5 px-4 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        <span>Invitar a Volver por WhatsApp</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Modal para Editar Clienta */}
        {editingClient && (
          <div className="fixed inset-0 z-50 bg-[#2B2B2B]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#DCC5A3] shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F0E6] mb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                    Perfil de Clienta
                  </span>
                  <h2 className="font-cinzel text-xl font-bold text-[#2B2B2B]">
                    Editar Datos de Clienta
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="w-8 h-8 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-sm font-bold flex items-center justify-center hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveClient} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Teléfono (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                      Cumpleaños (DD/MM)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 18/09"
                      value={editBirthday}
                      onChange={(e) => setEditBirthday(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                      Categoría
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs bg-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="Nueva">Nueva</option>
                      <option value="Recurrente">Recurrente</option>
                      <option value="Frecuente">Frecuente</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                    Notas & Preferencias
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Preferencias de color, forma almendra, cutículas sensibles..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCC5A3]/60 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F5F0E6]">
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="px-4 py-2 rounded-full bg-[#F5F0E6] text-[#2B2B2B] text-xs font-semibold hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-semibold hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
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
