import { expect, test } from "@playwright/test";

test("mobile: swipe gesture passes a card and filters open in a drawer", async ({ page }) => {
  await page.goto("/discover");
  const card = page.locator("article[aria-label]").first();
  await expect(card).toBeVisible();
  const label = await card.getAttribute("aria-label");
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 200, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator("article[aria-label]").first()).not.toHaveAttribute("aria-label", label!);
  await page.getByRole("button", { name: /Filters/ }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
});
