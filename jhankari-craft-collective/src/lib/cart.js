import { createClient } from "./supabase/client";

export const addToCart = async (productId, quantity = 1) => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase.from("cart_items").upsert({
    user_id: user.id,
    product_id: productId,
    quantity,
  });

  if (error) throw error;
  return data;
};

export const getCart = async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      products (
        name,
        price,
        image_url
      )
    `
    )
    .eq("user_id", user.id);

  if (error) throw error;
  return data;
};
