"use server";

import { getData } from "@/lib/db";

export async function getClients() {
    const db = getData();
    return db.clients.map((client: any) => ({
        ...client,
        appointments: db.appointments
            .filter((apt: any) => apt.clientId === client.id)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
}
