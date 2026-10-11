import { expect, test } from "@playwright/test";
import { login, logout, unique } from "./helpers";

test.describe("visitor", () => {
  test("browses the landing page, swipe deck, grid and a teaser without signing in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Don’t start from zero.");
    await page.getByRole("link", { name: "Explore ventures" }).click();
    await expect(page).toHaveURL(/\/discover/);
    const firstCard = page.locator("article[aria-label]").first();
    await expect(firstCard).toBeVisible();
    const before = await firstCard.getAttribute("aria-label");
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("article[aria-label]").first()).not.toHaveAttribute("aria-label", before!);
    await page.getByRole("button", { name: /Undo/ }).click();
    await expect(page.locator("article[aria-label]").first()).toHaveAttribute("aria-label", before!);
    // Saving requires an account
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog")).toContainText("Create a free buyer account");

    await page.goto("/ventures?stage=IDEA");
    await expect(page.getByText("Kindling")).toBeVisible();
    await expect(page.getByText("Ledgerline")).toHaveCount(0);

    await page.goto("/ventures/ledgerline-demo");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ledgerline");
    // Approved-buyer information stays locked
    await expect(page.getByText("Sole traders spend 4–6 hours")).toHaveCount(0);
    await expect(page.getByText("Sign in to request")).toBeVisible();
  });

  test("stealth listings are hidden from visitors", async ({ page }) => {
    await page.goto("/ventures?q=Stealth");
    await expect(page.getByText("No ventures match")).toBeVisible();
    const res = await page.goto("/ventures/stealth-legal-workflow-demo");
    expect(res?.status()).toBe(404);
  });

  test("protected pages redirect to sign-in and role areas are separated", async ({ page }) => {
    await page.goto("/buyer");
    await expect(page).toHaveURL(/\/login\?next=%2Fbuyer/);
    await login(page, "buyer@demo.sequel.test");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/forbidden/);
    await page.goto("/founder");
    await expect(page).toHaveURL(/\/forbidden/);
  });
});

test.describe("confidential documents (direct requests)", () => {
  test("document and verification APIs deny unauthorised access", async ({ page, request }) => {
    // Founder uploads a data-room document to the demo listing
    await login(page, "founder@demo.sequel.test");
    await page.goto("/founder");
    const ledger = page.locator("div.surface", { hasText: "Ledgerline" }).first();
    const editHref = await ledger.getByRole("link", { name: "Edit" }).getAttribute("href");
    await page.goto(`${editHref}?step=9`);
    await page.getByLabel("Title").fill(`Board minutes ${unique()}`);
    await page.getByLabel("Who can see it").selectOption("DATA_ROOM");
    await page.locator('input[type="file"]').setInputFiles({ name: "minutes.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%confidential\n") });
    await page.getByRole("button", { name: "Upload privately" }).click();
    const openLink = page.getByRole("link", { name: "Open" }).first();
    await expect(openLink).toBeVisible();
    const href = (await openLink.getAttribute("href"))!;
    expect(href).toMatch(/^\/api\/documents\//);
    // Owner can fetch it
    const own = await page.request.get(href);
    expect(own.status()).toBe(200);

    // Anonymous direct request
    const anon = await request.get(href);
    expect(anon.status()).toBe(404);

    // Buyer with only DETAILS access cannot open a DATA_ROOM document
    await logout(page);
    await login(page, "buyer@demo.sequel.test");
    const buyerRes = await page.request.get(href);
    expect(buyerRes.status()).toBe(404);
    // ...and cannot read verification evidence
    expect((await page.request.get("/api/verification-documents/anything")).status()).toBe(404);
  });
});

test.describe("full workflow", () => {
  test("founder lists a pre-revenue venture, buyer requests under alias, founder approves", async ({ page }) => {
    const alias = `Project ${unique()}`;

    // ── Founder creates and publishes a listing through the wizard
    await login(page, "founder2@demo.sequel.test");
    await page.goto("/founder/ventures/new");
    await page.getByLabel("Venture name or confidential alias").fill(alias);
    await page.locator('input[name="legalName"]').fill("Hidden Legal GmbH");
    await page.getByLabel("One-line tagline").fill("Inventory forecasting for independent bakeries");
    await page.getByLabel("Industry").selectOption("Food & Hospitality");
    await page.getByLabel("Main market").selectOption("Switzerland");
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/step=2/);

    // Validation errors are shown
    await page.getByLabel("Public description").fill("Too short");
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page.getByText("at least 40 characters")).toBeVisible();
    await page.getByLabel("Public description").fill("An MVP that predicts daily bread demand from weather and past sales, cutting waste for small bakeries.");
    await page.locator('textarea[name="problem"]').fill("SECRET: bakeries throw away 12% of production.");
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/step=3/);
    await page.getByText("MVP", { exact: true }).click();
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/step=4/);
    await page.getByText("Pre-revenue", { exact: true }).click();
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/step=5/);
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/step=6/);
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/step=7/);
    await page.getByText("Source code", { exact: true }).click();
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/step=8/);
    await page.locator('input[name="priceType"][value="FIXED"]').check({ force: true });
    await page.locator('input[name="askingPrice"]').fill("25000");
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/step=9/);
    await page.getByRole("link", { name: "Continue" }).click();
    await expect(page).toHaveURL(/step=10/);
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/step=11/);
    await expect(page.getByText("Public teaser preview")).toBeVisible();
    await page.getByRole("button", { name: "Publish listing" }).click();
    await expect(page).toHaveURL(/\/ventures\/.+published=1/);
    const ventureUrl = new URL(page.url()).pathname;
    await expect(page.getByText("Pre-revenue").first()).toBeVisible();

    // ── Buyer finds it, saves it and requests information
    await logout(page);
    await login(page, "buyer@demo.sequel.test");
    await page.goto(ventureUrl);
    await expect(page.getByText("SECRET: bakeries")).toHaveCount(0);
    await expect(page.getByText("Hidden Legal GmbH")).toHaveCount(0);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
    await page.getByLabel("Message to the founder").fill("We run a bakery-tech holding and would love to learn about the model.");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText("requires the platform NDA")).toBeVisible();
    await expect(page.getByLabel("Message to the founder")).not.toBeEmpty(); // input kept after a failed submit
    await page.locator('input[name="acceptNda"]').check();
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText("Request sent under your alias")).toBeVisible();

    // ── Founder sees the alias (not the email) and approves
    await logout(page);
    await login(page, "founder2@demo.sequel.test");
    await page.goto("/founder/requests");
    const card = page.locator("article", { hasText: alias }).first();
    await expect(card).toContainText("Northwind Holdings");
    await expect(page.getByText("buyer@demo.sequel.test")).toHaveCount(0);
    await card.getByRole("button", { name: "Approve" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Access approved")).toBeVisible();

    // ── Buyer now sees the confidential tier and can message
    await logout(page);
    await login(page, "buyer@demo.sequel.test");
    await page.goto(ventureUrl);
    await expect(page.getByText("SECRET: bakeries throw away 12% of production.")).toBeVisible();
    await page.goto("/messages");
    await page.getByRole("link", { name: new RegExp(alias) }).click();
    await page.getByLabel("Message", { exact: true }).fill("Thanks! Could we schedule a call?");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Thanks! Could we schedule a call?")).toBeVisible();
    await page.goto("/buyer");
    await expect(page.locator("article", { hasText: alias })).toContainText("In discussion");
  });

  test("buyer signs up, creates an alias, and swipes to save", async ({ page }) => {
    const email = `e2e-${unique()}@example.com`;
    await page.goto("/signup");
    await page.getByText("Acquire", { exact: true }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Use at least 10 characters.")).toBeVisible();
    await expect(page.getByText("Please accept the terms")).toBeVisible();
    await page.getByLabel("Password").fill("a-strong-password-1");
    await page.locator('input[name="acceptTerms"]').check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/onboarding\/buyer/);
    await page.getByLabel("Acquisition alias").fill(`Quiet Fox ${unique()}`);
    await page.getByRole("button", { name: "Start discovering" }).click();
    await expect(page).toHaveURL(/\/discover/);
    const top = page.locator("article[aria-label]").first();
    const name = (await top.getAttribute("aria-label"))!.split(":")[0];
    await page.getByRole("button", { name: /^Save — interested/ }).click();
    await expect(page.getByText(`Saved ${name} to your pipeline`)).toBeVisible();
    await page.goto("/buyer/saved");
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    // Persisted: reload discover, the saved venture is no longer in the queue
    await page.goto("/discover");
    await expect(page.locator(`article[aria-label^="${name}:"]`)).toHaveCount(0);
  });

  test("admin reviews a verification and moderates", async ({ page }) => {
    await login(page, "admin@demo.sequel.test");
    await page.goto("/admin/verifications");
    const item = page.locator("article", { hasText: "founder2@demo.sequel.test" }).first();
    await expect(item).toBeVisible();
    await item.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByText("Explain the rejection")).toBeVisible();
    await item.getByLabel("Note to the user").fill("Demo: please upload a clearer document scan.");
    await item.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByText("Rejected — the user has been notified.")).toBeVisible();
    await expect(page.locator("article", { hasText: "founder2@demo.sequel.test" })).toHaveCount(0);
    await page.goto("/admin/audit?action=verification");
    await expect(page.getByText("verification.rejected").first()).toBeVisible();
  });
});
