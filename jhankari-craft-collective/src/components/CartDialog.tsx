// ==========================================
// IMPORTS & TYPE DEFINITIONS
// ==========================================
import { useState, useEffect, useCallback } from "react";
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Package, 
  CreditCard, 
  MapPin, 
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/config/api';
import { AddressForm } from './AddressForm';
import { 
  getGuestCart, 
  removeGuestCartItem,
  updateGuestCartItemQuantity,
  GuestCartItem,
  clearGuestCart
} from '@/utils/cart';

// Global type declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Type definitions
interface CartProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  stock_quantity: number;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  addedAt: string;
  Product: CartProduct;
}

interface Cart {
  id: string;
  userId: string;
  CartItem: CartItem[];
}

interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CartDialogProps {
  onCartUpdate?: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface OrderData {
  success: boolean;
  key_id: string;
  amount: number;
  currency: string;
  razorpay_order_id: string;
  test_mode?: boolean;
}

type CheckoutStep = 'cart' | 'address' | 'payment';

// ==========================================
// MAIN COMPONENT
// ==========================================
const CartDialog = ({ onCartUpdate }: CartDialogProps) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCart, setGuestCartState] = useState<GuestCartItem[]>([]);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [orderLoading, setOrderLoading] = useState<boolean>(false);
  const [step, setStep] = useState<CheckoutStep>('cart');

  // ==========================================
  // HOOKS & CONTEXT
  // ==========================================
  const { toast } = useToast();
  const { user, isAuthenticated, signInWithGoogle } = useAuth();

  // ==========================================
  // PAYMENT VERIFICATION FUNCTION (MOVED TO TOP)
  // ==========================================
  const verifyPayment = useCallback(async (paymentResponse: RazorpayResponse) => {
    try {
      console.log('🔐 Verifying payment:', paymentResponse);
      
      const response = await apiClient.put('/orders', {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      });

      if (response.data.success) {
        // Clear cart
        if (user) {
          setCart(null);
        } else {
          clearGuestCart();
          setGuestCartState([]);
        }
        
        onCartUpdate?.();
        setIsOpen(false);
        setStep('cart');
        
        toast({
          title: "Payment successful! 🎉",
          description: "Your order has been placed successfully.",
        });
      } else {
        toast({
          title: "Payment verification failed",
          description: "Please contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      toast({
        title: "Payment verification failed",
        description: "Please contact support.",
        variant: "destructive",
      });
    }
  }, [user, onCartUpdate, toast]);

  // ==========================================
  // RAZORPAY PAYMENT FUNCTION
  // ==========================================
  const initiateRazorpayPayment = useCallback((orderData: OrderData, customerInfo: Address) => {
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Jhankari Craft Collective',
      description: 'Order Payment',
      order_id: orderData.razorpay_order_id,
      prefill: {
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        email: customerInfo.email,
        contact: customerInfo.phone
      },
      notes: {
        address: customerInfo.addressLine1
      },
      theme: {
        color: '#8B5CF6'
      },
      handler: async (response: RazorpayResponse) => {
        await verifyPayment(response);
      },
      modal: {
        ondismiss: () => {
          toast({
            title: "Payment cancelled",
            description: "Your order has been saved. Complete payment to confirm.",
          });
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }, [toast, verifyPayment]);

  // ==========================================
  // DATA LOADING FUNCTIONS
  // ==========================================
  const loadProducts = useCallback(async () => {
    try {
      const response = await apiClient.get('/products');
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, []);

  const loadCart = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(`/cart/${user.id}`);
      setCart(response.data);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const refreshGuestCart = useCallback(() => {
    setGuestCartState(getGuestCart());
  }, []);

  // ==========================================
  // CART MANAGEMENT FUNCTIONS
  // ==========================================
  const handleRemoveItem = useCallback(async (productId: string) => {
    if (user) {
      try {
        await apiClient.delete("/cart", {
          data: { userId: user.id, productId }
        });
        
        await loadCart();
        onCartUpdate?.();
        
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart.",
        });
      } catch (error) {
        console.error("Error removing item:", error);
        toast({
          title: "Error",
          description: "Failed to remove item from cart.",
          variant: "destructive",
        });
      }
    } else {
      removeGuestCartItem(productId);
      refreshGuestCart();
      onCartUpdate?.();
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    }
  }, [user, loadCart, onCartUpdate, toast, refreshGuestCart]);

  const handleUpdateQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (user) {
      try {
        await apiClient.delete("/cart", {
          data: { userId: user.id, productId }
        });
        
        await apiClient.post("/cart", {
          userId: user.id,
          productId,
          quantity: newQuantity
        });
        
        await loadCart();
        onCartUpdate?.();
      } catch (error) {
        console.error("Error updating quantity:", error);
        toast({
          title: "Error",
          description: "Failed to update item quantity.",
          variant: "destructive",
        });
      }
    } else {
      updateGuestCartItemQuantity(productId, newQuantity);
      refreshGuestCart();
      onCartUpdate?.();
    }
  }, [user, loadCart, onCartUpdate, toast, refreshGuestCart]);

  // ==========================================
  // CART DATA UTILITIES
  // ==========================================
  const getCurrentCartItems = useCallback((): CartItem[] => {
    if (isAuthenticated && cart?.CartItem) {
      return cart.CartItem;
    }
    
    return guestCart.map(item => {
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
  }, [isAuthenticated, cart, guestCart, products]);

  const calculateTotal = useCallback((): number => {
    const items = getCurrentCartItems();
    return items.reduce((total, item) => {
      const price = parseFloat(item.Product?.price?.toString() || '0');
      return total + price * item.quantity;
    }, 0);
  }, [getCurrentCartItems]);

  const getTotalItems = useCallback((): number => {
    const items = getCurrentCartItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [getCurrentCartItems]);

  // ==========================================
  // AUTHENTICATION HANDLERS
  // ==========================================
  const handleGoogleLogin = useCallback(async () => {
    try {
      const success = await signInWithGoogle();
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome to Jhankari!",
        });
        setTimeout(() => {
          loadCart();
        }, 1000);
      } else {
        toast({
          title: "Login failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }, [signInWithGoogle, toast, loadCart]);

  // ==========================================
  // CHECKOUT & PAYMENT HANDLERS
  // ==========================================
  const handleCheckout = useCallback(() => {
    if (!isAuthenticated) {
      handleGoogleLogin();
      return;
    }
    setStep('address');
  }, [isAuthenticated, handleGoogleLogin]);

  const handleAddressSubmit = useCallback(async (billingAddress: Address, shippingAddress: Address) => {
    setOrderLoading(true);
    
    try {
      const orderData = {
        items: getCurrentCartItems(),
        billingAddress,
        shippingAddress,
        phoneNumber: billingAddress.phone,
        email: billingAddress.email,
        totalAmount: calculateTotal()
      };

      console.log('🛒 Submitting order:', orderData);

      const response = await apiClient.post('/orders', orderData);

      if (response.data.success) {
        if (response.data.test_mode) {
          // Handle test mode payment
          await verifyPayment({
            razorpay_order_id: response.data.razorpay_order_id,
            razorpay_payment_id: 'test_payment_' + Date.now(),
            razorpay_signature: 'test_signature'
          });
        } else {
          // Handle real Razorpay payment
          initiateRazorpayPayment(response.data, billingAddress);
        }
      } else {
        throw new Error(response.data.error || 'Order creation failed');
      }
    } catch (error: any) {
      console.error('Order creation failed:', error);
      
      let errorMessage = "Failed to create order. Please try again.";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = `Order creation failed: ${errorData.details.join(', ')}`;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }

      toast({
        title: "Order Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setOrderLoading(false);
    }
  }, [getCurrentCartItems, calculateTotal, toast, verifyPayment, initiateRazorpayPayment]);

  // ==========================================
  // UI HELPER FUNCTIONS
  // ==========================================
  const getStepTitle = useCallback((): string => {
    switch(step) {
      case 'cart': return 'Shopping Cart';
      case 'address': return 'Shipping Details';
      case 'payment': return 'Payment';
      default: return 'Shopping Cart';
    }
  }, [step]);

  const handleStepNavigation = useCallback(() => {
    if (step === 'address') {
      setStep('cart');
    } else if (step === 'payment') {
      setStep('address');
    }
  }, [step]);

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        loadCart();
      } else {
        refreshGuestCart();
      }
      setStep('cart');
    }
  }, [isOpen, user, loadCart, refreshGuestCart]);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const cartItems = getCurrentCartItems();
  const hasItems = cartItems.length > 0;
  const totalItems = getTotalItems();
  const totalAmount = calculateTotal();

  // ==========================================
  // RENDER COMPONENTS
  // ==========================================
  const renderCartItem = (item: CartItem, index: number) => (
    <Card key={item.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex gap-4">
          <div className="relative">
            <img
              src={item.Product?.image_url || "/placeholder.jpg"}
              alt={item.Product?.name}
              className="w-20 h-20 object-cover rounded-lg border"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.jpg';
              }}
            />
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {item.quantity}
            </Badge>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base line-clamp-2 mb-1 text-gray-800">
              {item.Product?.name}
            </h4>
            <p className="text-royal-crimson font-bold text-lg mb-2">
              ₹{(item.Product?.price || 0).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Stock: {item.Product?.stock_quantity || 0}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(item.productId)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center font-medium text-sm">
                {item.quantity}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                disabled={item.quantity >= (item.Product?.stock_quantity || 0)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {index < cartItems.length - 1 && <Separator />}
    </Card>
  );

  const renderEmptyCart = () => (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">Your cart is empty</h3>
        <p className="text-gray-600 mb-6">Discover our amazing collection of authentic Rajasthani crafts</p>
      </div>
      <Button variant="royal" size="lg" onClick={() => setIsOpen(false)}>
        <Package className="h-5 w-5 mr-2" />
        Continue Shopping
      </Button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="space-y-4 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <Card className="p-4">
            <div className="flex gap-4">
              <div className="bg-muted h-20 w-20 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="bg-muted h-4 rounded w-3/4"></div>
                <div className="bg-muted h-4 rounded w-1/2"></div>
                <div className="bg-muted h-6 rounded w-1/4"></div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );

  const renderOrderSummary = () => (
    <Card className="border-2 border-royal-purple/20 bg-gradient-to-br from-royal-purple/5 to-royal-crimson/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-royal-purple" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({totalItems} items)</span>
            <span className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-green-600">Free</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-royal-crimson">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <Button
          variant="royal"
          size="lg"
          className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          onClick={handleCheckout}
          disabled={!hasItems}
        >
          {!isAuthenticated ? (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google to Checkout
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Proceed to Checkout • ₹{totalAmount.toLocaleString('en-IN')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-royal-purple/10 transition-colors">
          <ShoppingBag className="h-6 w-6" />
          {hasItems && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            {step !== 'cart' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleStepNavigation}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="p-2 bg-royal-purple/10 rounded-lg">
              {step === 'cart' && <ShoppingBag className="h-6 w-6 text-royal-purple" />}
              {step === 'address' && <MapPin className="h-6 w-6 text-royal-purple" />}
              {step === 'payment' && <CreditCard className="h-6 w-6 text-royal-purple" />}
            </div>
            <div>
              <span>{getStepTitle()}</span>
              {step === 'cart' && hasItems && (
                <div className="text-sm font-normal text-muted-foreground">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} • ₹{totalAmount.toLocaleString('en-IN')}
                </div>
              )}
            </div>
            {step === 'cart' && !isAuthenticated && hasItems && (
              <Badge variant="outline" className="ml-auto text-xs">
                Google login required at checkout
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'cart' && (
            <>
              {loading ? renderLoadingState() :
               !hasItems ? renderEmptyCart() : (
                <div className="p-4 space-y-6">
                  <div className="space-y-3">
                    {cartItems.map(renderCartItem)}
                  </div>
                  {renderOrderSummary()}
                </div>
              )}
            </>
          )}

          {step === 'address' && (
            <div className="p-4">
              <AddressForm 
                onSubmit={handleAddressSubmit}
                loading={orderLoading}
                initialData={{
                  firstName: user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
                  lastName: user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ')[1] || '',
                  email: user?.email || '',
                  phone: user?.user_metadata?.phone_number || user?.phone || ''
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;
