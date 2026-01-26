"use server";

import { prisma } from "@/lib/prisma";

export async function getClients() {
    try {
        const clients = await prisma.client.findMany({
            include: {
                appointments: {
                    orderBy: { date: "desc" }
                }
            },
            orderBy: { name: "asc" }
        });
        return clients;
    } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
}
