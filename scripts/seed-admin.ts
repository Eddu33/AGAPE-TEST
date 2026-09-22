import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const username = 'agape.26';
  const password = 'Nanny.Agape.26';

  console.log(`Buscando usuario: ${username}...`);

  const existingAdmin = await prisma.admin.findUnique({
    where: { username },
  });

  if (existingAdmin) {
    console.log('El usuario administrador ya existe.');
  } else {
    console.log('Creando usuario administrador...');
    await prisma.admin.create({
      data: {
        username,
        password, // En un entorno real idealmente debería ser un hash (ej. con bcrypt)
      },
    });
    console.log('Usuario administrador creado exitosamente.');
  }
}

main()
  .catch((e) => {
    console.error('Error poblando la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
