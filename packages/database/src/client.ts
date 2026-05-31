import { PrismaClient } from "@prisma/client";

declare global {
  // Prevents multiple PrismaClient instances during Next.js hot reload
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export type { PrismaClient } from "@prisma/client";
