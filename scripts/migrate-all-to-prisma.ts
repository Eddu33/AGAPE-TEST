import { PrismaClient } from '@prisma/client';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

// Asegurarse de cargar las variables de entorno para scripts locales
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function getAgapeDbData() {
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl) throw new Error("No DATABASE_URL");
  const sql = neon(dbUrl);
  console.log("Conectando a Neon para extraer agape_db JSON...");
  const rows = await sql`SELECT data FROM agape_db WHERE id = 1`;
  if (rows && rows.length > 0 && rows[0].data) {
    return rows[0].data;
  }
  return null;
}

async function main() {
  const dbData = await getAgapeDbData();
  if (!dbData) {
    console.log("No se encontró datos en agape_db (JSON), nada que migrar.");
    return;
  }

  console.log("Datos de agape_db leídos con éxito. Iniciando migración...");

  // 1. Appointments
  if (dbData.appointments && dbData.appointments.length > 0) {
    console.log(`Migrando ${dbData.appointments.length} turnos...`);
    for (const apt of dbData.appointments) {
      // Verificar si el turno ya existe
      const exists = await prisma.appointment.findUnique({ where: { id: apt.id } });
      if (!exists) {
        // Asegurarse de que el cliente existe, si no crearlo con fallback
        let client = await prisma.client.findUnique({ where: { phone: apt.clientPhone } });
        if (!client) {
           client = await prisma.client.create({
             data: {
               name: apt.clientName || "Desconocido",
               phone: apt.clientPhone,
               createdAt: apt.createdAt ? new Date(apt.createdAt) : new Date(),
             }
           });
        }

        await prisma.appointment.create({
          data: {
            id: apt.id,
            date: apt.date,
            startTime: apt.startTime,
            endTime: apt.endTime,
            durationMinutes: apt.durationMinutes || 60,
            status: apt.status || 'PENDING',
            paymentStatus: apt.paymentStatus,
            paymentMethod: apt.paymentMethod,
            paymentReceipt: apt.paymentReceipt,
            totalPrice: apt.totalPrice || 0,
            clientId: client.id,
            clientName: apt.clientName,
            clientPhone: apt.clientPhone,
            serviceId: apt.serviceId,
            serviceName: apt.serviceName,
            extraIds: apt.extraIds || [],
            extraNames: apt.extraNames || [],
            notes: apt.notes,
            createdAt: apt.createdAt ? new Date(apt.createdAt) : new Date(),
            updatedAt: apt.updatedAt ? new Date(apt.updatedAt) : new Date(),
          }
        });
      }
    }
  }

  // 2. Services
  if (dbData.services && dbData.services.length > 0) {
    console.log(`Migrando ${dbData.services.length} servicios...`);
    for (const s of dbData.services) {
      const exists = await prisma.dynamicService.findUnique({ where: { id: s.id } });
      if (!exists) {
        await prisma.dynamicService.create({
          data: {
            id: s.id,
            nombre: s.nombre,
            categoria: s.categoria,
            precio: s.precio || 0,
            duracion: s.duracion || 60,
            mantenimientoDias: s.mantenimientoDias || 21,
            descripcion: s.descripcion || "",
            imagenUrl: s.imagenUrl,
            queIncluye: s.queIncluye || [],
            queNoIncluye: s.queNoIncluye || [],
            garantia: s.garantia,
            instrucciones: s.instrucciones,
            activo: s.activo ?? true,
            destacado: s.destacado ?? false,
          }
        });
      }
    }
  }

  // 3. Expenses
  if (dbData.expenses && dbData.expenses.length > 0) {
    console.log(`Migrando ${dbData.expenses.length} gastos...`);
    for (const ex of dbData.expenses) {
      const exists = await prisma.expense.findUnique({ where: { id: ex.id } });
      if (!exists) {
        await prisma.expense.create({
          data: {
            id: ex.id,
            fecha: ex.fecha,
            categoria: ex.categoria,
            descripcion: ex.descripcion,
            monto: ex.monto || 0,
            observaciones: ex.observaciones,
            createdAt: ex.createdAt ? new Date(ex.createdAt) : new Date(),
          }
        });
      }
    }
  }

  // 4. Promotions
  if (dbData.promotions && dbData.promotions.length > 0) {
    console.log(`Migrando ${dbData.promotions.length} promociones...`);
    for (const p of dbData.promotions) {
      const exists = await prisma.promotion.findUnique({ where: { id: p.id } });
      if (!exists) {
        await prisma.promotion.create({
          data: {
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            descuentoPorcentaje: p.descuentoPorcentaje,
            precioPromo: p.precioPromo || 0,
            fechaInicio: p.fechaInicio,
            fechaFin: p.fechaFin,
            serviciosIds: p.serviciosIds || [],
            activo: p.activo ?? true,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          }
        });
      }
    }
  }

  // 5. Vouchers
  if (dbData.vouchers && dbData.vouchers.length > 0) {
    console.log(`Migrando ${dbData.vouchers.length} vouchers...`);
    for (const v of dbData.vouchers) {
      const exists = await prisma.voucher.findUnique({ where: { id: v.id } });
      if (!exists) {
        // En Prisma voucher.codigo es @unique
        const existsCode = await prisma.voucher.findUnique({ where: { codigo: v.codigo } });
        if (!existsCode) {
          await prisma.voucher.create({
            data: {
              id: v.id,
              codigo: v.codigo,
              para: v.para,
              de: v.de,
              servicioONombre: v.servicioONombre,
              monto: v.monto,
              vencimiento: v.vencimiento,
              estado: v.estado || "DISPONIBLE",
              createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
            }
          });
        }
      }
    }
  }

  // 6. MessageTemplates
  if (dbData.templates && dbData.templates.length > 0) {
    console.log(`Migrando ${dbData.templates.length} plantillas de mensajes...`);
    for (const t of dbData.templates) {
      const exists = await prisma.messageTemplate.findUnique({ where: { id: t.id } });
      if (!exists) {
        await prisma.messageTemplate.create({
          data: {
            id: t.id,
            tipo: t.tipo,
            titulo: t.titulo,
            texto: t.texto,
            variables: t.variables || [],
          }
        });
      }
    }
  }

  // 7. BlockedTimes
  if (dbData.blockedTimes && dbData.blockedTimes.length > 0) {
    console.log(`Migrando ${dbData.blockedTimes.length} bloqueos horarios...`);
    for (const bt of dbData.blockedTimes) {
      const exists = await prisma.blockedTime.findUnique({ where: { id: bt.id } });
      if (!exists) {
        await prisma.blockedTime.create({
          data: {
            id: bt.id,
            date: bt.date,
            startTime: bt.startTime,
            endTime: bt.endTime,
            reason: bt.reason,
          }
        });
      }
    }
  }

  // 8. SpecialOpenings
  if (dbData.specialOpenings && dbData.specialOpenings.length > 0) {
    console.log(`Migrando ${dbData.specialOpenings.length} aperturas especiales...`);
    for (const so of dbData.specialOpenings) {
      const exists = await prisma.specialOpening.findUnique({ where: { id: so.id } });
      if (!exists) {
        await prisma.specialOpening.create({
          data: {
            id: so.id,
            date: so.date,
            startTime: so.startTime,
            endTime: so.endTime,
            reason: so.reason,
          }
        });
      }
    }
  }

  // 9. DaySchedule
  if (dbData.weeklySchedule && dbData.weeklySchedule.length > 0) {
    console.log(`Migrando ${dbData.weeklySchedule.length} días de horario regular...`);
    for (const ws of dbData.weeklySchedule) {
      const exists = await prisma.daySchedule.findUnique({ where: { dayOfWeek: ws.dayOfWeek } });
      if (!exists) {
        await prisma.daySchedule.create({
          data: {
            id: ws.id,
            dayOfWeek: ws.dayOfWeek,
            isOpen: ws.isOpen,
            openTime: ws.openTime,
            closeTime: ws.closeTime,
            breakStart: ws.breakStart,
            breakEnd: ws.breakEnd,
          }
        });
      }
    }
  }

  // 10. StudioSettings
  if (dbData.settings) {
    console.log(`Migrando configuraciones del estudio...`);
    const s = dbData.settings;
    // Ya que solo debería haber 1 setting, buscamos si hay alguno
    const count = await prisma.studioSettings.count();
    if (count === 0) {
      await prisma.studioSettings.create({
        data: {
          studioName: s.studioName || "ÁGAPE STUDIO",
          whatsappPhone: s.whatsappPhone || "",
          depositPolicy: s.depositPolicy || "",
        }
      });
    }
  }

  console.log("¡Migración completa!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
