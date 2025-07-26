import { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { LoginDialog } from './LoginDialog';
import { apiClient } from '@/config/api';

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
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadCart();
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
    if (!user) return;
 
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
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (!user || newQuantity < 1) return;

    try {
      // Remove the item first
      await apiClient.delete("/cart", {
        data: {
          userId: user.id,
          productId: productId
        }
      });
      
      // Add it back with new quantity
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
        title: "Order placed!",
        description: `Your order has been placed successfully. Order ID: ${order.id}`,
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
    if (!cart?.CartItem) return 0;
    return cart.CartItem.reduce((total, item) => {
      const price = parseFloat(item.Product?.price?.toString() || '0');
      return total + price * item.quantity;
    }, 0);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    handlePlaceOrder();
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingBag className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Please Login</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">You need to be logged in to view your cart.</p>
          <Button onClick={() => setShowLoginDialog(true)} className="w-full">
            Login Now
          </Button>
        </DialogContent>
        
        <LoginDialog
          open={showLoginDialog}
          onClose={() => setShowLoginDialog(false)}
          onLoginSuccess={() => {
            setShowLoginDialog(false);
          }}
        />
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="bg-muted h-16 w-16 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-4 rounded w-3/4"></div>
                  <div className="bg-muted h-4 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !cart?.CartItem || cart.CartItem.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-4">Start shopping to add items to your cart</p>
            <Button variant="royal" onClick={() => setIsOpen(false)}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {cart.CartItem.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.Product?.image_url || "/placeholder.jpg"}
                      alt={item.Product?.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold line-clamp-2">{item.Product?.name}</h4>
                      <p className="text-royal-crimson font-bold">
                        ₹{(item.Product?.price || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {item.Product?.stock_quantity || 0}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= (item.Product?.stock_quantity || 0)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total: ₹{calculateTotal().toLocaleString('en-IN')}</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shipping-address">Shipping Address</Label>
                  <Input
                    id="shipping-address"
                    placeholder="Enter your complete shipping address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                  />
                </div>

                <Button
                  variant="royal"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={orderLoading || !shippingAddress.trim()}
                >
                  {orderLoading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
      
      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onLoginSuccess={() => {
          setShowLoginDialog(false);
          handlePlaceOrder();
        }}
      />
    </Dialog>
  );
};

export default CartDialog;
