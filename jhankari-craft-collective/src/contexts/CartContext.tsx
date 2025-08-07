import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '@/config/api';
import { 
  getGuestCart, 
  addGuestCartItem,
  removeGuestCartItem,
  updateGuestCartItemQuantity,
  clearGuestCart,
  GuestCartItem 
} from '@/utils/cart';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  addedAt: string;
  Product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    stock_quantity: number;
  };
}

interface Cart {
  id: string;
  userId: string;
  CartItem: CartItem[];
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  total: number;
  totalItems: number;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Load products for guest cart display
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await apiClient.get('/products');
        if (response.data.success) {
          setProducts(response.data.data);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  const calculateTotal = () => {
    if (isAuthenticated) {
      return items.reduce((total, item) => {
        const price = parseFloat(item.Product?.price?.toString() || '0');
        return total + price * item.quantity;
      }, 0);
    } else {
      const guestCart = getGuestCart();
      return guestCart.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId);
        const price = product ? parseFloat(product.price?.toString() || '0') : 0;
        return total + price * item.quantity;
      }, 0);
    }
  };

  const calculateTotalItems = () => {
    if (isAuthenticated) {
      return items.reduce((sum, item) => sum + item.quantity, 0);
    } else {
      const guestCart = getGuestCart();
      return guestCart.reduce((sum, item) => sum + item.quantity, 0);
    }
  };

  const refreshCart = async () => {
    if (!isAuthenticated || !user) {
      // For guest users, convert guest cart to items format
      const guestCart = getGuestCart();
      const guestItems: CartItem[] = guestCart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          id: `guest-${item.productId}`,
          productId: item.productId,
          quantity: item.quantity,
          addedAt: new Date().toISOString(),
          Product: product || {
            id: item.productId,
            name: 'Loading...',
            price: 0,
            image_url: '/placeholder.jpg',
            stock_quantity: 0
          }
        };
      });
      setItems(guestItems);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get(`/cart/${user.id}`);
      setItems(response.data.CartItem || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productId: string, quantity: number = 1) => {
    if (!isAuthenticated || !user) {
      // Handle guest cart
      addGuestCartItem(productId, quantity);
      await refreshCart();
      return;
    }

    try {
      await apiClient.post('/cart', {
        userId: user.id,
        productId: productId,
        quantity: quantity
      });
      await refreshCart();
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  };

  const removeItem = async (productId: string) => {
    if (!isAuthenticated || !user) {
      // Handle guest cart
      removeGuestCartItem(productId);
      await refreshCart();
      return;
    }

    try {
      await apiClient.delete('/cart', {
        data: {
          userId: user.id,
          productId: productId
        }
      });
      await refreshCart();
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (!isAuthenticated || !user) {
      // Handle guest cart
      updateGuestCartItemQuantity(productId, newQuantity);
      await refreshCart();
      return;
    }

    try {
      await apiClient.delete('/cart', {
        data: {
          userId: user.id,
          productId: productId
        }
      });
      
      await apiClient.post('/cart', {
        userId: user.id,
        productId: productId,
        quantity: newQuantity
      });
      
      await refreshCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const clearCart = () => {
    if (!isAuthenticated) {
      clearGuestCart();
    }
    setItems([]);
  };

  // Refresh cart when authentication state changes
  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, user, products]);

  const value = {
    items: isAuthenticated ? items : items, // Already handled in refreshCart
    loading,
    total: calculateTotal(),
    totalItems: calculateTotalItems(),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
