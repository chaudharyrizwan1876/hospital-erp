import { Schema, model, models } from "mongoose";

export const ROLES = [
  "Admin",
  "Doctor",
  "Receptionist",
  "Pharmacist",
  "HR Manager",
] as const;

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, default: "Administrator" },
    role: { type: String, enum: ROLES, default: "Admin" },
    // Only set when role is "Doctor" — links this login to its Doctor record
    // so appointments/records/patients APIs can scope data to this doctor.
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", default: null },
  },
  { timestamps: true }
);

const Admin = models.Admin || model("Admin", AdminSchema);
export default Admin;
