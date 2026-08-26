import { Schema, model, models } from "mongoose";

const EmployeeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true }, // Nurse, Receptionist...
    department: { type: String, trim: true },
    joiningDate: { type: String }, // YYYY-MM-DD
    salary: { type: Number, required: true, min: 0, default: 0 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

const Employee = models.Employee || model("Employee", EmployeeSchema);
export default Employee;
