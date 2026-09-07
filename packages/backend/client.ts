import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client';

//! Here we define the custom types derived from the Prisma schema

// const graphSchema = Prisma.validator<Prisma.GraphDefaultArgs>()({
//   select: {
//     id: true,
//     path: true,
//     graph: true,

//   }
// })

// export type GraphSchema = Prisma.GraphGetPayload<typeof graphSchema>

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
export default prisma;
