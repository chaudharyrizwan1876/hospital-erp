import { Schema, model, models } from "mongoose";

const PayrollSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: String, required: true }, // e.g. "2026-08"
    basic: { type: Number, required: true, min: 0, default: 0 },
    allowances: { type: Number, min: 0, default: 0 },
    deductions: { type: Number, min: 0, default: 0 },
    netPay: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

const Payroll = models.Payroll || model("Payroll", PayrollSchema);
export default Payroll;
