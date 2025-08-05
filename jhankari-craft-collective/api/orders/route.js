import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      items,
      billing_address,
      shipping_address,
      subtotal,
      tax_amount,
      shipping_amount,
      total_amount,
    } = body;

    // Generate order number
    const order_number = `ORD-${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number,
        user_id: user.id,
        seller_id: items[0].seller_id, // Assuming single seller for now
        subtotal,
        tax_amount,
        shipping_amount,
        total_amount,
        billing_address,
        shipping_address,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
