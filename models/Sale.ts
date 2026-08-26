import { Schema, model, models } from "mongoose";

const SaleItemSchema = new Schema(
  {
    medicine: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const SaleSchema = new Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    // Linked patient — lets a medicine sale show up on that patient's
    // invoice/ledger alongside their consultation bills.
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },

    items: {
      type: [SaleItemSchema],
      required: true,
    },

    // Set once this sale has been pulled into a consultation bill, so it
    // can never be claimed by a second same-day bill (e.g. a patient with
    // two appointments in one day).
    bill: {
      type: Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    date: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Sale = models.Sale || model("Sale", SaleSchema);

export default Sale;