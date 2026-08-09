import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis;

function getDatabaseUrl() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('libsql:')) {
    return process.env.DATABASE_URL;
  }

  // Netlify / AWS Lambda Serverless Environment (Linux)
  if (process.platform !== 'win32' && (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL || process.env.NODE_ENV === 'production')) {
    const tmpDbPath = '/tmp/dev.db';
    const bundleDbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');

    try {
      if (!fs.existsSync(tmpDbPath)) {
        if (fs.existsSync(bundleDbPath)) {
          fs.copyFileSync(bundleDbPath, tmpDbPath);
          console.log('[DB Netlify] Copied bundled dev.db to writeable /tmp/dev.db');
        }
      }
      return `file:${tmpDbPath}`;
    } catch (err) {
      console.warn('[DB Copy Netlify Warning]:', err.message);
      return `file:${tmpDbPath}`;
    }
  }

  // Local development
  const localDb = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  const rawPath = localDb.replace('file:', '');
  const absPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
  return `file:${absPath}`;
}

function createPrismaClient() {
  try {
    const dbUrl = getDatabaseUrl();
    console.log('[Prisma Init] Connecting to SQLite URL:', dbUrl);

    const adapter = new PrismaLibSql({ url: dbUrl });
    return new PrismaClient({ adapter });
  } catch (err) {
    console.warn('[Prisma Init Warning]: Could not instantiate SQLite client:', err.message);
    return null;
  }
}

export const prisma = globalForPrisma.prisma !== undefined
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
