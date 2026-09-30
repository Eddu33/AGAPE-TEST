import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DynamicExtra" (
          "id" TEXT NOT NULL,
          "nombre" TEXT NOT NULL,
          "precio" DOUBLE PRECISION NOT NULL,
          "duracion" INTEGER NOT NULL,
          "descripcion" TEXT NOT NULL,
          "activo" BOOLEAN NOT NULL DEFAULT true,

          CONSTRAINT "DynamicExtra_pkey" PRIMARY KEY ("id")
      );
    `);
    return NextResponse.json({ success: true, message: "Table created successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
