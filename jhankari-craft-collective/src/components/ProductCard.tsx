import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ShoppingCart, Heart, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/config/api';
import { addOrUpdateGuestCartItem } from '@/utils/cart';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description?: string;
  stock_quantity: number;
}

interface ProductCardProps {
  product: Product;
  onCartUpdate?: () => void;
}

const ProductCard = ({ product, onCartUpdate }: ProductCardProps) => {
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleAddToCart = async () => {
    setLoading(true);
    
    try {
      if (isAuthenticated && user) {
        // Logged-in user: Add via API
        await apiClient.post('/cart', {
          userId: user.id,
          productId: product.id,
          quantity: 1
        });
        
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart.`,
        });
      } else {
        // Guest user: Add to localStorage
        addOrUpdateGuestCartItem(product.id, 1);
        
        toast({
          title: "Added to cart",
          description: `${product.name} added to cart. Login at checkout to continue.`,
        });
      }
      
      onCartUpdate?.();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            src={product.image_url || '/placeholder.jpg'}
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

        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <div className="absolute left-2 top-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Only {product.stock_quantity} left
          </div>
        )}

        {product.stock_quantity === 0 && (
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
            ₹{product.price.toLocaleString('en-IN')}
          </p>
          <div className="text-right">
            <p className="text-xs text-gray-500">Stock</p>
            <p className="text-sm font-medium text-gray-700">{product.stock_quantity}</p>
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
          disabled={loading || product.stock_quantity === 0}
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {loading ? (
            <span className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Adding...
            </span>
          ) : product.stock_quantity === 0 ? (
            'Out of Stock'
          ) : (
            'Add to Cart'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
