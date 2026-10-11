export const env = {
  isProd: process.env.NODE_ENV === "production",
  appUrl: (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  demoMode: process.env.DEMO_MODE === "true",
  storageDriver: (process.env.STORAGE_DRIVER || "local") as "local" | "supabase",
  emailDriver: (process.env.EMAIL_DRIVER || "console") as "console" | "resend",
};
