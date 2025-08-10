import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Heart, ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'

interface Product {
  id: string
  name: string
  price: number
  imageUrl: string
  description?: string
  stockQuantity: number
}

interface ProductCardProps {
  product: Product
  onCartUpdate?: () => void
}

const ProductCard = ({ product, onCartUpdate }: ProductCardProps) => {
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const { user } = useAuth()
  const { addToCart, guestAddToCart } = useCart()
  const { toast } = useToast()

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleAddToCart = async () => {
    if (!product || product.stockQuantity <= 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      if (user) {
        // User is authenticated - add to server cart
        await addToCart(product.id, 1)
        toast({
          title: "Added to cart!",
          description: `${product.name} has been added to your cart`
        })
      } else {
        // Guest user - add to local storage
        guestAddToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
          stockQuantity: product.stockQuantity
        })
        toast({
          title: "Added to cart!",
          description: `${product.name} added to cart. Login at checkout to continue.`
        })
      }
      
      onCartUpdate?.()
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Safe price handling
  const safePrice = product?.price || 0
  const safeStockQuantity = product?.stockQuantity || 0

  return (
    <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-royal-purple/20 border-0 bg-gradient-to-br from-white to-gray-50">
      <div className="relative overflow-hidden">
        {imageLoading && (
          <div className="h-64 w-full bg-gray-200 animate-pulse flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {imageError ? (
          <div className="h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Image not available</p>
            </div>
          </div>
        ) : (
          <img
            src={product.imageUrl || '/placeholder.jpg'}
            alt={product.name}
            className={`h-64 w-full object-cover transition-all duration-300 group-hover:scale-105 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-white bg-black/20 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-black/40"
        >
          <Heart className="h-4 w-4" />
        </Button>

        {safeStockQuantity <= 5 && safeStockQuantity > 0 && (
          <div className="absolute left-2 top-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Only {safeStockQuantity} left
          </div>
        )}

        {safeStockQuantity === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-6 flex-1">
        <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-800 group-hover:text-royal-purple transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          <p className="text-royal-crimson font-bold text-2xl">
            ₹{safePrice.toLocaleString('en-IN')}
          </p>
          <div className="text-right">
            <p className="text-xs text-gray-500">Stock</p>
            <p className="text-sm font-medium text-gray-700">{safeStockQuantity}</p>
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          variant="royal"
          className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          onClick={handleAddToCart}
          disabled={loading || safeStockQuantity === 0}
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {loading ? (
            <span className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Adding...
            </span>
          ) : safeStockQuantity === 0 ? (
            'Out of Stock'
          ) : (
            'Add to Cart'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProductCard
