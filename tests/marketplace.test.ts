import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { makeUser, makeVenture } from "./helpers";
import { createDraft, publishVenture, saveStep, setVentureStatus } from "@/lib/services/listings";
import { clearInteraction, passVenture, saveVenture } from "@/lib/services/interactions";
import { discoverQueue, listVentures, parseFilters, recomputeDerived } from "@/lib/services/ventures";

const step1 = {
  alias: "Quiet Ledger",
  tagline: "Bookkeeping autopilot for Swiss sole traders",
  industry: "Fintech",
  businessModel: "SAAS",
  geography: "Switzerland",
  teamSize: "2",
};

async function walkWizard(founder: { id: string; role: Role; emailVerifiedAt: Date | null }) {
  const v = await createDraft(founder, step1);
  await saveStep(founder, v.id, 2, { summary: "A pre-revenue MVP that reconciles bank feeds into VAT-ready books for sole traders." });
  await saveStep(founder, v.id, 3, { stage: "MVP" });
  await saveStep(founder, v.id, 4, { revenueStatus: "PRE_REVENUE" });
  await saveStep(founder, v.id, 5, {});
  await saveStep(founder, v.id, 6, {});
  await saveStep(founder, v.id, 7, {});
  await saveStep(founder, v.id, 8, { priceType: "ON_REQUEST", currency: "CHF", acquisitionType: "FULL_COMPANY" });
  return v;
}

describe("listings", () => {
  it("lets a founder create, save and publish a pre-revenue venture", async () => {
    const founder = await makeUser("FOUNDER");
    const v = await walkWizard(founder);
    const published = await publishVenture(founder, v.id);
    expect(published.status).toBe("PUBLISHED");
    expect(published.revenueStatus).toBe("PRE_REVENUE");
    const { items } = await listVentures({}, null);
    expect(items.map((i) => i.id)).toContain(v.id);
  });

  it("does not let buyers create listings or edit someone else's", async () => {
    const buyer = await makeUser("BUYER");
    const founder = await makeUser("FOUNDER");
    const other = await makeUser("FOUNDER");
    await expect(createDraft(buyer, step1)).rejects.toThrow(/Only founder accounts/);
    const v = await makeVenture(founder.id);
    await expect(saveStep(other, v.id, 2, { summary: "x".repeat(50) })).rejects.toThrow(/not found/);
    await expect(saveStep(buyer, v.id, 2, { summary: "x".repeat(50) })).rejects.toThrow(/not found/);
  });

  it("requires a verified email to publish", async () => {
    const founder = await makeUser("FOUNDER", { verified: false });
    const v = await walkWizard(founder);
    await expect(publishVenture(founder, v.id)).rejects.toThrow(/Verify your email/);
  });

  it("validates inputs with field-level errors", async () => {
    const founder = await makeUser("FOUNDER");
    await expect(createDraft(founder, { ...step1, alias: "", industry: "Nope" })).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { alias: expect.any(String), industry: expect.any(String) },
    });
    const v = await createDraft(founder, step1);
    await expect(saveStep(founder, v.id, 8, { priceType: "RANGE", askingPriceMin: "500000", askingPriceMax: "100", currency: "CHF", acquisitionType: "FULL_COMPANY" })).rejects.toMatchObject({
      fieldErrors: { askingPriceMax: expect.any(String) },
    });
  });

  it("refuses revenue figures on a pre-revenue venture and self-declared verification", async () => {
    const founder = await makeUser("FOUNDER");
    const v = await walkWizard(founder);
    await expect(saveStep(founder, v.id, 5, { "MONTHLY_REVENUE.value": "1000", "MONTHLY_REVENUE.period": "Aug 2026", "MONTHLY_REVENUE.source": "FOUNDER_REPORTED" })).rejects.toThrow(/pre-revenue/);
    await saveStep(founder, v.id, 4, { revenueStatus: "OCCASIONAL" });
    await expect(saveStep(founder, v.id, 5, { "MONTHLY_REVENUE.value": "1000", "MONTHLY_REVENUE.period": "Aug 2026", "MONTHLY_REVENUE.source": "VERIFIED" })).rejects.toThrow();
    await expect(saveStep(founder, v.id, 5, { "MRR.value": "1000", "MRR.period": "Aug 2026", "MRR.source": "FOUNDER_REPORTED" })).rejects.toThrow(/recurring/);
  });

  it("drops the verified label when a founder edits a verified figure", async () => {
    const founder = await makeUser("FOUNDER");
    const v = await walkWizard(founder);
    await saveStep(founder, v.id, 4, { revenueStatus: "RECURRING" });
    await saveStep(founder, v.id, 5, { "MRR.value": "4000", "MRR.period": "Aug 2026", "MRR.source": "FOUNDER_REPORTED", "MRR.tier": "TEASER" });
    await db.metric.updateMany({ where: { ventureId: v.id, key: "MRR" }, data: { source: "VERIFIED" } });
    await saveStep(founder, v.id, 5, { "MRR.value": "4000", "MRR.period": "Aug 2026", "MRR.source": "FOUNDER_REPORTED", "MRR.tier": "TEASER" });
    expect((await db.metric.findFirst({ where: { ventureId: v.id, key: "MRR" } }))?.source).toBe("VERIFIED");
    await saveStep(founder, v.id, 5, { "MRR.value": "9000", "MRR.period": "Aug 2026", "MRR.source": "FOUNDER_REPORTED", "MRR.tier": "TEASER" });
    expect((await db.metric.findFirst({ where: { ventureId: v.id, key: "MRR" } }))?.source).toBe("FOUNDER_REPORTED");
  });

  it("pauses and marks ventures as sold", async () => {
    const founder = await makeUser("FOUNDER");
    const v = await makeVenture(founder.id);
    await setVentureStatus(founder, v.id, "PAUSED");
    expect((await listVentures({}, null)).items).toHaveLength(0);
    await setVentureStatus(founder, v.id, "PUBLISHED");
    await setVentureStatus(founder, v.id, "SOLD");
    await expect(setVentureStatus(founder, v.id, "PUBLISHED")).rejects.toThrow(/sold/);
  });
});

describe("discovery", () => {
  it("persists saves and passes and removes them from the swipe queue", async () => {
    const founder = await makeUser("FOUNDER");
    const buyer = await makeUser("BUYER");
    const a = await makeVenture(founder.id);
    const b = await makeVenture(founder.id);
    const c = await makeVenture(founder.id);
    await saveVenture(buyer, a.id);
    await passVenture(buyer, b.id);
    const queue = await discoverQueue({}, buyer);
    expect(queue.map((q) => q.id)).toEqual([c.id]);
    expect(await db.ventureInteraction.count({ where: { userId: buyer.id } })).toBe(2);
    expect((await db.pipelineEntry.findFirst({ where: { buyerId: buyer.id, ventureId: a.id } }))?.stage).toBe("INTERESTED");
    await clearInteraction(buyer, b.id);
    expect((await discoverQueue({}, buyer)).map((q) => q.id).sort()).toEqual([b.id, c.id].sort());
  });

  it("does not let a swipe reveal the buyer or create an offer", async () => {
    const founder = await makeUser("FOUNDER");
    const buyer = await makeUser("BUYER");
    const v = await makeVenture(founder.id);
    await saveVenture(buyer, v.id);
    expect(await db.notification.count({ where: { userId: founder.id } })).toBe(0);
    expect(await db.accessRequest.count()).toBe(0);
    expect(await db.offer.count()).toBe(0);
    expect(await db.conversation.count()).toBe(0);
  });

  it("requires a buyer account to save", async () => {
    const founder = await makeUser("FOUNDER");
    const other = await makeUser("FOUNDER");
    const v = await makeVenture(founder.id);
    await expect(saveVenture(other, v.id)).rejects.toThrow(/buyer account/);
  });

  it("filters by stage, revenue, price and industry", async () => {
    const founder = await makeUser("FOUNDER");
    const idea = await makeVenture(founder.id, { stage: "IDEA", industry: "Travel", priceType: "FIXED", askingPrice: 20000 });
    const rev = await makeVenture(founder.id, { stage: "REVENUE", revenueStatus: "RECURRING", priceType: "FIXED", askingPrice: 400000 });
    await recomputeDerived(idea.id);
    await recomputeDerived(rev.id);
    const ids = async (sp: Record<string, string>) => (await listVentures(parseFilters(sp), null)).items.map((i) => i.id);
    expect(await ids({ stage: "IDEA" })).toEqual([idea.id]);
    expect(await ids({ revenue: "RECURRING" })).toEqual([rev.id]);
    expect(await ids({ priceMax: "50000" })).toEqual([idea.id]);
    expect(await ids({ industry: "Travel" })).toEqual([idea.id]);
    expect(await ids({ sort: "price_desc" })).toEqual([rev.id, idea.id]);
    expect(await ids({ stage: "NOT_A_STAGE" })).toHaveLength(2);
  });
});
