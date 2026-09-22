import { PrismaClient } from "@prisma/client";
import { getDatabaseAsync } from "../lib/db";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando migración de datos hacia Prisma...");
  const db = await getDatabaseAsync();

  if (!db.clients || db.clients.length === 0) {
    console.log("No hay clientes para migrar.");
  } else {
    console.log(`Encontrados ${db.clients.length} clientes. Migrando...`);
    for (const c of db.clients) {
      const exists = await prisma.client.findUnique({
        where: { phone: c.phone },
      });
      if (!exists) {
        await prisma.client.create({
          data: {
            id: c.id,
            name: c.name,
            phone: c.phone,
            birthday: c.birthday || null,
            category: c.category || "Nueva",
            notes: c.notes || null,
            totalVisits: c.totalVisits || 0,
            lastVisit: c.lastVisit ? new Date(c.lastVisit) : null,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          },
        });
        console.log(`Cliente migrado: ${c.name}`);
      } else {
        console.log(`Cliente ya existe: ${c.name} (${c.phone})`);
      }
    }
  }

  if (!db.appointments || db.appointments.length === 0) {
    console.log("No hay turnos para migrar.");
  } else {
    console.log(`Encontrados ${db.appointments.length} turnos. Migrando...`);
    for (const a of db.appointments) {
      const exists = await prisma.appointment.findUnique({
        where: { id: a.id },
      });
      if (!exists) {
        // Encontrar o crear cliente para garantizar la FK
        let client = await prisma.client.findUnique({ where: { phone: a.clientPhone } });
        if (!client) {
           client = await prisma.client.create({
             data: {
               id: a.clientId,
               name: a.clientName,
               phone: a.clientPhone,
             }
           });
        }

        await prisma.appointment.create({
          data: {
            id: a.id,
            date: a.date,
            startTime: a.startTime,
            endTime: a.endTime,
            durationMinutes: a.durationMinutes || 60,
            status: a.status || "PENDING",
            paymentStatus: a.paymentStatus,
            paymentMethod: a.paymentMethod,
            paymentReceipt: a.paymentReceipt,
            totalPrice: a.totalPrice || 0,
            clientId: client.id,
            clientName: a.clientName,
            clientPhone: a.clientPhone,
            serviceId: a.serviceId,
            serviceName: a.serviceName,
            extraIds: a.extraIds || [],
            extraNames: a.extraNames || [],
            notes: a.notes,
            createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
            updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
          },
        });
        console.log(`Turno migrado: ${a.serviceName} para ${a.clientName}`);
      } else {
        console.log(`Turno ya existe: ${a.id}`);
      }
    }
  }

  console.log("Migración completada exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error durante la migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
