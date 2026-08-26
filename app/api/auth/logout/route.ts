import { NextResponse } from "next/server";

// POST /api/auth/logout — clear the session cookie
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("erp_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("erp_role", "", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("erp_uid", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
