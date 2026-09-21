import type { Metadata, Viewport } from "next";
import { Cinzel, Montserrat } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D0D0D",
};

export const metadata: Metadata = {
  title: "ÁGAPE STUDIO | Manicuría & Cuidado de Uñas",
  description: "La belleza nace del amor perfecto. Sistema de turnos y estética de uñas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${cinzel.variable} ${montserrat.variable} antialiased min-h-screen flex flex-col bg-[#0D0D0D] text-[#F5F5F5] selection:bg-[#D4AF37] selection:text-[#0D0D0D] relative`}
      >
        {/* Fondo global Dark Luxury con ÁGAPE (Visible en cliente y admin) */}
        <div
          className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
          aria-hidden="true"
        >
          {/* Base negra ultra profunda */}
          <div className="absolute inset-0 bg-[#0A0A0A]" />

          {/* Textura ambiental difusa a pantalla completa con agape-bg */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 filter blur-[2px] scale-102"
            style={{ backgroundImage: "url('/agape-bg.jpg')" }}
          />

          {/* Monograma central ÁGAPE con relieve visible y elegante */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="w-full max-w-2xl aspect-square bg-contain bg-center bg-no-repeat opacity-70 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
              style={{ backgroundImage: "url('/agape-bg.jpg')" }}
            />
          </div>

          {/* Degradado y viñeta sutil para asegurar contraste y legibilidad cristalina */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-[#0A0A0A]/35 to-[#0A0A0A]/85" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen bg-transparent">
          {children}
        </div>
      </body>
    </html>
  );
}
