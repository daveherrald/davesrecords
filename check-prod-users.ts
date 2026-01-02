import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('All users in PRODUCTION database:');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      publicSlug: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  users.forEach((user, i) => {
    console.log(`\n${i + 1}. User ID: ${user.id}`);
    console.log(`   Email: ${user.email || 'NULL'}`);
    console.log(`   Name: ${user.name || 'NULL'}`);
    console.log(`   DisplayName: ${user.displayName || 'NULL'}`);
    console.log(`   PublicSlug: ${user.publicSlug || 'NULL'}`);
    console.log(`   Role: ${user.role}, Status: ${user.status}`);
    console.log(`   Created: ${user.createdAt}`);
  });

  console.log(`\nTotal users: ${users.length}`);

  // Find users with no name or email
  const problematicUsers = users.filter(u => !u.name && !u.email && !u.displayName);
  if (problematicUsers.length > 0) {
    console.log('\n❌ Found problematic users (no name, email, or displayName):');
    problematicUsers.forEach(u => {
      console.log(`   - ID: ${u.id}, Slug: ${u.publicSlug}`);
    });
  }

  await prisma.$disconnect();
}

checkUsers().catch(console.error);
