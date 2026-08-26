import { Schema, model, models } from "mongoose";

const LeaveSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    type: {
      type: String,
      enum: ["Casual", "Sick", "Annual"],
      default: "Casual",
    },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Leave = models.Leave || model("Leave", LeaveSchema);
export default Leave;
