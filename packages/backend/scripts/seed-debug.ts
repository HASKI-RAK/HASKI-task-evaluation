import { PrismaPg } from '@prisma/adapter-pg';
import { readFile } from 'node:fs/promises';

import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL is required for the debug seed');
}

const graph = await readFile(
  new URL('../../../tools/debug/demo-graph.json', import.meta.url),
  'utf8',
);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

try {
  for (const path of ['/ws/editor/debug/demo/1', '/ws/student/debug/demo/1']) {
    await prisma.graph.upsert({
      where: { path },
      update: { graph },
      create: { path, graph },
    });
  }
  console.log('Seeded deterministic debug workflows');
} finally {
  await prisma.$disconnect();
}
