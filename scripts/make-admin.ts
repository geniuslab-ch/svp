/**
 * Grants or creates an administrator account. Admin rights can ONLY be granted here,
 * by someone with shell access to the server/database — never through the web app.
 *
 *   npm run make-admin -- admin@example.com            # promote an existing user
 *   npm run make-admin -- admin@example.com --create   # create (prompts for a password via ADMIN_PASSWORD env)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Usage: npm run make-admin -- <email> [--create]");
  const create = process.argv.includes("--create");
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { email }, data: { role: "ADMIN", status: "ACTIVE" } });
    await db.auditLog.create({ data: { action: "user.promoted_admin", targetType: "user", targetId: existing.id, metadata: { via: "cli" } } });
    console.log(`Promoted ${email} to ADMIN.`);
    return;
  }
  if (!create) throw new Error(`No user ${email}. Pass --create and set ADMIN_PASSWORD to create one.`);
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error("Set ADMIN_PASSWORD (12+ characters) in the environment.");
  const user = await db.user.create({
    data: { email, role: "ADMIN", passwordHash: await bcrypt.hash(password, 12), emailVerifiedAt: new Date() },
  });
  await db.auditLog.create({ data: { action: "user.created_admin", targetType: "user", targetId: user.id, metadata: { via: "cli" } } });
  console.log(`Created ADMIN ${email}.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
