import { Schema, model, models } from "mongoose";

const ReturnSchema = new Schema(
  {
    // Original sale from which this return was created
    saleId: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      required: false,
    },

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

    patientName: {
      type: String,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Refund based on original sale price
    refund: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      trim: true,
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

const Return =
  models.Return || model("Return", ReturnSchema);

export default Return;