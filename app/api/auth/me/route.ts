import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// GET /api/auth/me — current logged-in user (role + doctorId), used by
// client pages to tailor the UI (e.g. hide "add" forms for a Doctor).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, data: null }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: session });
}
