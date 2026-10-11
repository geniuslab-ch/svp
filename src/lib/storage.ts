import { promises as fs } from "fs";
import path from "path";
import { env } from "./env";
import { randomToken } from "./crypto";
import { AppError } from "./errors";

/**
 * Private object storage. Documents are NEVER served from a public URL:
 * - "supabase": private bucket; downloads go through a 60-second signed URL created after
 *   the server has checked permissions.
 * - "local": files under ./.data/uploads, streamed by the server after permission checks.
 *   Refused in production because Render's filesystem is ephemeral.
 */

export const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "sequel-private";
  if (!url || !key) throw new AppError("VALIDATION", "File storage is not configured on this server.");
  return { url: url.replace(/\/$/, ""), key, bucket };
}

/** Checks the magic bytes so a renamed executable can't pass as a PDF/image. */
export function sniffMatches(mime: string, bytes: Uint8Array): boolean {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (mime) {
    case "application/pdf":
      return starts([0x25, 0x50, 0x44, 0x46]);
    case "image/png":
      return starts([0x89, 0x50, 0x4e, 0x47]);
    case "image/jpeg":
      return starts([0xff, 0xd8, 0xff]);
    case "image/webp":
      return starts([0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45;
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return starts([0x50, 0x4b, 0x03, 0x04]);
    case "text/csv":
      // Reject binary content: no NUL bytes in the first KB.
      return !bytes.slice(0, 1024).includes(0);
    default:
      return false;
  }
}

export function validateUpload(file: File | null | undefined, bytes?: Uint8Array) {
  if (!file || file.size === 0) throw new AppError("VALIDATION", "Please choose a file.");
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError("VALIDATION", "Files must be 10 MB or smaller.");
  if (!ALLOWED_MIME[file.type])
    throw new AppError("VALIDATION", "Allowed formats: PDF, PNG, JPEG, WebP, CSV, XLSX, DOCX.");
  if (bytes && !sniffMatches(file.type, bytes))
    throw new AppError("VALIDATION", "The file content does not match its type.");
}

export function safeFilename(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim().slice(0, 120);
  return cleaned || "document";
}

export async function putObject(prefix: string, file: File): Promise<{ key: string; size: number; mimeType: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  validateUpload(file, bytes);
  const key = `${prefix}/${randomToken(18)}.${ALLOWED_MIME[file.type]}`;

  if (env.storageDriver === "supabase") {
    const { url, key: serviceKey, bucket } = supabaseConfig();
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": file.type, "x-upsert": "false" },
      body: bytes,
    });
    if (!res.ok) {
      console.error("[storage] upload failed", res.status, await res.text());
      throw new AppError("VALIDATION", "Upload failed. Please try again.");
    }
  } else {
    if (env.isProd && process.env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION !== "true")
      throw new AppError("VALIDATION", "Local file storage is disabled in production. Configure STORAGE_DRIVER=supabase.");
    const target = path.join(LOCAL_ROOT, key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }
  return { key, size: bytes.byteLength, mimeType: file.type };
}

export type ObjectDelivery = { kind: "redirect"; url: string } | { kind: "bytes"; data: Buffer };

/** Only call AFTER the caller's permission has been verified on the server. */
export async function deliverObject(key: string): Promise<ObjectDelivery> {
  if (env.storageDriver === "supabase") {
    const { url, key: serviceKey, bucket } = supabaseConfig();
    const res = await fetch(`${url}/storage/v1/object/sign/${bucket}/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 60 }),
    });
    if (!res.ok) throw new AppError("NOT_FOUND", "Document unavailable.");
    const json = (await res.json()) as { signedURL?: string; signedUrl?: string };
    const signed = json.signedURL ?? json.signedUrl;
    if (!signed) throw new AppError("NOT_FOUND", "Document unavailable.");
    return { kind: "redirect", url: `${url}/storage/v1${signed}` };
  }
  const target = path.join(LOCAL_ROOT, key);
  if (!target.startsWith(LOCAL_ROOT)) throw new AppError("NOT_FOUND", "Document unavailable.");
  try {
    return { kind: "bytes", data: await fs.readFile(target) };
  } catch {
    throw new AppError("NOT_FOUND", "Document unavailable.");
  }
}

export async function deleteObject(key: string): Promise<void> {
  try {
    if (env.storageDriver === "supabase") {
      const { url, key: serviceKey, bucket } = supabaseConfig();
      await fetch(`${url}/storage/v1/object/${bucket}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [key] }),
      });
    } else {
      await fs.rm(path.join(LOCAL_ROOT, key), { force: true });
    }
  } catch (err) {
    console.error("[storage] delete failed", err);
  }
}
