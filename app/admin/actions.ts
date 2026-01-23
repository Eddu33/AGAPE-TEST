"use server";

import { getData, saveData } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAppointments() {
    const db = getData();
    return db.appointments.map((apt: any) => ({
        ...apt,
        client: db.clients.find((c: any) => c.id === apt.clientId)
    })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function updateAppointmentStatus(id: string, status: string, paymentMethod?: string) {
    const db = getData();
    const index = db.appointments.findIndex((apt: any) => apt.id === id);
    if (index !== -1) {
        db.appointments[index].status = status;
        db.appointments[index].paymentMethod = paymentMethod || null;
        db.appointments[index].updatedAt = new Date().toISOString();
        saveData(db);
    }
    revalidatePath("/admin/dashboard");
}

export async function deleteAppointment(id: string) {
    const db = getData();
    db.appointments = db.appointments.filter((apt: any) => apt.id !== id);
    saveData(db);
    revalidatePath("/admin/dashboard");
}

export async function getStats() {
    const db = getData();
    const appointments = db.appointments;

    const total = appointments.length;
    const completed = appointments.filter((a: any) => a.status === "COMPLETED").length;
    const cancelled = appointments.filter((a: any) => a.status === "CANCELLED").length;

    const cash = appointments.filter((a: any) => a.paymentMethod === "CASH").length;
    const transfer = appointments.filter((a: any) => a.paymentMethod === "TRANSFER").length;

    return {
        total,
        completed,
        cancelled,
        payments: {
            cash,
            transfer
        }
    };
}
