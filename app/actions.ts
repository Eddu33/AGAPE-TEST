"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function bookAppointment(data: { name: string; phone: string; date: Date }) {
    try {
        // Find or create client
        const client = await prisma.client.upsert({
            where: { phone: data.phone },
            update: { name: data.name },
            create: {
                name: data.name,
                phone: data.phone
            }
        });

        // Create appointment
        const appointment = await prisma.appointment.create({
            data: {
                date: data.date,
                clientId: client.id,
                status: "PENDING"
            }
        });

        return { success: true, appointmentId: appointment.id };
    } catch (error: any) {
        console.error("DETAILED Booking error:", error.message || error);
        return {
            success: false,
            error: error.message?.includes("protocol")
                ? "Error de configuracion de base de datos (Protocolo)"
                : "Error al realizar la reserva"
        };
    }
}

export async function getAvailability(date: Date) {
    try {
        const targetDate = new Date(date);
        const appointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: startOfDay(targetDate),
                    lte: endOfDay(targetDate)
                },
                status: {
                    not: "CANCELLED"
                }
            }
        });

        const availability: Record<string, number> = {};
        appointments.forEach((apt) => {
            const time = apt.date.toISOString().split('T')[1].substring(0, 5); // HH:mm
            availability[time] = (availability[time] || 0) + 1;
        });

        return availability;
    } catch (error) {
        console.error("Availability error:", error);
        return {};
    }
}

export async function getAppointmentById(id: string) {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { client: true }
        });
        return appointment;
    } catch (error) {
        console.error("Error fetching appointment:", error);
        return null;
    }
}
