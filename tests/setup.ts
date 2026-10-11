import { afterAll, beforeEach } from "vitest";

const url = process.env.TEST_DATABASE_URL || "postgresql://postgres@localhost:5432/svp_test";
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;
process.env.STORAGE_DRIVER = "local";
process.env.EMAIL_DRIVER = "console";

const { db } = await import("@/lib/db");

beforeEach(async () => {
  const tables: { tablename: string }[] = await db.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
});

afterAll(async () => {
  await db.$disconnect();
});
