"use client";

import { useEffect, useState } from "react";
import {
  Gift,
  Plus,
  Tag,
  Calendar,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Percent,
} from "lucide-react";
import {
  getAdminPromotions,
  saveAdminPromotion,
  deleteAdminPromotion,
  getAdminVouchers,
  createAdminVoucher,
  updateVoucherStatus,
} from "../actions";
import { Promotion, Voucher } from "@/lib/db";

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<"vouchers" | "promos">("vouchers");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states for Promo
  const [promoForm, setPromoForm] = useState({
    nombre: "",
    descripcion: "",
    descuentoPorcentaje: "",
    precioPromo: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
  });

  // Form states for Voucher
  const [voucherForm, setVoucherForm] = useState({
    para: "",
    de: "",
    servicioONombre: "Kapping Gel + Esmaltado",
    monto: "",
    vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [promosData, vouchersData] = await Promise.all([
        getAdminPromotions(),
        getAdminVouchers(),
      ]);
      setPromotions(promosData);
      setVouchers(vouchersData);
      if (vouchersData.length > 0 && !previewVoucher) {
        setPreviewVoucher(vouchersData[0]);
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.nombre) return;

    await saveAdminPromotion({
      nombre: promoForm.nombre,
      descripcion: promoForm.descripcion,
      descuentoPorcentaje: promoForm.descuentoPorcentaje ? Number(promoForm.descuentoPorcentaje) : undefined,
      precioPromo: promoForm.precioPromo ? Number(promoForm.precioPromo) : undefined,
      fechaInicio: promoForm.fechaInicio,
      fechaFin: promoForm.fechaFin,
    });

    setShowPromoModal(false);
    setPromoForm({
      nombre: "",
      descripcion: "",
      descuentoPorcentaje: "",
      precioPromo: "",
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    });
    loadData();
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm("¿Eliminar esta promoción?")) return;
    await deleteAdminPromotion(id);
    loadData();
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherForm.para || !voucherForm.de || !voucherForm.servicioONombre) {
      alert("Por favor completa los nombres y el servicio o monto.");
      return;
    }

    const res = await createAdminVoucher({
      para: voucherForm.para,
      de: voucherForm.de,
      servicioONombre: voucherForm.servicioONombre,
      monto: voucherForm.monto ? Number(voucherForm.monto) : undefined,
      vencimiento: voucherForm.vencimiento,
    });

    if (res.success && res.voucher) {
      setPreviewVoucher(res.voucher);
      setShowVoucherModal(false);
      setVoucherForm({
        para: "",
        de: "",
        servicioONombre: "Kapping Gel + Esmaltado",
        monto: "",
        vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      });
      loadData();
    }
  };

  const handleStatusChange = async (id: string, status: Voucher["estado"]) => {
    await updateVoucherStatus(id, status);
    loadData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sendVoucherWhatsApp = (v: Voucher) => {
    const text = encodeURIComponent(
      `✨ *¡Tenés un Regalo Especial de ÁGAPE STUDIO!* ✨\n\n` +
      `💖 *Para:* ${v.para}\n` +
      `🎁 *De parte de:* ${v.de}\n` +
      `💅 *Válido por:* ${v.servicioONombre}${v.monto ? ` ($${v.monto.toLocaleString("es-AR")})` : ""}\n` +
      `🎟️ *Código de Canje:* *${v.codigo}*\n` +
      `⏳ *Vence el:* ${v.vencimiento}\n\n` +
      `Para coordinar tu turno, comunicate con nosotros y presentá tu código. ¡Te esperamos para consentirte!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FFFFFF] p-6 rounded-2xl border border-[#EAE0D5] shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#2B2B2B]">
            Promociones & Gift Vouchers
          </h1>
          <p className="text-sm text-[#666666] mt-1 font-montserrat">
            Fideliza clientas con tarjetas de regalo exclusivas y campañas de temporada.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === "vouchers" ? (
            <button
              onClick={() => setShowVoucherModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#D4AF37] text-[#2B2B2B] text-xs sm:text-sm font-semibold hover:bg-[#c49f2e] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generar Voucher de Regalo</span>
            </button>
          ) : (
            <button
              onClick={() => setShowPromoModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#D4AF37] text-[#2B2B2B] text-xs sm:text-sm font-semibold hover:bg-[#c49f2e] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Promoción</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-[#EAE0D5] pb-2">
        <button
          onClick={() => setActiveTab("vouchers")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-2.5 ${
            activeTab === "vouchers"
              ? "border-[#D4AF37] text-[#2B2B2B] font-bold bg-[#FAF8F5]"
              : "border-transparent text-[#777777] hover:text-[#2B2B2B]"
          }`}
        >
          <Gift className="w-4 h-4 text-[#D4AF37]" />
          <span>Vouchers de Regalo ({vouchers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("promos")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-2.5 ${
            activeTab === "promos"
              ? "border-[#D4AF37] text-[#2B2B2B] font-bold bg-[#FAF8F5]"
              : "border-transparent text-[#777777] hover:text-[#2B2B2B]"
          }`}
        >
          <Tag className="w-4 h-4 text-[#D4AF37]" />
          <span>Campañas & Promos ({promotions.length})</span>
        </button>
      </div>

      {/* TAB 1: VOUCHERS */}
      {activeTab === "vouchers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Tarjeta Visual de Previsualización */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-base font-cinzel font-bold text-[#2B2B2B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              Vista Previa de la Gift Card
            </h2>

            {previewVoucher ? (
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-linear-to-br from-[#2B2B2B] via-[#383838] to-[#1E1E1E] text-[#FFFFFF] shadow-xl border-2 border-[#D4AF37]/60">
                {/* Elementos decorativos */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-[#D4AF37]/15 rounded-full blur-xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex justify-between items-start border-b border-[#444444] pb-4">
                  <div>
                    <span className="text-[10px] tracking-widest uppercase text-[#D4AF37] font-semibold">
                      Tarjeta de Regalo Exclusiva
                    </span>
                    <h3 className="font-cinzel text-xl font-bold tracking-wider text-[#FFFFFF] mt-0.5">
                      ÁGAPE STUDIO
                    </h3>
                  </div>
                  <Gift className="w-7 h-7 text-[#D4AF37]" />
                </div>

                <div className="py-6 space-y-4 font-montserrat">
                  <div>
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">Para</p>
                    <p className="text-lg font-bold text-[#FAF8F5]">{previewVoucher.para}</p>
                  </div>

                  <div>
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">De parte de</p>
                    <p className="text-sm font-medium text-[#DCC5A3]">{previewVoucher.de}</p>
                  </div>

                  <div className="bg-[#FFFFFF]/5 rounded-xl p-3 border border-[#FFFFFF]/10">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">Válido por</p>
                    <p className="text-base font-semibold text-[#D4AF37]">
                      {previewVoucher.servicioONombre}
                      {previewVoucher.monto ? ` · $${previewVoucher.monto.toLocaleString("es-AR")}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-[10px] text-[#888888] uppercase tracking-wider">Código de canje</p>
                      <p className="font-mono text-base font-bold text-[#FFFFFF] tracking-widest">
                        {previewVoucher.codigo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#888888] uppercase tracking-wider">Vence el</p>
                      <p className="text-xs font-semibold text-[#EAE0D5]">{previewVoucher.vencimiento}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#444444] flex items-center justify-between gap-3">
                  <button
                    onClick={() => copyToClipboard(previewVoucher.codigo)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#DCC5A3] hover:text-[#FFFFFF] transition-colors"
                  >
                    {copiedCode === previewVoucher.codigo ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => sendVoucherWhatsApp(previewVoucher)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Enviar por WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FFFFFF] rounded-2xl border border-[#EAE0D5] text-[#888888]">
                Genera tu primer voucher para previsualizarlo aquí.
              </div>
            )}
          </div>

          {/* Columna Derecha: Lista de Vouchers */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-base font-cinzel font-bold text-[#2B2B2B]">
              Historial de Vouchers Emitidos
            </h2>

            {loading ? (
              <div className="p-8 text-center text-sm text-[#777777] bg-[#FFFFFF] rounded-2xl border border-[#EAE0D5]">
                Cargando vouchers...
              </div>
            ) : vouchers.length === 0 ? (
              <div className="p-8 text-center bg-[#FFFFFF] rounded-2xl border border-[#EAE0D5]">
                <Gift className="w-10 h-10 text-[#D4AF37] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-[#2B2B2B]">No hay vouchers emitidos aún</p>
                <p className="text-xs text-[#777777] mt-1">Crea gift cards para que tus clientas regalen a amigas y familiares.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vouchers.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setPreviewVoucher(v)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      previewVoucher?.id === v.id
                        ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-sm"
                        : "border-[#EAE0D5] hover:border-[#DCC5A3]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#EAE0D5] text-[#2B2B2B]">
                          {v.codigo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.estado === "DISPONIBLE"
                              ? "bg-green-100 text-green-800"
                              : v.estado === "CANJEADO"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {v.estado}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#2B2B2B]">
                        Para: {v.para} <span className="font-normal text-xs text-[#666666]">(De: {v.de})</span>
                      </p>
                      <p className="text-xs text-[#D4AF37] font-medium">
                        {v.servicioONombre} {v.monto ? `· $${v.monto.toLocaleString("es-AR")}` : ""}
                      </p>
                      <p className="text-[11px] text-[#888888] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Vence: {v.vencimiento}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={v.estado}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(v.id, e.target.value as Voucher["estado"]);
                        }}
                        className="text-xs border border-[#EAE0D5] rounded-lg p-1.5 bg-[#FAF8F5] text-[#2B2B2B] focus:outline-none"
                      >
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="CANJEADO">Canjeado</option>
                        <option value="VENCIDO">Vencido</option>
                      </select>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendVoucherWhatsApp(v);
                        }}
                        title="Enviar por WhatsApp"
                        className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-[#FFFFFF] transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROMOCIONES */}
      {activeTab === "promos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-cinzel font-bold text-[#2B2B2B]">
              Campañas y Descuentos Activos
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[#777777] bg-[#FFFFFF] rounded-2xl border border-[#EAE0D5]">
              Cargando promociones...
            </div>
          ) : promotions.length === 0 ? (
            <div className="p-8 text-center bg-[#FFFFFF] rounded-2xl border border-[#EAE0D5]">
              <Tag className="w-10 h-10 text-[#D4AF37] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-[#2B2B2B]">No hay promociones registradas</p>
              <p className="text-xs text-[#777777] mt-1">Crea descuentos por temporada (Día de la Madre, Primavera, etc.).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#FFFFFF] rounded-2xl border border-[#EAE0D5] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-cinzel font-bold text-base text-[#2B2B2B]">{p.nombre}</h3>
                      <button
                        onClick={() => handleDeletePromo(p.id)}
                        className="text-[#999999] hover:text-red-600 transition-colors p-1"
                        title="Eliminar promoción"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-[#666666] line-clamp-2">{p.descripcion}</p>

                    <div className="pt-2 flex items-baseline gap-2">
                      {p.descuentoPorcentaje ? (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                          <Percent className="w-3.5 h-3.5" />
                          {p.descuentoPorcentaje}% OFF
                        </span>
                      ) : null}
                      {p.precioPromo ? (
                        <span className="text-base font-bold text-[#D4AF37]">
                          ${p.precioPromo.toLocaleString("es-AR")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#EAE0D5] flex items-center justify-between text-[11px] text-[#888888]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {p.fechaInicio} al {p.fechaFin}
                    </span>
                    <span
                      className={`font-semibold ${
                        p.activo ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {p.activo ? "Activa" : "Pausada"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: GENERAR VOUCHER */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] w-full max-w-md rounded-2xl border border-[#EAE0D5] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#EAE0D5] pb-3">
              <h3 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                Generar Voucher de Regalo
              </h3>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-[#999999] hover:text-[#2B2B2B] text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#444444] font-medium mb-1">Para (Beneficiaria):</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía López"
                  value={voucherForm.para}
                  onChange={(e) => setVoucherForm({ ...voucherForm, para: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">De parte de:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Su amiga Valentina"
                  value={voucherForm.de}
                  onChange={(e) => setVoucherForm({ ...voucherForm, de: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">Servicio Incluido:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Kapping Gel + Esmaltado Liso"
                  value={voucherForm.servicioONombre}
                  onChange={(e) => setVoucherForm({ ...voucherForm, servicioONombre: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#444444] font-medium mb-1">Monto Opcional ($):</label>
                  <input
                    type="number"
                    placeholder="Ej: 15000"
                    value={voucherForm.monto}
                    onChange={(e) => setVoucherForm({ ...voucherForm, monto: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#444444] font-medium mb-1">Válido Hasta:</label>
                  <input
                    type="date"
                    required
                    value={voucherForm.vencimiento}
                    onChange={(e) => setVoucherForm({ ...voucherForm, vencimiento: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE0D5]">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#2B2B2B] font-semibold hover:bg-[#c49f2e] cursor-pointer"
                >
                  Generar Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR PROMOCIÓN */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] w-full max-w-md rounded-2xl border border-[#EAE0D5] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#EAE0D5] pb-3">
              <h3 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                Crear Promoción de Temporada
              </h3>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-[#999999] hover:text-[#2B2B2B] text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#444444] font-medium mb-1">Nombre de la Promoción:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Promo Amigas 2x1 o 15% OFF Kapping"
                  value={promoForm.nombre}
                  onChange={(e) => setPromoForm({ ...promoForm, nombre: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de la promo, condiciones o requisitos..."
                  value={promoForm.descripcion}
                  onChange={(e) => setPromoForm({ ...promoForm, descripcion: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#444444] font-medium mb-1">% de Descuento:</label>
                  <input
                    type="number"
                    placeholder="Ej: 15"
                    value={promoForm.descuentoPorcentaje}
                    onChange={(e) => setPromoForm({ ...promoForm, descuentoPorcentaje: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#444444] font-medium mb-1">O Precio Fijo Promo ($):</label>
                  <input
                    type="number"
                    placeholder="Ej: 12000"
                    value={promoForm.precioPromo}
                    onChange={(e) => setPromoForm({ ...promoForm, precioPromo: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#444444] font-medium mb-1">Fecha Inicio:</label>
                  <input
                    type="date"
                    required
                    value={promoForm.fechaInicio}
                    onChange={(e) => setPromoForm({ ...promoForm, fechaInicio: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#444444] font-medium mb-1">Fecha Fin:</label>
                  <input
                    type="date"
                    required
                    value={promoForm.fechaFin}
                    onChange={(e) => setPromoForm({ ...promoForm, fechaFin: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#EAE0D5] bg-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE0D5]">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#2B2B2B] font-semibold hover:bg-[#c49f2e] cursor-pointer"
                >
                  Crear Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
