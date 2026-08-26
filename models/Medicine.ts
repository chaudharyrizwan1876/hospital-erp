import { Schema, model, models } from "mongoose";

const MedicineSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true }, // Tablet, Syrup, Injection...
    stock: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0, default: 0 },
    expiry: { type: String }, // YYYY-MM-DD
  },
  { timestamps: true }
);

const Medicine = models.Medicine || model("Medicine", MedicineSchema);
export default Medicine;
