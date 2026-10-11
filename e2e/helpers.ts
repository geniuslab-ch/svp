import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "demo-password-1";

export async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}

export const unique = () => Math.random().toString(36).slice(2, 8);
