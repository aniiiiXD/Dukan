import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import CheckoutForm from './CheckoutForm'

interface CartDialogProps {
  onCartUpdate?: () => void
}

const CartDialog = ({ onCartUpdate }: CartDialogProps) => {
  const [open, setOpen] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const { items, loading, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart()
  const { user, signInWithGoogle } = useAuth()

  // Handle login for checkout
  const handleLogin = async () => {
    try {
      console.log('🔄 Cart login initiated...')
      const success = await signInWithGoogle()
      if (success) {
        console.log('✅ Cart login successful')
        // Keep dialog open to show cart merge process
      }
    } catch (error) {
      console.error('❌ Cart login error:', error)
    }
  }

  // Handle quantity changes
  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    try {
      await updateQuantity(productId, newQuantity)
      onCartUpdate?.()
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  // Handle item removal
  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId)
      onCartUpdate?.()
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  // Proceed to checkout
  const handleProceedToCheckout = () => {
    setOpen(false)
    setShowCheckout(true)
  }

  // Handle back from checkout
  const handleBackToCart = () => {
    setShowCheckout(false)
    setOpen(true)
  }

  // Handle order completion
  const handleOrderComplete = (orderId: string) => {
    setShowCheckout(false)
    console.log('🎉 Order completed:', orderId)
    // You can add success redirect or notification here
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative hover:bg-royal-purple/10 transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-royal-purple text-white">
                {totalItems}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart ({totalItems})
            </DialogTitle>
            <DialogDescription>
              Review your items and proceed to checkout
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-royal-purple border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading cart...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Add some beautiful crafts to get started!</p>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString('en-IN')}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={loading}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={loading}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-700 ml-2"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total: ₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>

                  {!user ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground text-center">
                        Sign in to continue with checkout
                      </p>
                      <Button 
                        onClick={handleLogin}
                        className="w-full bg-royal-purple hover:bg-royal-purple/90"
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-royal-purple hover:bg-royal-purple/90"
                      onClick={handleProceedToCheckout}
                    >
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Form Overlay */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-white">
          <CheckoutForm 
            onOrderComplete={handleOrderComplete}
            onBack={handleBackToCart}
          />
        </div>
      )}
    </>
  )
}

export default CartDialog
