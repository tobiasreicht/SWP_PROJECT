import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const count = await prisma.message.count();
  console.log('message_count', count);
} catch (error) {
  console.error('PRISMA_ERR', error?.message);
  console.error('PRISMA_CODE', error?.code || 'no_code');
} finally {
  await prisma.$disconnect();
}
