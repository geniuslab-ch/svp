import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  authenticate,
  createSessionToken,
  registerUser,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
  userFromSessionToken,
  verifyEmail,
} from "@/lib/services/auth";
import { signupSchema } from "@/lib/validation";

describe("authentication", () => {
  it("registers founders and buyers with hashed passwords, never admins", async () => {
    const u = await registerUser({ email: "Ana@Example.com", password: "longpassword1", role: "FOUNDER" });
    expect(u.email).toBe("ana@example.com");
    expect(u.passwordHash).not.toContain("longpassword1");
    expect(u.emailVerifiedAt).toBeNull();
    await expect(registerUser({ email: "x@example.com", password: "longpassword1", role: "ADMIN" })).rejects.toThrow(/cannot be self-registered/);
    expect(signupSchema.safeParse({ email: "x@example.com", password: "longpassword1", role: "ADMIN", acceptTerms: "on" }).success).toBe(false);
  });

  it("rejects duplicate emails and wrong passwords with a generic message", async () => {
    await registerUser({ email: "dup@example.com", password: "longpassword1", role: "BUYER" });
    await expect(registerUser({ email: "dup@example.com", password: "longpassword1", role: "BUYER" })).rejects.toThrow(/already exists/);
    await expect(authenticate("dup@example.com", "wrongpassword1")).rejects.toThrow("Email or password is incorrect.");
    await expect(authenticate("nobody@example.com", "wrongpassword1")).rejects.toThrow("Email or password is incorrect.");
    expect((await authenticate("dup@example.com", "longpassword1")).email).toBe("dup@example.com");
  });

  it("verifies email with a single-use token", async () => {
    const u = await registerUser({ email: "v@example.com", password: "longpassword1", role: "BUYER" });
    const token = await sendVerificationEmail(u.id, u.email);
    await verifyEmail(token);
    expect((await db.user.findUnique({ where: { id: u.id } }))?.emailVerifiedAt).not.toBeNull();
    await expect(verifyEmail(token)).rejects.toThrow(/invalid or has expired/);
  });

  it("stores only hashed session tokens and revokes sessions on password reset", async () => {
    const u = await registerUser({ email: "r@example.com", password: "longpassword1", role: "BUYER" });
    const { token } = await createSessionToken(u.id);
    expect(await db.session.findUnique({ where: { id: token } })).toBeNull();
    expect((await userFromSessionToken(token))?.id).toBe(u.id);
    const reset = await requestPasswordReset("r@example.com");
    expect(await requestPasswordReset("unknown@example.com")).toBeNull();
    await resetPassword(reset!, "brandnewpass2");
    expect(await userFromSessionToken(token)).toBeNull();
    await expect(resetPassword(reset!, "anotherpass3")).rejects.toThrow();
    expect((await authenticate("r@example.com", "brandnewpass2")).id).toBe(u.id);
  });

  it("refuses sessions for suspended users", async () => {
    const u = await registerUser({ email: "s@example.com", password: "longpassword1", role: "BUYER" });
    const { token } = await createSessionToken(u.id);
    await db.user.update({ where: { id: u.id }, data: { status: "SUSPENDED" } });
    expect(await userFromSessionToken(token)).toBeNull();
  });
});
