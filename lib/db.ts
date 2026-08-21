import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from '@prisma/adapter-neon'
import { withAccelerate } from "@prisma/extension-accelerate"

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  }).$extends(withAccelerate());
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
export { db };
