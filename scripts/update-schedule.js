const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  await prisma.daySchedule.updateMany({
    data: {
      isOpen: true,
      openTime: '09:00',
      closeTime: '19:00',
      breakStart: '13:00',
      breakEnd: '14:00'
    }
  });
  console.log('Schedules updated successfully.');
}

update().catch(console.error).finally(() => prisma.$disconnect());
