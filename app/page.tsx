import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4 text-center">
      <div className="mb-8 overflow-hidden rounded-full shadow-lg">
        <Image
          src="/logo-salon.png"
          alt="Estilo & Corte Logo"
          width={120}
          height={120}
          className="object-cover"
          priority
        />
      </div>

      <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        Estilo & Corte
      </h1>

      <p className="mb-8 max-w-md text-lg text-slate-600">
        Reserva tu turno en segundos. La mejor experiencia para tu cabello, ahora al alcance de tu mano.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/book">
          <Button size="lg" className="h-14 w-full gap-2 px-8 text-lg sm:w-auto">
            <Calendar className="h-5 w-5" />
            Reservar Turno
          </Button>
        </Link>
      </div>

      <Footer />
    </main>
  );
}
