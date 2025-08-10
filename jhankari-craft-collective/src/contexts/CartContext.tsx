import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { apiClient } from '../config/api'
import { useToast } from '../hooks/use-toast'

interface CartItem {
  id: string
  name: string
  price: number
  imageUrl: string
  quantity: number
  stockQuantity?: number
}

interface CartContextType {
  items: CartItem[]
  loading: boolean
  totalItems: number
  totalPrice: number
  addToCart: (productId: string, quantity?: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => void
  guestAddToCart: (item: Omit<CartItem, 'quantity'> & { quantity: number }) => void
  mergeGuestCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const GUEST_CART_KEY = 'jhankari_guest_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const { user, session } = useAuth()
  const { toast } = useToast()

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Load guest cart from localStorage
  const loadGuestCart = () => {
    try {
      const guestCartJson = localStorage.getItem(GUEST_CART_KEY)
      if (guestCartJson) {
        const guestCart = JSON.parse(guestCartJson)
        console.log('📥 Loading guest cart:', guestCart)
        setItems(guestCart)
      }
    } catch (error) {
      console.error('❌ Error loading guest cart:', error)
    }
  }

  // Save guest cart to localStorage
  const saveGuestCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems))
      console.log('💾 Saved guest cart:', cartItems)
    } catch (error) {
      console.error('❌ Error saving guest cart:', error)
    }
  }

  // Load user cart from server
  const loadUserCart = async (userId: string) => {
    try {
      setLoading(true)
      console.log('📥 Loading user cart from server...')
      
      const response = await apiClient.get(`/cart/${userId}`)
      
      if (response.data.success && response.data.CartItem) {
        const userCartItems = response.data.CartItem
          .filter((item: any) => item.Product) // Filter out items with null products
          .map((item: any) => ({
            id: item.Product.id,
            name: item.Product.name,
            price: item.Product.price,
            imageUrl: item.Product.image_url,
            quantity: item.quantity,
            stockQuantity: item.Product.stock_quantity
          })) || []
        
        console.log('✅ Loaded user cart:', userCartItems)
        setItems(userCartItems)
      }
    } catch (error) {
      console.error('❌ Error loading user cart:', error)
    } finally {
      setLoading(false)
    }
  }

  // Merge guest cart with user cart after login
  const mergeGuestCart = async () => {
    if (!user || !session) return

    try {
      const guestCartJson = localStorage.getItem(GUEST_CART_KEY)
      if (!guestCartJson) return

      const guestCart = JSON.parse(guestCartJson)
      if (guestCart.length === 0) return

      console.log('🔄 Merging guest cart with user cart:', guestCart)
      setLoading(true)

      // Convert guest cart format for API
      const guestCartItems = guestCart.map((item: CartItem) => ({
        productId: item.id,
        quantity: item.quantity
      }))

      const response = await apiClient.post('/cart/merge', {
        userId: user.id,
        guestCartItems
      })

      if (response.data.success) {
        console.log('✅ Guest cart merged successfully')
        
        // Clear guest cart from localStorage
        localStorage.removeItem(GUEST_CART_KEY)
        
        // Reload user cart to get merged data
        await loadUserCart(user.id)
        
        toast({
          title: "Cart merged!",
          description: "Your items have been added to your account"
        })
      }
    } catch (error) {
      console.error('❌ Error merging cart:', error)
      toast({
        title: "Merge failed",
        description: "Failed to merge cart items",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Add item to cart (server for users, localStorage for guests)
  const addToCart = async (productId: string, quantity: number = 1) => {
    if (user && session) {
      // Authenticated user - add to server
      try {
        setLoading(true)
        console.log('🛒 Adding to server cart:', { userId: user.id, productId, quantity })
        
        const response = await apiClient.post('/cart', {
          userId: user.id,
          productId,
          quantity
        })

        if (response.data.success) {
          console.log('✅ Added to server cart successfully')
          // Reload cart to get updated data
          await loadUserCart(user.id)
        }
      } catch (error) {
        console.error('❌ Error adding to server cart:', error)
        throw error
      } finally {
        setLoading(false)
      }
    } else {
      // Guest user - this shouldn't be called, use guestAddToCart instead
      throw new Error('Use guestAddToCart for guest users')
    }
  }

  // Add item to guest cart (localStorage)
  const guestAddToCart = (newItem: Omit<CartItem, 'quantity'> & { quantity: number }) => {
    console.log('🛒 Adding to guest cart:', newItem)
    
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(item => item.id === newItem.id)
      let updatedItems: CartItem[]

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        updatedItems = currentItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        )
      } else {
        // Add new item
        updatedItems = [...currentItems, { ...newItem }]
      }

      // Save to localStorage
      saveGuestCart(updatedItems)
      return updatedItems
    })
  }

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    if (user && session) {
      // Authenticated user
      try {
        setLoading(true)
        
        const response = await apiClient.delete('/cart', {
          data: { userId: user.id, productId }
        })

        if (response.data.success) {
          await loadUserCart(user.id)
        }
      } catch (error) {
        console.error('❌ Error removing from cart:', error)
        throw error
      } finally {
        setLoading(false)
      }
    } else {
      // Guest user
      setItems(currentItems => {
        const updatedItems = currentItems.filter(item => item.id !== productId)
        saveGuestCart(updatedItems)
        return updatedItems
      })
    }
  }

  // Update item quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    if (user && session) {
      // For authenticated users, remove and re-add with new quantity
      await removeFromCart(productId)
      await addToCart(productId, quantity)
    } else {
      // Guest user
      setItems(currentItems => {
        const updatedItems = currentItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
        saveGuestCart(updatedItems)
        return updatedItems
      })
    }
  }

  // Clear cart
  const clearCart = () => {
    setItems([])
    if (!user) {
      localStorage.removeItem(GUEST_CART_KEY)
    }
  }

  // Load appropriate cart on auth state change
  useEffect(() => {
    if (user && session) {
      console.log('👤 User logged in, loading user cart and merging guest cart')
      loadUserCart(user.id).then(() => {
        mergeGuestCart()
      })
    } else {
      console.log('👤 No user, loading guest cart')
      loadGuestCart()
    }
  }, [user, session])

  const value = {
    items,
    loading,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    guestAddToCart,
    mergeGuestCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
