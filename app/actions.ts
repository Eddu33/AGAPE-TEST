"use server";

import { getData, saveData } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { format, startOfDay, isSameDay } from "date-fns";

export async function bookAppointment(data: { name: string; phone: string; date: Date }) {
    try {
        const db = getData();

        // Check if client exists
        let client = db.clients.find((c: any) => c.phone === data.phone);

        if (!client) {
            client = {
                id: uuidv4(),
                name: data.name,
                phone: data.phone,
                createdAt: new Date().toISOString(),
            };
            db.clients.push(client);
        }

        // Create appointment
        const appointment = {
            id: uuidv4(),
            date: data.date.toISOString(),
            clientId: client.id,
            status: "PENDING",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        db.appointments.push(appointment);
        saveData(db);

        return { success: true, appointmentId: appointment.id };
    } catch (error) {
        console.error("Booking error:", error);
        return { success: false, error: "Failed to book appointment" };
    }
}

export async function getAvailability(date: Date) {
    console.log("Checking availability for:", date);
    try {
        const db = getData();
        const targetDate = startOfDay(new Date(date));
        console.log("Target date:", targetDate);

        const dayAppointments = db.appointments.filter((apt: any) => {
            return isSameDay(new Date(apt.date), targetDate);
        });
        console.log("Found appointments:", dayAppointments.length);

        const availability: Record<string, number> = {};
        dayAppointments.forEach((apt: any) => {
            const time = format(new Date(apt.date), "HH:mm");
            availability[time] = (availability[time] || 0) + 1;
        });
        console.log("Availability map:", availability);

        return availability;
    } catch (error) {
        console.error("Availability error:", error);
        return {};
    }
}
export async function getAppointmentById(id: string) {
    try {
        const db = getData();
        const appointment = db.appointments.find((a: any) => a.id === id);
        if (!appointment) return null;

        const client = db.clients.find((c: any) => c.id === appointment.clientId);
        return {
            ...appointment,
            client
        };
    } catch (error) {
        console.error("Error fetching appointment:", error);
        return null;
    }
}
