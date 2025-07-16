import { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getCartCount } from "@/lib/mockDatabase";
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CartDialog = ({ onCartUpdate }: { onCartUpdate?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, [isOpen]);

  console.log("🔵 CartDialog rendered");

  useEffect(() => {
    if (isOpen && user) {
      loadCart();
    }
  }, [isOpen, user]);

  const loadCart = async () => {
    console.log("🔵 loadCart called");
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`https://dukan-backend-preview.vercel.app/api/v1/cart/${user.id}`);
      const apiCart = response.data;
      
      // Transform API response to match expected format
      const transformedCart = {
        id: apiCart.id,
        userId: apiCart.userId,
        items: apiCart.CartItem.map(cartItem => ({
          id: cartItem.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          addedAt: cartItem.addedAt,
          product: cartItem.Product
        }))
      };
      
      setCart(transformedCart);
      console.log("✅ Cart loaded and transformed:", transformedCart);
    } catch (error) {
      console.error("❌ Error loading cart:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load cart.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    console.log("🔵 handleRemoveItem called with productId:", productId);
    if (!user) return;
 
    try {
      await axios.delete("https://dukan-backend-preview.vercel.app/api/v1/cart", {
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
        description: error.response?.data?.message || "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    console.log("🔵 handleUpdateQuantity called with:", { productId, newQuantity });
    if (!user || newQuantity < 1) return;

    try {
      // First remove the item
      await axios.delete("https://dukan-backend-preview.vercel.app/api/v1/cart", {
        data: {
          userId: user.id,
          productId: productId
        }
      });
      
      // Then add it back with new quantity
      await axios.post("https://dukan-backend-preview.vercel.app/api/v1/cart", {
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
        description: error.response?.data?.message || "Failed to update item quantity.",
        variant: "destructive",
      });
    }
  };

  const handlePlaceOrder = async () => {
    console.log("🔵 handlePlaceOrder called with address:", shippingAddress);
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
      const response = await axios.post("https://dukan-backend-preview.vercel.app/api/v1/order", {
        userId: user.id,
        shippingAddress: shippingAddress
      });
      const order = response.data;
      console.log("✅ Order placed:", order);
      
      // Clear cart after successful order
      setCart(null);
      setIsOpen(false);
      
      toast({
        title: "Order placed!",
        description: "Your order has been placed successfully. Order ID: " + order.id,
      });
    } catch (error) {
      console.error("❌ Error placing order:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      // Convert price to number since it comes as string from API
      const price = parseFloat(item.product?.price || '0');
      return total + price * item.quantity;
    }, 0);
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
        </DialogContent>
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
        ) : !cart?.items || cart.items.length === 0 ? (
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
              {cart.items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.product?.imageUrl || "/placeholder.jpg"}
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold line-clamp-2">{item.product?.name}</h4>
                      <p className="text-royal-crimson font-bold">
                        ₹{(item.product?.price || 0).toLocaleString('en-IN')}
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
                  onClick={handlePlaceOrder}
                  disabled={orderLoading || !shippingAddress.trim()}
                >
                  {orderLoading ? "Placing Order..." : `Place Order - ₹${calculateTotal().toLocaleString('en-IN')}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;