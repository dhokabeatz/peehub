import { PrismaClient, Prisma } from '@prisma/client'

// Re-export Prisma namespace for use in repositories
// e.g. catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError) ... }
export { Prisma }

// Prevents multiple Prisma Client instances in development due to hot reloading.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Transaction client type inferred from Prisma's own types.
// Use this in repositories that receive a tx from db.$transaction().
export type PrismaTransactionClient = Parameters<
  Parameters<typeof db.$transaction>[0]
>[0]
