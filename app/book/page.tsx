"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { bookAppointment, getAvailability } from "../actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Footer from "@/components/Footer";

const formSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  phone: z.string().min(8, "El teléfono debe tener al menos 8 números"),
});

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30"
];

export default function BookPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAvailability = async (selectedDate: Date) => {
    setLoadingAvailability(true);
    try {
      const data = await getAvailability(selectedDate);
      setAvailability(data);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!date || !time) return;

    const dateTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    dateTime.setHours(hours, minutes, 0, 0);

    const result = await bookAppointment({
      name: values.name,
      phone: values.phone,
      date: dateTime,
    });

    if (result.success) {
      router.push(`/book/confirmation?id=${result.appointmentId}`);
    } else {
      alert("Error al reservar: " + result.error);
    }
  };

  if (!mounted) return null;

  return (
    <main className="container mx-auto max-w-md p-4 pb-20">
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="overflow-hidden rounded-full border shadow-md">
          <Image
            src="/logo-salon.png"
            alt="Logo"
            width={80}
            height={80}
            className="object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold text-center">Reservar Turno</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">1. Elige una fecha</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              setDate(selectedDate);
              if (selectedDate) {
                fetchAvailability(selectedDate);
                setTime(null);
              }
            }}
            className="rounded-md border"
            locale={es}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </CardContent>
      </Card>

      {date && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">2. Elige un horario</CardTitle>
              {loadingAvailability && <span className="text-xs text-slate-400">Cargando...</span>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => {
                const count = availability[slot] || 0;
                const isFull = count >= 2;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => !isFull && setTime(slot)}
                    disabled={isFull}
                    className={`
                      flex flex-col items-center justify-center py-2 px-1 rounded-md border transition-all
                      ${time === slot ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-900'}
                      ${isFull ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : ''}
                    `}
                  >
                    <span className="font-bold text-sm">{slot}</span>
                    <span className="text-[10px] uppercase">
                      {isFull ? "Completo" : count === 1 ? "1 lugar" : "2 lugares"}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {date && time && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Tus datos</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" {...form.register("name")} placeholder="Ej: Juan Pérez" />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
                <Input id="phone" type="tel" {...form.register("phone")} placeholder="Ej: 1122334455" />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Confirmando..." : "Confirmar Reserva"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      <Footer />
    </main>
  );
}
