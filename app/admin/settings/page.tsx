"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import { getStudioSettings, updateStudioSettings } from "../../actions";
import { Settings, Save, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [enableInShopBooking, setEnableInShopBooking] = useState(true);
  const [enableAtHomeBooking, setEnableAtHomeBooking] = useState(true);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      const res = await getStudioSettings();
      setWhatsappPhone(res.whatsappPhone || "");
      setEnableInShopBooking(res.enableInShopBooking ?? true);
      setEnableAtHomeBooking(res.enableAtHomeBooking ?? true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateStudioSettings({
        whatsappPhone,
        enableInShopBooking,
        enableAtHomeBooking,
      });
      if (res.success) {
        setMessage({ text: "Configuración guardada exitosamente.", type: "success" });
      } else {
        setMessage({ text: res.error || "Error al guardar la configuración.", type: "error" });
      }
    } catch (error: any) {
      setMessage({ text: error.message || "Error al procesar la solicitud.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <AdminNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 text-[#171717] dark:text-[#FFFFFF]">
        <div className="flex flex-col gap-4 border-b border-black/10 dark:border-white/10 pb-6 mb-8">
          <div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold">
              Configuración del Estudio
            </h1>
            <p className="text-xs text-[#666666] dark:text-[#A0A0A0] font-light mt-1">
              Administra los números de contacto y opciones de reserva para clientas.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium mb-6 flex items-center gap-2 border ${
              message.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60"
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

        {loading ? (
          <div className="text-center p-8 text-sm">Cargando configuración...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-[#DDD8CF] dark:border-[#333333] shadow-md">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Número de WhatsApp (Notificaciones)
              </label>
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="Ej: 5493512345678"
                className="w-full px-4 py-2 rounded-xl border border-[#DCC5A3]/60 dark:border-[#333333] bg-transparent focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Modalidad de Atención
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableInShopBooking}
                    onChange={(e) => setEnableInShopBooking(e.target.checked)}
                    className="w-5 h-5 rounded border-[#DCC5A3]/60 accent-[#D4AF37]"
                  />
                  <span className="text-sm">Activar "En el local"</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAtHomeBooking}
                    onChange={(e) => setEnableAtHomeBooking(e.target.checked)}
                    className="w-5 h-5 rounded border-[#DCC5A3]/60 accent-[#D4AF37]"
                  />
                  <span className="text-sm">Activar "A domicilio"</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#181818] dark:bg-[#D4AF37] text-[#FFFFFF] dark:text-[#121212] text-sm font-bold hover:bg-[#D4AF37] hover:text-[#181818] dark:hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
