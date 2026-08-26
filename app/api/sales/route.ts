import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Medicine from "@/models/Medicine";
import Return from "@/models/Return";

export async function GET() {
  try {
    await connectDB();

    const sales = await Sale.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    console.error("GET /api/sales", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales",
      },
      { status: 500 }
    );
  }
}


// POST /api/sales
// Create a new sale and decrease medicine stock
export async function POST(req: Request) {
  try {
    const { patientName, patient, items, date } =
      await req.json();

    if (
      !patientName ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Patient name and at least one item are required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const lineItems = [];

    for (const it of items) {
      const qty = Number(it.quantity);

      if (!it.medicine || !qty || qty < 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Each item needs a medicine and a valid quantity",
          },
          { status: 400 }
        );
      }

      const med = await Medicine.findById(
        it.medicine
      );

      if (!med) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One of the selected medicines no longer exists",
          },
          { status: 400 }
        );
      }

      if (med.stock < qty) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough stock for ${med.name}. Available: ${med.stock}`,
          },
          { status: 400 }
        );
      }

      lineItems.push({
        medicine: med._id,
        name: med.name,
        quantity: qty,
        price: med.price,
        subtotal: med.price * qty,
      });
    }

    const total = lineItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    // Decrease stock
    for (const item of lineItems) {
      await Medicine.findByIdAndUpdate(
        item.medicine,
        {
          $inc: {
            stock: -item.quantity,
          },
        }
      );
    }

    const sale = await Sale.create({
      patientName: patientName.trim(),
      patient: patient || null,
      items: lineItems,
      total,
      date:
        date ||
        new Date().toISOString().slice(0, 10),
    });

    return NextResponse.json(
      {
        success: true,
        data: sale,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sales", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to record sale",
      },
      { status: 500 }
    );
  }
}


// PATCH /api/sales
//
// Used when editing an existing sale.
//
// IMPORTANT:
// Reducing a sale quantity is treated as a return.
//
// Example:
//
// Original:
// Paracetamol x2 = $10
//
// Edited:
// Paracetamol x1 = $5
//
// Result:
// Sale becomes x1
// Sale total becomes $5
// Medicine stock +1
// Return record created for x1 / $5
//
export async function PATCH(req: Request) {
  try {
    const {
      saleId,
      items,
    } = await req.json();

    if (
      !saleId ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sale ID and items are required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const sale = await Sale.findById(saleId);

    if (!sale) {
      return NextResponse.json(
        {
          success: false,
          message: "Sale not found",
        },
        { status: 404 }
      );
    }

    /*
     * We only allow quantity reductions through
     * the sale edit screen.
     *
     * Increasing a quantity after a return would
     * break the sale/return history.
     *
     * If the customer needs additional medicine,
     * create a new sale instead.
     */

    const originalItems = sale.items.map(
      (item: any) => ({
        medicine: String(item.medicine),
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })
    );

    const requestedItems = items.map(
      (item: any) => ({
        medicine: String(item.medicine),
        quantity: Number(item.quantity),
      })
    );

    const newItems = [];
    const returnRecords = [];

    for (const originalItem of originalItems) {
      const requestedItem =
        requestedItems.find(
          (item) =>
            item.medicine ===
            originalItem.medicine
        );

      /*
       * If medicine is missing from the edited
       * sale, don't silently delete it.
       */
      if (!requestedItem) {
        return NextResponse.json(
          {
            success: false,
            message: `Please keep ${originalItem.name} in the sale and reduce its quantity instead of removing it completely.`,
          },
          { status: 400 }
        );
      }

      const newQuantity = Number(
        requestedItem.quantity
      );

      if (
        !Number.isInteger(newQuantity) ||
        newQuantity < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid quantity for ${originalItem.name}`,
          },
          { status: 400 }
        );
      }

      /*
       * Quantity can only decrease.
       */
      if (newQuantity > originalItem.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `You cannot increase ${originalItem.name} quantity from the edit screen. Create a new sale for additional units.`,
          },
          { status: 400 }
        );
      }

      const returnedQuantity =
        originalItem.quantity - newQuantity;

      /*
       * If quantity was reduced, this is a return.
       */
      if (returnedQuantity > 0) {
        await Medicine.findByIdAndUpdate(
          originalItem.medicine,
          {
            $inc: {
              stock: returnedQuantity,
            },
          }
        );

        /*
         * IMPORTANT:
         * Refund uses the ORIGINAL sale price,
         * not the current medicine price.
         */
        const refund =
          originalItem.price *
          returnedQuantity;

        const returnRecord =
          await Return.create({
            saleId: sale._id,
            medicine: originalItem.medicine,
            name: originalItem.name,
            patientName: sale.patientName,
            quantity: returnedQuantity,
            refund,
            reason: "Returned from sale",
            date: new Date()
              .toISOString()
              .slice(0, 10),
          });

        returnRecords.push(returnRecord);
      }

      newItems.push({
        medicine: originalItem.medicine,
        name: originalItem.name,
        quantity: newQuantity,
        price: originalItem.price,
        subtotal:
          originalItem.price *
          newQuantity,
      });
    }

    /*
     * Make sure no completely new medicine was
     * inserted through PATCH.
     */
    for (const requestedItem of requestedItems) {
  const exists = originalItems.some(
    (originalItem: {
      medicine: string;
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }) =>
      originalItem.medicine ===
      requestedItem.medicine
  );

  if (!exists) {
    return NextResponse.json(
      {
        success: false,
        message:
          "New medicines cannot be added while editing a sale. Create a new sale instead.",
      },
      { status: 400 }
    );
  }
}

    const newTotal = newItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    sale.items = newItems;
    sale.total = newTotal;

    await sale.save();

    return NextResponse.json({
      success: true,
      data: sale,
      returns: returnRecords,
    });
  } catch (error) {
    console.error("PATCH /api/sales", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update sale",
      },
      { status: 500 }
    );
  }
}