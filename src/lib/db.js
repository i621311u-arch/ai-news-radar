import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const globalForPrisma = globalThis;

function createPrismaClient() {
  let dbRelativePath = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace('file:', '')
    : './prisma/dev.db';

  const dbAbsolutePath = path.isAbsolute(dbRelativePath)
    ? dbRelativePath
    : path.resolve(process.cwd(), dbRelativePath);

  const adapter = new PrismaBetterSqlite3({ url: dbAbsolutePath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
