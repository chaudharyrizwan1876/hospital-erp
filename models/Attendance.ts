import { Schema, model, models } from "mongoose";

const AttendanceSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: {
      type: String,
      enum: ["Present", "Absent", "Leave", "Half Day"],
      default: "Present",
    },
  },
  { timestamps: true }
);

// One attendance record per employee per day
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = models.Attendance || model("Attendance", AttendanceSchema);
export default Attendance;
