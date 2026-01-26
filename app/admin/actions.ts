"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAppointments() {
    try {
        return await prisma.appointment.findMany({
            include: { client: true },
            orderBy: { date: "asc" }
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return [];
    }
}

export async function updateAppointmentStatus(id: string, status: string, paymentMethod?: string) {
    try {
        await prisma.appointment.update({
            where: { id },
            data: {
                status,
                paymentMethod: paymentMethod || null
            }
        });
        revalidatePath("/admin/dashboard");
    } catch (error) {
        console.error("Error updating status:", error);
    }
}

export async function deleteAppointment(id: string) {
    try {
        await prisma.appointment.delete({
            where: { id }
        });
        revalidatePath("/admin/dashboard");
    } catch (error) {
        console.error("Error deleting appointment:", error);
    }
}

export async function getStats() {
    try {
        const appointments = await prisma.appointment.findMany();

        const total = appointments.length;
        const completed = appointments.filter((a) => a.status === "COMPLETED").length;
        const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;

        const cash = appointments.filter((a) => a.paymentMethod === "CASH").length;
        const transfer = appointments.filter((a) => a.paymentMethod === "TRANSFER").length;

        return {
            total,
            completed,
            cancelled,
            payments: {
                cash,
                transfer
            }
        };
    } catch (error) {
        console.error("Error calculating stats:", error);
        return { total: 0, completed: 0, cancelled: 0, payments: { cash: 0, transfer: 0 } };
    }
}
