import mongoose, { Schema, model, models } from "mongoose";

const PatientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    disease: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Patient = models.Patient || model("Patient", PatientSchema);
export default Patient;
