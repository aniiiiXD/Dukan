// src/components/ProductCard.tsx
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from '@/components/ui/checkbox';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number; 
    imageUrl: string;
    category: string;
    rating?: number;
    isNew?: boolean;
    stockQuantity?: number;
  };
  isSelected: boolean;
  onProductSelect: (productId: string, selected: boolean) => void;
  onAddToCart?: (productId: string) => void;
} 

const ProductCard = ({ product, isSelected, onProductSelect, onAddToCart }: ProductCardProps) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAddToCart?.(product.id);
  };

  const handleCheckboxChange = (checked: boolean | string) => {
    console.log('Checkbox changed:', product.id, checked); // Debug log
    onProductSelect(product.id, checked === true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Toggle selection when clicking on card (excluding buttons)
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="checkbox"]')) {
      return;
    }
    onProductSelect(product.id, !isSelected);
  };

  return (
    <Card 
      className={`group cursor-pointer overflow-hidden border-border/50 hover:border-royal-gold/30 hover:shadow-xl transition-all duration-300 ${
        isSelected ? 'ring-2 ring-royal-purple shadow-lg' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden">
        {/* Selection Checkbox */}
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            className={`bg-white/90 border-white/90 data-[state=checked]:bg-royal-purple data-[state=checked]:border-royal-purple ${
              isSelected ? 'scale-110' : ''
            } transition-transform`}
          />
        </div>

        {/* Product Image */}
        <img
          src={product.imageUrl || "/placeholder.jpg"}
          alt={product.name}
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.jpg";
          }}
        />
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
        
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-royal-emerald text-white">New</Badge>
          )}
          <Badge variant="secondary" className="bg-royal-cream/90 text-royal-purple">
            {product.category}
          </Badge>
        </div>

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button variant="outline" size="icon" className="bg-white/90 border-white/90 hover:bg-white mb-2">
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-3 left-3 right-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
              <span className="text-xs text-muted-foreground">({product.rating.toFixed(1)})</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-royal-crimson">
              ₹{product.price.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-muted-foreground">
              Stock: {product.stockQuantity || 0}
            </div>
          </div>

          {isSelected && (
            <div className="text-xs text-royal-purple font-medium">
              ✓ Selected
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
