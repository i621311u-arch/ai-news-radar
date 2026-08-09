import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

const globalForPrisma = globalThis;

function createPrismaClient() {
  let dbRelativePath = process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : 'file:./prisma/dev.db';

  if (!dbRelativePath.startsWith('file:') && !dbRelativePath.startsWith('libsql:')) {
    dbRelativePath = `file:${dbRelativePath}`;
  }

  // Handle local file path resolution for dev
  if (dbRelativePath.startsWith('file:')) {
    const rawPath = dbRelativePath.replace('file:', '');
    const absolutePath = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(process.cwd(), rawPath);
    dbRelativePath = `file:${absolutePath}`;
  }

  const adapter = new PrismaLibSql({ url: dbRelativePath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
