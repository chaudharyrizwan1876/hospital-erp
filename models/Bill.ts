import { Schema, model, models } from "mongoose";

const BillSchema = new Schema(
  {
    patientName: { type: String, required: true, trim: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", default: null },
    // Set when this bill was generated from a completed appointment —
    // also prevents billing the same visit twice.
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    amount: { type: Number, required: true, min: 0 },
    // Snapshot of pharmacy sales claimed by this bill at creation time
    // (see Sale.bill) — stored, not recomputed, so the same sale can
    // never be counted on two different bills.
    pharmacyAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

const Bill = models.Bill || model("Bill", BillSchema);
export default Bill;
