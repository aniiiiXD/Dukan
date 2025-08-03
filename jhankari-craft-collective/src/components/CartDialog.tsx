import { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ShoppingBag, Package, CreditCard, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/config/api';
import OTPLoginDialog from './OTPLoginDialog';
import { 
  getGuestCart, 
  removeGuestCartItem,
  updateGuestCartItemQuantity,
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

const CartDialog = ({ onCartUpdate }: { onCartUpdate?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCart, setGuestCartState] = useState<GuestCartItem[]>(getGuestCart());
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [showOTPLogin, setShowOTPLogin] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const { toast } = useToast();
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

  // Load cart when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (user) {
        loadCart();
      } else {
        setGuestCartState(getGuestCart());
      }
    }
  }, [isOpen, user]);

  const loadCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(`/cart/${user.id}`);
      setCart(response.data);
    } catch (error) {
      console.error("❌ Error loading cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (user) {
      try {
        await apiClient.delete("/cart", {
          data: {
            userId: user.id,
            productId: productId
          }
        });
        
        await loadCart();
        onCartUpdate?.();
        
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart.",
        });
      } catch (error) {
        console.error("❌ Error removing item:", error);
        toast({
          title: "Error",
          description: "Failed to remove item from cart.",
          variant: "destructive",
        });
      }
    } else {
      removeGuestCartItem(productId);
      setGuestCartState(getGuestCart());
      onCartUpdate?.();
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    }
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (user) {
      try {
        await apiClient.delete("/cart", {
          data: {
            userId: user.id,
            productId: productId
          }
        });
        
        await apiClient.post("/cart", {
          userId: user.id,
          productId: productId,
          quantity: newQuantity
        });
        
        await loadCart();
        onCartUpdate?.();
      } catch (error) {
        console.error("❌ Error updating quantity:", error);
        toast({
          title: "Error",
          description: "Failed to update item quantity.",
          variant: "destructive",
        });
      }
    } else {
      updateGuestCartItemQuantity(productId, newQuantity);
      setGuestCartState(getGuestCart());
      onCartUpdate?.();
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !shippingAddress.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a shipping address.",
        variant: "destructive",
      });
      return;
    }

    setOrderLoading(true);
    try {
      const response = await apiClient.post("/order", {
        userId: user.id,
        shippingAddress: shippingAddress
      });
      
      const order = response.data.order || response.data;
      
      setCart(null);
      setIsOpen(false);
      setShippingAddress("");
      onCartUpdate?.();
      
      toast({
        title: "Order placed successfully! 🎉",
        description: `Your order #${order.order_number || order.id} has been confirmed.`,
      });
    } catch (error) {
      console.error("❌ Error placing order:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const calculateTotal = () => {
    if (isAuthenticated && cart?.CartItem) {
      return cart.CartItem.reduce((total, item) => {
        const price = parseFloat(item.Product?.price?.toString() || '0');
        return total + price * item.quantity;
      }, 0);
    } else {
      return guestCart.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId);
        const price = product ? parseFloat(product.price?.toString() || '0') : 0;
        return total + price * item.quantity;
      }, 0);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowOTPLogin(true);
      return;
    }
    handlePlaceOrder();
  };

  const handleLoginSuccess = () => {
    setShowOTPLogin(false);
    setTimeout(() => {
      loadCart();
    }, 1000);
  };

  // Get current cart items for display
  const currentCartItems = () => {
    if (isAuthenticated && cart?.CartItem) {
      return cart.CartItem;
    } else {
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
    }
  };

  const cartItems = currentCartItems();
  const hasItems = cartItems.length > 0;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = calculateTotal();

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
            <div className="p-2 bg-royal-purple/10 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-royal-purple" />
            </div>
            <div>
              <span>Shopping Cart</span>
              {hasItems && (
                <div className="text-sm font-normal text-muted-foreground">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} • ₹{totalAmount.toLocaleString('en-IN')}
                </div>
              )}
            </div>
            {!isAuthenticated && hasItems && (
              <Badge variant="outline" className="ml-auto text-xs">
                Login required at checkout
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
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
          ) : !hasItems ? (
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
          ) : (
            <div className="p-4 space-y-6">
              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((item, index) => (
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
                ))}
              </div>

              {/* Order Summary */}
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
                  
                  {isAuthenticated && (
                    <div className="space-y-2">
                      <Label htmlFor="shipping-address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </Label>
                      <Input
                        id="shipping-address"
                        placeholder="Enter your complete shipping address with pincode"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="min-h-[44px]"
                      />
                    </div>
                  )}

                  <Button
                    variant="royal"
                    size="lg"
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={handleCheckout}
                    disabled={orderLoading || (isAuthenticated && !shippingAddress.trim())}
                  >
                    {!isAuthenticated ? (
                      <>
                        <User className="h-5 w-5 mr-2" />
                        Login to Checkout
                      </>
                    ) : orderLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Place Order • ₹{totalAmount.toLocaleString('en-IN')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
      
      <OTPLoginDialog
        open={showOTPLogin}
        onClose={() => setShowOTPLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </Dialog>
  );
};

export default CartDialog;
