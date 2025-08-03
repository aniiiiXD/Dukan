// src/utils/cart.ts

export interface GuestCartItem {
  productId: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'jhankari_guest_cart';

export function getGuestCart(): GuestCartItem[] {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function setGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function clearGuestCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function addOrUpdateGuestCartItem(productId: string, quantity: number) {
  const cart = getGuestCart();
  const idx = cart.findIndex(item => item.productId === productId);

  if (idx !== -1) {
    cart[idx].quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  setGuestCart(cart);
}

export function removeGuestCartItem(productId: string) {
  const cart = getGuestCart();
  const updatedCart = cart.filter(item => item.productId !== productId);
  setGuestCart(updatedCart);
}

export function updateGuestCartItemQuantity(productId: string, quantity: number) {
  const cart = getGuestCart();
  const idx = cart.findIndex(item => item.productId === productId);
  
  if (idx !== -1) {
    if (quantity <= 0) {
      removeGuestCartItem(productId);
    } else {
      cart[idx].quantity = quantity;
      setGuestCart(cart);
    }
  }
}
