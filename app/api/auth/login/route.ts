import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

// POST /api/auth/login — verify admin credentials and set a session cookie
export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const admin = await Admin.findOne({ username: username.trim() });

    const passwordOk = admin
      ? await bcrypt.compare(password, admin.password)
      : false;

    if (!admin || !passwordOk) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      data: { name: admin.name, username: admin.username, role: admin.role },
    });
    // Simple session flag cookie (httpOnly so JS can't read it)
    res.cookies.set("erp_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });
    // Role cookie is not sensitive (no permissions live in it beyond
    // routing hints already enforced server-side) so the sidebar can read it.
    res.cookies.set("erp_role", admin.role || "Admin", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    // httpOnly — API routes use this to look up the real session user
    // (role + doctorId) server-side instead of trusting client input.
    res.cookies.set("erp_uid", String(admin._id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (error) {
    console.error("POST /api/auth/login", error);
    return NextResponse.json(
      { success: false, message: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
