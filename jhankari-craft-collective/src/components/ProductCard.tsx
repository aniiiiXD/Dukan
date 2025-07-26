import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from '@/components/ui/checkbox';

interface Product {
  id: string;
  name: string;
  price: number; 
  imageUrl: string;
  category: string;
  rating?: number;
  isNew?: boolean;
}

interface ProductCardProps {
  product: Product;
  onProductSelect: (productId: string, selected: boolean) => void;
  isSelected: boolean;
}

export function ProductCard({ product, onProductSelect, isSelected }: ProductCardProps) {
  const handleAddToCart = () => {
    // onAddToCart?.(product.id); // This line was removed from the new_code, so it's removed here.
  };

  return (
    <div className="product-card">
      {/* Selection checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={checked => onProductSelect(product.id, !!checked)}
        className="bg-white border-2"
      />
      <Card className="group cursor-pointer overflow-hidden border-border/50 hover:border-royal-gold/30 hover:shadow-xl transition-all duration-300">
        <div className="relative overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <Badge className="bg-royal-emerald text-white">New</Badge>
            )}
            <Badge variant="secondary" className="bg-royal-cream/90 text-royal-purple">
              {product.category}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="outline" size="icon" className="bg-white/90 border-white/90 hover:bg-white">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Add Button */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              variant="royal" 
              className="w-full" 
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(product.rating!)
                          ? "fill-royal-gold text-royal-gold"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">({product.rating})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-royal-crimson">
                ₹{product.price.toLocaleString('en-IN')}
              </div>
              <Button variant="ghost" size="sm" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}