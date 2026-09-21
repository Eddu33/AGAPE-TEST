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
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${cinzel.variable} ${montserrat.variable} antialiased min-h-screen flex flex-col bg-[#FAF8F5] text-[#171717] dark:bg-[#0D0D0D] dark:text-[#F5F5F5] selection:bg-[#D4AF37] selection:text-[#0D0D0D] relative transition-colors duration-200`}
      >
        <div className="relative z-10 flex flex-col min-h-screen bg-[#FAF8F5] dark:bg-[#0D0D0D] transition-colors duration-200">
          {children}
        </div>
      </body>
    </html>
  );
}
