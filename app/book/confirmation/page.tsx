"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MessageCircle, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getAppointmentById } from "../../actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Footer from "@/components/Footer";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchAppointment(id);
    }
  }, [id]);

  const fetchAppointment = async (appointmentId: string) => {
    const data = await getAppointmentById(appointmentId);
    setAppointment(data);
  };

  const getWhatsAppLink = () => {
    if (!appointment) return "https://wa.me/5493516002716";

    const dateStr = format(new Date(appointment.date), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
    const message = encodeURIComponent(`¡Hola! Acabo de reservar un turno:\n\n👤 *Nombre:* ${appointment.client.name}\n📅 *Fecha:* ${dateStr}\n\n¿Me podrían confirmar?`);
    return `https://wa.me/5493516002716?text=${message}`;
  };

  return (
    <main className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-4">
      <div className="mb-6 overflow-hidden rounded-full border shadow-md">
        <Image
          src="/logo.png"
          alt="Logo"
          width={80}
          height={80}
          className="object-cover"
        />
      </div>

      <Card className="w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl text-green-700">¡Reserva Confirmada!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-slate-600">
              Tu turno ha sido registrado con éxito.
            </p>
            <Link
              href="https://maps.app.goo.gl/DMqyoukjydYWJd6k8"
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-sky-500 font-bold hover:underline bg-sky-50 px-3 py-1 rounded-full border border-sky-100"
            >
              <MapPin className="h-4 w-4" />
              Ver cómo llegar en Google Maps
            </Link>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            <p>Te esperamos en el salón.</p>
            <p>Si necesitas cancelar, por favor avísanos.</p>
          </div>

          <Button asChild className="w-full gap-2 bg-green-600 hover:bg-green-700">
            <Link href={getWhatsAppLink()} target="_blank">
              <MessageCircle className="h-5 w-5" />
              Notificar por WhatsApp
            </Link>
          </Button>

          <Button variant="ghost" asChild className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
      <Footer />
    </main>
  );
}
