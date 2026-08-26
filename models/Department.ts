import { Schema, model, models } from "mongoose";

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    head: { type: String, trim: true }, // Head of Department
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

const Department = models.Department || model("Department", DepartmentSchema);
export default Department;
