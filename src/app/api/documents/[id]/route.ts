import { NextResponse } from "next/server";
import { getCurrentUser, clientIp } from "@/lib/auth/session";
import { authorizeDocumentDownload } from "@/lib/services/deals";
import { documentResponse, errorResponse } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Every venture document passes through this server-side permission check. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await rateLimit(`doc:${user.id}`, 120, 3600);
    const { id } = await params;
    const doc = await authorizeDocumentDownload(user, id, await clientIp());
    return await documentResponse(doc.storageKey, doc.filename, doc.mimeType);
  } catch (e) {
    return errorResponse(e);
  }
}
