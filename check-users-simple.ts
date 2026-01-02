import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log('\nProduction users:');
  users.forEach(u => {
    console.log(`  ${u.name || u.email} (${u.role})`);
    console.log(`  ID: ${u.id}\n`);
  });
  await prisma.$disconnect();
}
check();
