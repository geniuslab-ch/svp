import { NextResponse } from "next/server";
import { getCurrentUser, clientIp } from "@/lib/auth/session";
import { authorizeVerificationDocument } from "@/lib/services/trust";
import { documentResponse, errorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { id } = await params;
    const doc = await authorizeVerificationDocument(user, id, await clientIp());
    return await documentResponse(doc.storageKey, doc.filename, doc.mimeType);
  } catch (e) {
    return errorResponse(e);
  }
}
