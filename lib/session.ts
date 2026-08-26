import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export interface SessionUser {
  id: string;
  role: string;
  doctorId: string | null;
  name: string;
}

// Reads the httpOnly session cookie server-side and loads the current
// logged-in user. Used by API routes to scope data (e.g. a Doctor only
// sees their own patients/appointments) instead of trusting client input.
export async function getSession(): Promise<SessionUser | null> {
  const uid = cookies().get("erp_uid")?.value;
  if (!uid) return null;

  await connectDB();
  const user = await Admin.findById(uid).lean<{
    _id: string;
    role?: string;
    doctorId?: string;
    name?: string;
  }>();
  if (!user) return null;

  return {
    id: String(user._id),
    role: user.role || "Admin",
    doctorId: user.doctorId ? String(user.doctorId) : null,
    name: user.name || "",
  };
}
