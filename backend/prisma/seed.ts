import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  await prisma.user.upsert({
    where: { email: 'admin@vetpro.com' },
    update: {},
    create: {
      email: 'admin@vetpro.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      permissions: ['admin'],
    },
  });

  console.log('✓ Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
