import { Schema, model, models } from "mongoose";

const MedicalRecordSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    diagnosis: { type: String, required: true, trim: true },
    prescription: { type: String, trim: true },
    notes: { type: String, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true }
);

const MedicalRecord =
  models.MedicalRecord || model("MedicalRecord", MedicalRecordSchema);
export default MedicalRecord;
