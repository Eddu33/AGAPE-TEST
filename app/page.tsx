import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sparkles, Calendar, Clock, ArrowRight, Check } from "lucide-react";

export default function Home() {
  const serviciosDestacados = [
    {
      id: "kapping",
      nombre: "Kapping Gel",
      categoria: "Fortalecimiento",
      duracion: "90 min",
      mantenimiento: "21 días",
      descripcion: "Capa protectora de gel nivelador sobre tu uña natural para evitar quiebres y permitir un crecimiento sano y fuerte.",
      incluye: ["Manicuría combinada / rusa", "Nivelación con gel", "Esmaltado liso o french"],
      precioSugerido: "$15.000",
      destacado: true,
    },
    {
      id: "semi",
      nombre: "Esmaltado Semipermanente",
      categoria: "Color & Brillo",
      duracion: "60 min",
      mantenimiento: "15 a 20 días",
      descripcion: "Cuidado delicado de cutículas, preparación sin dañar la lámina y esmaltado de alta duración con acabado brillante.",
      incluye: ["Limpieza profunda de cutículas", "Base vitaminada", "Color a elección + Top Coat"],
      precioSugerido: "$12.000",
      destacado: false,
    },
    {
      id: "softgel",
      nombre: "Soft Gel Tips",
      categoria: "Extensiones",
      duracion: "120 min",
      mantenimiento: "21 días",
      descripcion: "Extensiones completas elaboradas con gel ultra resistente y flexible. Alargan tus uñas con apariencia natural y ligera.",
      incluye: ["Preparación completa", "Colocación de tips de gel", "Limado a forma deseada", "Esmaltado"],
      precioSugerido: "$19.000",
      destacado: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5F0E6]/70 via-[#F5F0E6]/30 to-[#FFFFFF] pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-[#DCC5A3]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge sutil */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DCC5A3] shadow-2xs text-xs font-medium text-[#2B2B2B] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="tracking-wide">Estudio Exclusivo de Manicuría</span>
          </div>

          {/* Título Principal */}
          <h1 className="font-cinzel text-4xl sm:text-6xl font-bold tracking-wider text-[#2B2B2B] mb-4">
            ÁGAPE STUDIO
          </h1>

          {/* Esencia */}
          <p className="font-cinzel text-lg sm:text-2xl text-[#D4AF37] italic font-normal mb-6">
            “La belleza nace del amor perfecto”
          </p>

          {/* Descripción */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#525252] font-light leading-relaxed mb-10">
            Un espacio creado para consentirte y recordar tu valor único. Te brindamos un servicio de manicuría personalizado, técnicas avanzadas de cuidado y un ambiente cálido para desconectarte y brillar.
          </p>

          {/* Botones de acción (CTA) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#2B2B2B] text-[#FFFFFF] font-medium text-base hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-all duration-300 shadow-md hover:shadow-lg group"
            >
              <Calendar className="w-5 h-5 text-[#D4AF37] group-hover:text-[#2B2B2B] transition-colors" />
              <span>Reservar mi Turno</span>
            </Link>

            <Link
              href="/servicios"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#FFFFFF] text-[#2B2B2B] border border-[#DCC5A3] font-medium text-base hover:bg-[#F5F0E6] transition-colors"
            >
              <span>Ver Servicios & Precios</span>
              <ArrowRight className="w-4 h-4 text-[#737373]" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE SERVICIOS DESTACADOS */}
      <section id="servicios" className="py-16 sm:py-24 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
              Tratamientos Especializados
            </span>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-semibold text-[#2B2B2B] mt-2 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-sm text-[#666666] font-light">
              Cada servicio incluye preparación minuciosa y esmaltado profesional, garantizando durabilidad y protección para tus uñas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviciosDestacados.map((servicio) => (
              <div
                key={servicio.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 bg-[#FFFFFF] border transition-all duration-300 ${
                  servicio.destacado
                    ? "border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/20"
                    : "border-[#DCC5A3]/40 shadow-xs hover:border-[#DCC5A3]"
                }`}
              >
                {servicio.destacado && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#D4AF37] text-[#2B2B2B] text-[10px] font-bold tracking-wider uppercase shadow-xs">
                    Más Elegido
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-xs text-[#8C7A5B] font-medium mb-2">
                    <span>{servicio.categoria}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {servicio.duracion}
                    </span>
                  </div>

                  <h3 className="font-cinzel text-xl font-bold text-[#2B2B2B] mb-2">
                    {servicio.nombre}
                  </h3>

                  <p className="text-xs text-[#666666] font-light leading-relaxed mb-5">
                    {servicio.descripcion}
                  </p>

                  <div className="border-t border-[#F5F0E6] pt-4 mb-6">
                    <div className="text-[11px] font-semibold text-[#2B2B2B] uppercase tracking-wider mb-2">
                      Qué incluye:
                    </div>
                    <ul className="space-y-1.5">
                      {servicio.incluye.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-[#525252]">
                          <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-[#F5F0E6] pt-4 mt-auto">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-xs text-[#737373]">Mantenimiento:</span>
                    <span className="text-xs font-medium text-[#2B2B2B]">{servicio.mantenimiento}</span>
                  </div>

                  <Link
                    href="/book"
                    className={`w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                      servicio.destacado
                        ? "bg-[#2B2B2B] text-[#FFFFFF] hover:bg-[#D4AF37] hover:text-[#2B2B2B]"
                        : "bg-[#F5F0E6] text-[#2B2B2B] hover:bg-[#DCC5A3]/40"
                    }`}
                  >
                    Elegir este servicio
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Banner de extras y nail art */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#F5F0E6] to-[#FFFFFF] border border-[#DCC5A3]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-cinzel text-base font-semibold text-[#2B2B2B]">
                ¿Querés sumar diseño a tus uñas?
              </h4>
              <p className="text-xs text-[#666666] font-light mt-1">
                Contamos con Nail Art personalizado, cristales, efecto cromo, francesita y remoción de trabajos anteriores. Podrás agregarlos al momento de reservar.
              </p>
            </div>
            <Link
              href="/servicios"
              className="shrink-0 px-5 py-2.5 rounded-full bg-[#2B2B2B] text-[#FFFFFF] text-xs font-medium hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-colors"
            >
              Ver extras al reservar
            </Link>
          </div>
        </div>
      </section>

      {/* LLAMADO A LA ACCIÓN FINAL */}
      <section className="py-16 bg-[#FFFFFF]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-10 h-10 rounded-full bg-[#F5F0E6] border border-[#DCC5A3] flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#2B2B2B] mb-3">
            Cuidá tus manos con la excelencia que merecés
          </h2>
          <p className="text-sm text-[#666666] font-light mb-8 max-w-lg mx-auto">
            Reservá tu turno de forma rápida y sencilla desde cualquier dispositivo. Elegí tu servicio favorito y el horario que mejor se adapte a tu día.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#2B2B2B] text-[#FFFFFF] font-medium text-base hover:bg-[#D4AF37] hover:text-[#2B2B2B] transition-all shadow-md"
          >
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <span>Reservar Turno Ahora</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
