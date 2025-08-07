import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const {
      items,
      billingAddress,
      shippingAddress,
      phoneNumber,
      email,
      totalAmount,
      paymentMethod = "razorpay",
    } = await request.json();

    // Validate required fields
    if (!billingAddress || !phoneNumber || !email || !items || !totalAmount) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        customer_email: email,
        customer_phone: phoneNumber,
      },
    });

    // Store order in database
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        razorpay_order_id: razorpayOrder.id,
        customer_email: email,
        customer_phone: phoneNumber,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        items: items,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return Response.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      order: order,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle payment verification
export async function PUT(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    // Verify payment signature
    const crypto = require("crypto");
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return Response.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Update order status
    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update({
        razorpay_payment_id: razorpay_payment_id,
        payment_signature: razorpay_signature,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
