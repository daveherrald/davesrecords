import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillConnections() {
  // Update existing connections
  const connections = await prisma.discogsConnection.findMany({
    select: { id: true, discogsUsername: true, name: true, isPrimary: true }
  });

  console.log('Found', connections.length, 'connection(s)');

  for (const conn of connections) {
    if (!conn.name || conn.name === '') {
      await prisma.discogsConnection.update({
        where: { id: conn.id },
        data: {
          name: conn.discogsUsername,
          isPrimary: true
        }
      });
      console.log('Updated connection', conn.id, '- set name to', conn.discogsUsername, 'and isPrimary to true');
    }
  }

  await prisma.$disconnect();
}

backfillConnections()
  .then(() => console.log('Done!'))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
