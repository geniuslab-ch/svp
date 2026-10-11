import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { makeUser, makeVenture, pdfFile, pngFile } from "./helpers";
import { getVentureForViewer, listVentures, parseFilters, recomputeDerived } from "@/lib/services/ventures";
import {
  authorizeDocumentDownload,
  dataRoomFor,
  decideAccess,
  founderRequests,
  getConversation,
  requestAccess,
  sendMessage,
  submitOffer,
  updatePipeline,
} from "@/lib/services/deals";
import { uploadVentureDocument } from "@/lib/services/listings";
import { exportAccountData, deleteAccount } from "@/lib/services/trust";

const msg = "We run a small holding and would like to learn more about the product.";

async function scenario() {
  const founder = await makeUser("FOUNDER");
  const buyer = await makeUser("BUYER", { alias: "Northwind Holdings" });
  const outsider = await makeUser("BUYER");
  const v = await makeVenture(founder.id, { requireNda: true, revenueStatus: "RECURRING" });
  await db.metric.create({ data: { ventureId: v.id, key: "MRR", value: 12345, period: "Aug 2026", tier: "DETAILS" } });
  const details = await uploadVentureDocument(founder, v.id, { file: pdfFile("deck.pdf"), title: "Pitch deck", category: "product", tier: "DETAILS" });
  const room = await uploadVentureDocument(founder, v.id, { file: pngFile("pnl.png"), title: "P&L", category: "financials", tier: "DATA_ROOM" });
  return { founder, buyer, outsider, v, details, room };
}

describe("confidential listings", () => {
  it("never includes confidential fields in public teasers", async () => {
    const { v } = await scenario();
    const { items } = await listVentures({}, null);
    const json = JSON.stringify(items);
    expect(json).not.toContain("Secret Legal AG");
    expect(json).not.toContain("CONFIDENTIAL PROBLEM TEXT");
    expect(json).not.toContain("12345");
    const view = await getVentureForViewer(v.slug, null);
    expect(view.details).toBeNull();
    expect(JSON.stringify(view)).not.toContain("CONFIDENTIAL PROBLEM TEXT");
  });

  it("does not leak confidential metrics through filters", async () => {
    const { v } = await scenario();
    await recomputeDerived(v.id);
    // MRR is DETAILS-tier, so a revenue filter must not match it.
    expect((await listVentures(parseFilters({ revMin: "12000" }), null)).items).toHaveLength(0);
  });

  it("blocks document downloads without an approved grant (direct requests included)", async () => {
    const { buyer, outsider, details, room } = await scenario();
    await expect(authorizeDocumentDownload(buyer, details.id)).rejects.toThrow(/not found/i);
    await expect(authorizeDocumentDownload(outsider, room.id)).rejects.toThrow(/not found/i);
    expect(await db.auditLog.count({ where: { action: "document.access_denied" } })).toBe(2);
  });

  it("runs the full request → approval → data room → revoke workflow", async () => {
    const { founder, buyer, outsider, v, details, room } = await scenario();

    await expect(requestAccess(buyer, v.id, { level: "DETAILS", message: msg })).rejects.toThrow(/NDA/);
    await requestAccess(buyer, v.id, { level: "DETAILS", message: msg, acceptNda: "on" });
    await expect(requestAccess(buyer, v.id, { level: "DETAILS", message: msg, acceptNda: "on" })).rejects.toThrow(/already pending/);

    // Founder sees alias + disclosed fields only — no email, no undisclosed budget/experience.
    const reqs = await founderRequests(founder);
    expect(reqs).toHaveLength(1);
    const card = JSON.stringify(reqs[0]);
    expect(card).toContain("Northwind Holdings");
    expect(card).not.toContain("@test.local");
    expect(card).not.toContain("Secret track record");
    expect(card).not.toContain("500000");

    // Other users cannot decide on the request.
    await expect(decideAccess(outsider, reqs[0].id, "APPROVE")).rejects.toThrow(/not found/i);

    await decideAccess(founder, reqs[0].id, "APPROVE");
    const view = await getVentureForViewer(v.slug, buyer);
    expect(view.details?.problem).toBe("CONFIDENTIAL PROBLEM TEXT");
    expect(view.details?.legalName).toBeNull(); // showLegalName is false
    expect(view.details?.metrics.find((m) => m.key === "MRR")?.value).toBe(12345);
    await expect(authorizeDocumentDownload(buyer, details.id)).resolves.toBeTruthy();
    await expect(authorizeDocumentDownload(buyer, room.id)).rejects.toThrow();
    await expect(dataRoomFor(buyer, v.id)).rejects.toThrow();
    expect((await getVentureForViewer(v.slug, outsider)).details).toBeNull();

    // Data room
    await requestAccess(buyer, v.id, { level: "DATA_ROOM", message: msg, acceptNda: "on" });
    const dr = (await founderRequests(founder)).find((r) => r.level === "DATA_ROOM")!;
    await decideAccess(founder, dr.id, "APPROVE");
    await expect(authorizeDocumentDownload(buyer, room.id)).resolves.toBeTruthy();
    const roomView = await dataRoomFor(buyer, v.id);
    expect(JSON.stringify(roomView)).not.toContain("storageKey");
    expect(roomView.expiresAt).not.toBeNull();

    // Revoke
    await decideAccess(founder, dr.id, "REVOKE");
    await expect(authorizeDocumentDownload(buyer, room.id)).rejects.toThrow();
    expect(await db.auditLog.count({ where: { action: "document.downloaded" } })).toBe(2);
  });

  it("opens messaging only between approved parties and keeps offers non-binding", async () => {
    const { founder, buyer, outsider, v } = await scenario();
    await requestAccess(buyer, v.id, { level: "DETAILS", message: msg, acceptNda: "on" });
    expect(await db.conversation.count()).toBe(0);
    const [r] = await founderRequests(founder);
    await decideAccess(founder, r.id, "APPROVE");
    const convo = await db.conversation.findFirstOrThrow();
    await sendMessage(founder, convo.id, { body: "Happy to talk." });
    await expect(sendMessage(outsider, convo.id, { body: "hi" })).rejects.toThrow(/not found/i);
    await expect(getConversation(outsider, convo.id)).rejects.toThrow(/not found/i);
    await expect(submitOffer(founder, convo.id, { type: "INDICATIVE_OFFER", amount: "1", currency: "CHF", structure: "Asset deal, cash", acknowledge: "on" })).rejects.toThrow(/Only the buyer/);
    await expect(submitOffer(buyer, convo.id, { type: "INDICATIVE_OFFER", amount: "250000", currency: "CHF", structure: "Asset deal, cash at close" })).rejects.toMatchObject({
      fieldErrors: { acknowledge: expect.stringMatching(/non-binding/) },
    });
    await submitOffer(buyer, convo.id, { type: "INDICATIVE_OFFER", amount: "250000", currency: "CHF", structure: "Asset deal, cash at close", acknowledge: "on" });
    const seen = await getConversation(founder, convo.id);
    expect(seen.messages.some((m) => m.kind === "OFFER" && m.body.includes("non-binding"))).toBe(true);
    expect(JSON.stringify(seen)).not.toContain("@test.local");
  });

  it("keeps buyer pipeline notes private", async () => {
    const { founder, buyer, v } = await scenario();
    await requestAccess(buyer, v.id, { level: "DETAILS", message: msg, acceptNda: "on" });
    await updatePipeline(buyer, v.id, { notes: "Max 200k, walk away otherwise", stage: "IN_DISCUSSION" });
    const [r] = await founderRequests(founder);
    await decideAccess(founder, r.id, "APPROVE");
    const convo = await db.conversation.findFirstOrThrow();
    const founderView = JSON.stringify([await founderRequests(founder), await getConversation(founder, convo.id)]);
    expect(founderView).not.toContain("walk away");
    await expect(updatePipeline(founder, v.id, { notes: "x" })).rejects.toThrow();
  });

  it("requires email verification before contacting founders", async () => {
    const founder = await makeUser("FOUNDER");
    const buyer = await makeUser("BUYER", { verified: false });
    const v = await makeVenture(founder.id, { requireNda: false });
    await expect(requestAccess(buyer, v.id, { level: "DETAILS", message: msg })).rejects.toThrow(/Verify your email/);
  });

  it("exports and deletes account data", async () => {
    const { buyer, v } = await scenario();
    await requestAccess(buyer, v.id, { level: "DETAILS", message: msg, acceptNda: "on" });
    const exported = await exportAccountData(buyer.id);
    expect(exported.user.email).toBe(buyer.email);
    await expect(deleteAccount(buyer.id, "wrong")).rejects.toThrow(/incorrect/);
    await deleteAccount(buyer.id, "password-123");
    const after = await db.user.findUniqueOrThrow({ where: { id: buyer.id } });
    expect(after.status).toBe("DELETED");
    expect(after.email).not.toBe(buyer.email);
    expect(await db.buyerProfile.count({ where: { userId: buyer.id } })).toBe(0);
  });
});
