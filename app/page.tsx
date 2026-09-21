import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroCover from "@/components/HeroCover";
import { Sparkles, Calendar, Clock, ArrowRight, Check } from "lucide-react";
import { getPublicServices } from "./actions";
import { formatPrice, formatDuration } from "@/lib/services";

export default async function Home() {
  const allServices = await getPublicServices();
  const serviciosDestacados =
    allServices.filter((s) => s.destacado).length > 0
      ? allServices.filter((s) => s.destacado)
      : allServices.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5] dark:bg-[#0D0D0D] transition-colors duration-200">
      <Navbar />

      {/* PRIMERA SECCIÓN: SOLO EL BACKGROUND (Se desvanece al escrolear) */}
      <HeroCover />

      {/* SECCIÓN DE INFORMACIÓN: Con fondo adaptativo para legibilidad perfecta */}
      <div id="informacion" className="relative z-10 bg-[#FAF8F5] dark:bg-[#0D0D0D] transition-colors duration-200">
        {/* HERO CONTENT / INFORMACIÓN PRINCIPAL */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-[#262626]/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Badge sutil */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818] border border-[#333333] shadow-md text-xs font-medium text-[#E0E0E0] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="tracking-wide">Estudio Exclusivo de Manicuría</span>
            </div>

            {/* Título Principal */}
            <h1 className="font-cinzel text-4xl sm:text-6xl font-bold tracking-wider text-[#FFFFFF] mb-4">
              ÁGAPE STUDIO
            </h1>

            {/* Esencia */}
            <p className="font-cinzel text-lg sm:text-2xl text-[#D4AF37] italic font-normal mb-6">
              “La belleza nace del amor perfecto”
            </p>

            {/* Descripción */}
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#A3A3A3] font-light leading-relaxed mb-10">
              Un espacio creado para consentirte y recordar tu valor único. Te brindamos un servicio de manicuría personalizado, técnicas avanzadas de cuidado y un ambiente cálido para desconectarte y brillar.
            </p>

            {/* Botones de acción (CTA) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#D4AF37] text-[#121212] font-bold text-base hover:bg-[#FFFFFF] hover:text-[#121212] transition-all duration-300 shadow-lg group"
              >
                <Calendar className="w-5 h-5 text-[#121212]" />
                <span>Reservar mi Turno</span>
              </Link>

              <Link
                href="/servicios"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#181818] text-[#FFFFFF] border border-[#333333] font-medium text-base hover:border-[#D4AF37] hover:bg-[#222222] transition-colors"
              >
                <span>Ver Servicios & Precios</span>
                <ArrowRight className="w-4 h-4 text-[#A3A3A3]" />
              </Link>
            </div>
          </div>
        </section>

      {/* SECCIÓN DE SERVICIOS DESTACADOS */}
      <section id="servicios" className="py-16 sm:py-24 bg-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
              Tratamientos Especializados
            </span>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-semibold text-[#FFFFFF] mt-2 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-sm text-[#A3A3A3] font-light">
              Cada servicio incluye preparación minuciosa y esmaltado profesional, garantizando durabilidad y protección para tus uñas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviciosDestacados.map((servicio) => (
              <div
                key={servicio.id}
                className={`group relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 backdrop-blur-md ${
                  servicio.destacado
                    ? "bg-[#1C1813]/90 border border-[#D4AF37] shadow-xl ring-1 ring-[#D4AF37]/30"
                    : "bg-[#161616]/85 border border-[#2D2D2D] shadow-md hover:border-[#D4AF37]/50"
                }`}
              >
                {servicio.destacado && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#D4AF37] text-[#121212] text-[10px] font-bold tracking-wider uppercase shadow-md z-10">
                    Más Elegido
                  </div>
                )}

                <div>
                  {/* Imagen del estilo de uñas terminado */}
                  {servicio.imagenUrl && (
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 bg-[#121212] border border-[#2A2A2A]">
                      <img
                        src={servicio.imagenUrl}
                        alt={servicio.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-[#D4AF37] font-medium mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#242424] text-[10px] font-semibold text-[#D4AF37] border border-[#333333]">
                      {servicio.categoria}
                    </span>
                    <span className="flex items-center gap-1 text-[#A3A3A3]">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {formatDuration(servicio.duracion)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-cinzel text-xl font-bold text-[#FFFFFF]">
                      {servicio.nombre}
                    </h3>
                    <span className="font-cinzel text-base font-bold text-[#D4AF37] whitespace-nowrap">
                      {formatPrice(servicio.precio)}
                    </span>
                  </div>

                  <p className="text-xs text-[#A3A3A3] font-light leading-relaxed mb-5">
                    {servicio.descripcion}
                  </p>

                  {servicio.queIncluye && servicio.queIncluye.length > 0 && (
                    <div className="border-t border-[#2A2A2A] pt-4 mb-6">
                      <div className="text-[11px] font-semibold text-[#E0E0E0] uppercase tracking-wider mb-2">
                        Qué incluye:
                      </div>
                      <ul className="space-y-1.5">
                        {servicio.queIncluye.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-[#CCCCCC]">
                            <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#2A2A2A] pt-4 mt-auto">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs text-[#888888]">Mantenimiento:</span>
                    <span className="text-xs font-semibold text-[#FFFFFF]">
                      {servicio.mantenimientoDias ? `${servicio.mantenimientoDias} días` : "A consultar"}
                    </span>
                  </div>

                  <Link
                    href={`/book?service=${servicio.id}`}
                    className={`w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                      servicio.destacado
                        ? "bg-[#D4AF37] text-[#121212] font-bold hover:bg-[#FFFFFF]"
                        : "bg-[#242424] text-[#FFFFFF] border border-[#333333] hover:border-[#D4AF37] hover:bg-[#2C2C2C]"
                    }`}
                  >
                    Elegir este servicio
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Banner de extras y nail art */}
          <div className="mt-12 p-6 rounded-2xl bg-[#161616]/90 border border-[#2D2D2D] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h4 className="font-cinzel text-base font-semibold text-[#FFFFFF]">
                ¿Querés sumar diseño a tus uñas?
              </h4>
              <p className="text-xs text-[#A3A3A3] font-light mt-1">
                Contamos con Nail Art personalizado, cristales, efecto cromo, francesita y remoción de trabajos anteriores. Podrás agregarlos al momento de reservar.
              </p>
            </div>
            <Link
              href="/servicios"
              className="shrink-0 px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#121212] text-xs font-bold hover:bg-[#FFFFFF] transition-colors"
            >
              Ver extras al reservar
            </Link>
          </div>
        </div>
      </section>

      {/* LLAMADO A LA ACCIÓN FINAL */}
      <section className="py-16 bg-transparent border-t border-[#262626]/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-10 h-10 rounded-full bg-[#181818] border border-[#333333] flex items-center justify-center mx-auto mb-4 text-[#D4AF37] shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#FFFFFF] mb-3">
            Cuidá tus manos con la excelencia que merecés
          </h2>
          <p className="text-sm text-[#A3A3A3] font-light mb-8 max-w-lg mx-auto">
            Reservá tu turno de forma rápida y sencilla desde cualquier dispositivo. Elegí tu servicio favorito y el horario que mejor se adapte a tu día.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#D4AF37] text-[#121212] font-bold text-base hover:bg-[#FFFFFF] transition-all shadow-lg"
          >
            <Calendar className="w-5 h-5 text-[#121212]" />
            <span>Reservar Turno Ahora</span>
          </Link>
        </div>
      </section>
      </div>

      <Footer />
    </div>
  );
}
