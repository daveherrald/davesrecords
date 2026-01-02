import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
  const userId = 'cmjulwn310001k104f93l8z3s';

  console.log(`Deleting user ${userId} from PRODUCTION...`);

  try {
    const user = await prisma.user.delete({
      where: { id: userId },
    });

    console.log('✅ User successfully deleted!');
    console.log(`   Deleted: ${user.name || user.email || user.publicSlug || 'unnamed'}`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
