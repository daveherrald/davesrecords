/**
 * Admin seed script
 *
 * Usage: ADMIN_EMAIL=your@email.com npx tsx prisma/seed-admin.ts
 *
 * This script promotes an existing user to ADMIN role.
 * If no user exists with the provided email, it will fail.
 */

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error('❌ Error: ADMIN_EMAIL environment variable is required');
    console.log('Usage: ADMIN_EMAIL=your@email.com npx tsx prisma/seed-admin.ts');
    process.exit(1);
  }

  console.log(`🔍 Looking for user with email: ${adminEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!user) {
    console.error(`❌ Error: No user found with email ${adminEmail}`);
    console.log('Please sign in to the application first to create your user account.');
    process.exit(1);
  }

  if (user.role === UserRole.ADMIN) {
    console.log(`ℹ️  User ${adminEmail} is already an admin`);
    process.exit(0);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.ADMIN },
  });

  console.log(`✅ Successfully promoted ${updatedUser.email} to ADMIN`);
  console.log(`   User ID: ${updatedUser.id}`);
  console.log(`   Name: ${updatedUser.name}`);
  console.log(`   Role: ${updatedUser.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
