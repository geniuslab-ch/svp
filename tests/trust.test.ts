import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { makeUser, makeVenture, pdfFile } from "./helpers";
import {
  authorizeVerificationDocument,
  expireVerifications,
  moderateVenture,
  reviewVerification,
  setUserStatus,
  submitVerification,
} from "@/lib/services/trust";
import { getVentureForViewer } from "@/lib/services/ventures";
import { validateUpload } from "@/lib/storage";

const statement = "Swiss ID card and commercial register extract attached.";

describe("founder verification", () => {
  it("never raises the badge on upload — only on admin approval", async () => {
    const founder = await makeUser("FOUNDER");
    const admin = await makeUser("ADMIN");
    const v = await makeVenture(founder.id);
    const req = await submitVerification(founder, { kind: "IDENTITY", statement }, [pdfFile()]);
    expect((await getVentureForViewer(v.slug, null)).venture.founderLevel).toBe(1);
    await expect(submitVerification(founder, { kind: "IDENTITY", statement }, [pdfFile()])).rejects.toThrow(/pending/);
    await reviewVerification(admin, req.id, { decision: "APPROVED" });
    expect((await getVentureForViewer(v.slug, null)).venture.founderLevel).toBe(2);
    await expect(reviewVerification(admin, req.id, { decision: "APPROVED" })).rejects.toThrow(/already been reviewed/);
  });

  it("enforces the level order and per-venture ownership", async () => {
    const founder = await makeUser("FOUNDER");
    const other = await makeUser("FOUNDER");
    const v = await makeVenture(founder.id);
    const otherV = await makeVenture(other.id);
    await expect(submitVerification(founder, { kind: "OWNERSHIP", ventureId: v.id, statement }, [pdfFile()])).rejects.toThrow(/Identity verification/);
    const admin = await makeUser("ADMIN");
    const id = await submitVerification(founder, { kind: "IDENTITY", statement }, [pdfFile()]);
    await reviewVerification(admin, id.id, { decision: "APPROVED" });
    await expect(submitVerification(founder, { kind: "OWNERSHIP", ventureId: otherV.id, statement }, [pdfFile()])).rejects.toThrow(/your ventures/);
    await expect(submitVerification(founder, { kind: "BUYER_FUNDS", statement }, [pdfFile()])).rejects.toThrow(/does not apply/);
  });

  it("restricts review and evidence to administrators", async () => {
    const founder = await makeUser("FOUNDER");
    const buyer = await makeUser("BUYER");
    const admin = await makeUser("ADMIN");
    const req = await submitVerification(founder, { kind: "IDENTITY", statement }, [pdfFile()]);
    await expect(reviewVerification(founder, req.id, { decision: "APPROVED" })).rejects.toThrow(/Administrator/);
    await expect(reviewVerification(admin, req.id, { decision: "REJECTED" })).rejects.toThrow(/Explain/);
    const doc = await db.verificationDocument.findFirstOrThrow();
    await expect(authorizeVerificationDocument(founder, doc.id)).rejects.toThrow();
    await expect(authorizeVerificationDocument(buyer, doc.id)).rejects.toThrow();
    await expect(authorizeVerificationDocument(admin, doc.id)).resolves.toBeTruthy();
    expect(await db.auditLog.count({ where: { action: "verification_document.viewed" } })).toBe(1);
  });

  it("expires old approvals", async () => {
    const founder = await makeUser("FOUNDER");
    await db.verificationRequest.create({
      data: { userId: founder.id, kind: "IDENTITY", status: "APPROVED", statement, expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await expireVerifications()).toBe(1);
  });

  it("marks financial metrics as verified only through an approved financial review", async () => {
    const founder = await makeUser("FOUNDER");
    const admin = await makeUser("ADMIN");
    const v = await makeVenture(founder.id);
    await db.metric.create({ data: { ventureId: v.id, key: "MONTHLY_REVENUE", value: 900, period: "Aug 2026" } });
    for (const kind of ["IDENTITY", "OWNERSHIP"] as const) {
      const r = await submitVerification(founder, { kind, ventureId: v.id, statement }, [pdfFile()]);
      await reviewVerification(admin, r.id, { decision: "APPROVED" });
    }
    const fin = await submitVerification(founder, { kind: "FINANCIAL", ventureId: v.id, statement }, [pdfFile()]);
    expect((await db.metric.findFirstOrThrow()).source).toBe("FOUNDER_REPORTED");
    await reviewVerification(admin, fin.id, { decision: "APPROVED", markMetricsVerified: true });
    expect((await db.metric.findFirstOrThrow()).source).toBe("VERIFIED");
    expect((await getVentureForViewer(v.slug, null)).venture.founderLevel).toBe(4);
  });
});

describe("administration", () => {
  it("lets admins remove listings and suspend users, but never other admins or themselves", async () => {
    const founder = await makeUser("FOUNDER");
    const admin = await makeUser("ADMIN");
    const admin2 = await makeUser("ADMIN");
    const v = await makeVenture(founder.id);
    await expect(moderateVenture(founder, v.id, "remove", "spam")).rejects.toThrow(/Administrator/);
    await moderateVenture(admin, v.id, "remove", "Misleading revenue claims");
    await expect(getVentureForViewer(v.slug, null)).rejects.toThrow(/not found/i);
    await expect(setUserStatus(admin, admin.id, "SUSPENDED")).rejects.toThrow();
    await expect(setUserStatus(admin, admin2.id, "SUSPENDED")).rejects.toThrow();
    await setUserStatus(admin, founder.id, "SUSPENDED");
    expect((await db.user.findUniqueOrThrow({ where: { id: founder.id } })).status).toBe("SUSPENDED");
  });
});

describe("uploads", () => {
  it("rejects disallowed types, oversize files and spoofed content", () => {
    expect(() => validateUpload(new File(["x"], "a.exe", { type: "application/x-msdownload" }))).toThrow(/Allowed formats/);
    expect(() => validateUpload(new File([new Uint8Array(11 * 1024 * 1024)], "a.pdf", { type: "application/pdf" }))).toThrow(/10 MB/);
    const fake = new File(["MZ not a pdf"], "a.pdf", { type: "application/pdf" });
    expect(() => validateUpload(fake, new TextEncoder().encode("MZ not a pdf"))).toThrow(/does not match/);
  });
});
