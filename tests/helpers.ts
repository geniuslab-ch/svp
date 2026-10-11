import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

let n = 0;

export async function makeUser(role: Role, opts: { verified?: boolean; alias?: string } = {}) {
  n += 1;
  const user = await db.user.create({
    data: {
      email: `${role.toLowerCase()}${n}@test.local`,
      passwordHash: await hashPassword("password-123"),
      role,
      emailVerifiedAt: opts.verified === false ? null : new Date(),
    },
  });
  if (role === "BUYER")
    await db.buyerProfile.create({
      data: {
        userId: user.id,
        alias: opts.alias ?? `Buyer${n}`,
        category: "HOLDING_COMPANY",
        industries: [],
        stages: [],
        budgetMin: 100000,
        budgetMax: 500000,
        discloseBudget: false,
        experience: "Secret track record",
      },
    });
  if (role === "FOUNDER")
    await db.founderProfile.create({
      data: { userId: user.id, legalName: "Jane Legal", displayName: "Jane", companyRole: "Founder", country: "Switzerland" },
    });
  return user;
}

export async function makeVenture(founderId: string, overrides: Record<string, unknown> = {}) {
  n += 1;
  return db.venture.create({
    data: {
      slug: `venture-${n}`,
      founderId,
      alias: `Project ${n}`,
      tagline: "A test venture tagline",
      summary: "A public summary that is long enough to be published on the marketplace.",
      industry: "Fintech",
      businessModel: "SAAS",
      stage: "MVP",
      geography: "Switzerland",
      status: "PUBLISHED",
      publishedAt: new Date(),
      legalName: "Secret Legal AG",
      problem: "CONFIDENTIAL PROBLEM TEXT",
      wizardStep: 11,
      ...overrides,
    },
  });
}

export function pngFile(name = "doc.png") {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  return new File([bytes], name, { type: "image/png" });
}

export function pdfFile(name = "doc.pdf") {
  return new File([new TextEncoder().encode("%PDF-1.4\n%test\n")], name, { type: "application/pdf" });
}
