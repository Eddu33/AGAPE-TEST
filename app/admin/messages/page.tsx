"use client";

import { useEffect, useState } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import {
  MessageSquare,
  Sparkles,
  Save,
  Copy,
  Check,
  Smartphone,
  Info,
  Calendar,
  Gift,
  HeartHandshake,
  CheckCheck,
} from "lucide-react";
import { getAdminTemplates, saveAdminTemplate } from "../actions";
import { MessageTemplate } from "@/lib/db";

export default function AdminMessagesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [currentText, setCurrentText] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getAdminTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0]);
        setCurrentText(data[0].texto);
      }
    }
    load();
  }, []);

  const handleSelect = (tpl: MessageTemplate) => {
    setSelectedTemplate(tpl);
    setCurrentText(tpl.texto);
    setSavedSuccess(false);
  };

  const handleInsertVariable = (varName: string) => {
    setCurrentText((prev) => prev + ` ${varName}`);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    await saveAdminTemplate(selectedTemplate.id, currentText);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    // Actualizar local
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedTemplate.id ? { ...t, texto: currentText } : t))
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render preview replacing variables with demo values
  const getPreviewText = () => {
    return currentText
      .replace(/\[nombre\]/g, "Sofía")
      .replace(/\[fecha\]/g, "Viernes 20 de Septiembre")
      .replace(/\[hora\]/g, "15:30")
      .replace(/\[servicio\]/g, "Kapping Gel + Esmaltado")
      .replace(/\[precio\]/g, "14.500");
  };

  const getTemplateIcon = (tipo: MessageTemplate["tipo"]) => {
    switch (tipo) {
      case "CONFIRMACION":
        return <CheckCheck className="w-4 h-4 text-green-600" />;
      case "RECORDATORIO_24H":
      case "RECORDATORIO_48H":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "CUMPLEANOS":
        return <Gift className="w-4 h-4 text-amber-500" />;
      case "RECUPERACION_INACTIVA":
        return <HeartHandshake className="w-4 h-4 text-rose-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <AdminNavbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FFFFFF] p-6 rounded-2xl border border-[#EAE0D5] shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#2B2B2B]">
            Plantillas de Mensajes (WhatsApp)
          </h1>
          <p className="text-sm text-[#666666] mt-1 font-montserrat">
            Personaliza los textos automáticos con variables dinámicas para enviar a tus clientas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Lista de Plantillas y Editor */}
        <div className="lg:col-span-7 space-y-6">
          {/* Selector de Plantilla */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {templates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleSelect(tpl)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#D4AF37] bg-[#FAF8F5] ring-2 ring-[#D4AF37]/20 shadow-xs"
                      : "border-[#EAE0D5] bg-[#FFFFFF] hover:border-[#DCC5A3]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {getTemplateIcon(tpl.tipo)}
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                  </div>
                  <span className="text-xs font-bold text-[#2B2B2B] line-clamp-1">
                    {tpl.titulo}
                  </span>
                  <span className="text-[10px] text-[#888888] capitalize">
                    {tpl.tipo.toLowerCase()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Caja de Edición */}
          {selectedTemplate && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE0D5] p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-[#EAE0D5] pb-3">
                <div>
                  <h2 className="font-cinzel text-lg font-bold text-[#2B2B2B]">
                    {selectedTemplate.titulo}
                  </h2>
                  <p className="text-xs text-[#777777]">
                    Edita el cuerpo del mensaje. Usa las etiquetas para rellenar datos automáticamente.
                  </p>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs text-[#666666] hover:text-[#2B2B2B] p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Variables Disponibles */}
              <div>
                <span className="text-xs font-semibold text-[#444444] block mb-2">
                  Variables dinámicas (haz clic para insertar):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedTemplate.variables || ["[nombre]", "[fecha]", "[hora]", "[servicio]", "[precio]"]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#FAF8F5] border border-[#EAE0D5] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors cursor-pointer"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  rows={8}
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#EAE0D5] bg-[#FAF8F5] text-[#2B2B2B] text-sm focus:outline-none focus:border-[#D4AF37] leading-relaxed font-sans"
                  placeholder="Escribe el mensaje aquí..."
                />
              </div>

              {/* Botón Guardar */}
              <div className="flex items-center justify-between pt-2">
                {savedSuccess ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Plantilla guardada con éxito
                  </span>
                ) : (
                  <span className="text-xs text-[#888888] flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Se aplicará a los próximos envíos de WhatsApp
                  </span>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#2B2B2B] text-xs font-bold hover:bg-[#c49f2e] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Guardando..." : "Guardar Plantilla"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Vista Previa Simulador de WhatsApp */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-cinzel font-bold text-[#2B2B2B] flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#D4AF37]" />
            Simulador de Chat en WhatsApp
          </h2>

          <div className="max-w-sm mx-auto bg-[#ECE5DD] rounded-3xl border-8 border-[#2B2B2B] shadow-2xl overflow-hidden">
            {/* WhatsApp Top Bar */}
            <div className="bg-[#075E54] text-[#FFFFFF] px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center font-cinzel font-bold text-xs text-[#2B2B2B]">
                A
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">ÁGAPE STUDIO</p>
                <p className="text-[10px] text-green-200">En línea</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-3 min-h-[380px] flex flex-col justify-end bg-[radial-gradient(#d3c9bf_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Burbuja del mensaje saliente */}
              <div className="self-end max-w-[90%] bg-[#E7FFDB] text-[#111111] p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs whitespace-pre-wrap leading-relaxed font-sans relative">
                {getPreviewText()}
                <div className="text-[9px] text-[#777777] text-right mt-1 flex items-center justify-end gap-1">
                  <span>14:32</span>
                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                </div>
              </div>
            </div>

            {/* WhatsApp Bottom Input Dummy */}
            <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 border-t border-[#E0E0E0]">
              <div className="flex-1 bg-[#FFFFFF] rounded-full px-3 py-1.5 text-[11px] text-gray-400">
                Mensaje
              </div>
              <div className="w-7 h-7 rounded-full bg-[#075E54] flex items-center justify-center text-white text-xs">
                ➤
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
