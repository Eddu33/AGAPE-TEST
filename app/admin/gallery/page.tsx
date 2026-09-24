"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import { getGalleryImages, uploadGalleryImage, deleteGalleryImage } from "../../actions";
import { Image as ImageIcon, Trash2, UploadCloud, Copy, CheckCircle2 } from "lucide-react";

type GalleryImage = {
  id: string;
  url: string;
  name: string | null;
  createdAt: Date;
};

export default function GalleryPage() {
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    loadImages();
  }, [router]);

  const loadImages = async () => {
    setLoading(true);
    const data = await getGalleryImages();
    setImages(data);
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const res = await uploadGalleryImage(base64String, file.name);
      if (res.success) {
        loadImages();
      } else {
        alert("Error al subir imagen");
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta imagen?")) return;
    const res = await deleteGalleryImage(id);
    if (res.success) {
      setImages((prev) => prev.filter((img) => img.id !== id));
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <AdminNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 pb-24 text-[#171717] dark:text-[#FFFFFF]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10 mb-8">
          <div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-[#D4AF37]" />
              Galería de Imágenes
            </h1>
            <p className="text-xs text-[#666666] dark:text-[#A0A0A0] font-light mt-1">
              Sube imágenes aquí para copiarlas y usarlas en tus servicios o configuraciones.
            </p>
          </div>
          <div>
            <label className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#181818] dark:bg-[#D4AF37] text-[#FFFFFF] dark:text-[#121212] text-xs font-bold hover:bg-[#D4AF37] hover:text-[#181818] dark:hover:bg-white transition-colors cursor-pointer shadow-md">
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? "Subiendo..." : "Subir Nueva Imagen"}</span>
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#DCC5A3]/50 dark:border-[#333333] rounded-3xl">
            <ImageIcon className="w-12 h-12 text-[#DCC5A3] mx-auto mb-3" />
            <p className="text-sm font-semibold">No hay imágenes en tu galería</p>
            <p className="text-xs text-[#666666] mt-1">Comienza subiendo algunas fotos de tus trabajos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img) => (
              <div key={img.id} className="group relative bg-[#FAF8F5] dark:bg-[#1A1A1A] rounded-2xl border border-[#E2DBD0] dark:border-[#333333] overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-[#222222]">
                  <img src={img.url} alt={img.name || "Gallery image"} className="object-cover w-full h-full" />
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopyUrl(img.url, img.id)}
                      className="px-3 py-1.5 bg-white text-black rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-[#D4AF37] hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedId === img.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === img.id ? "¡Copiado!" : "Copiar Link"}
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Borrar
                    </button>
                  </div>
                </div>
                <div className="p-2 text-center">
                  <p className="text-[10px] text-[#666666] dark:text-[#A0A0A0] truncate px-1">
                    {img.name || "Sin nombre"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
