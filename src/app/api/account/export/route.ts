import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { exportAccountData } from "@/lib/services/trust";
import { rateLimit } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    await rateLimit(`export:${user.id}`, 5, 3600);
    const data = await exportAccountData(user.id);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sequel-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
