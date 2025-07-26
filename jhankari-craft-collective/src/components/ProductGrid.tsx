// src/components/ProductGrid.tsx
import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/config/api';

const ProductGrid = ({ onCartUpdate }: { onCartUpdate?: () => void }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);  

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/products');
      console.log('Products response:', response.data); // Debug log
      
      // Handle different response structures
      const productsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.products || response.data.data || [];
      
      // Transform Supabase data to frontend format
      const transformedProducts = productsData.map(product => ({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        imageUrl: product.image_url || product.imageUrl,
        category: product.category_id || product.category || 'general',
        rating: 4.5 + Math.random() * 0.5, // Mock rating
        isNew: Math.random() > 0.5,
        stockQuantity: product.stock_quantity || 0,
        description: product.description || product.short_description,
        isActive: product.is_active !== false
      }));

      setProducts(transformedProducts);
      console.log('Transformed products:', transformedProducts); // Debug log
    } catch (error) {
      console.error("❌ Error loading products:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load products. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId: string, selected: boolean) => {
    console.log('Product select called:', productId, selected); // Debug log
    const newSelected = new Set(selectedProducts);
    if (selected) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
    console.log('Updated selection:', Array.from(newSelected)); // Debug log
  };

  const handleSelectAll = () => {
    const filteredProducts = getFilteredProducts();
    if (selectedProducts.size === filteredProducts.length && filteredProducts.every(p => selectedProducts.has(p.id))) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleAddSelectedToCart = async () => {
    if (!user) {
      toast({
        title: "Please login first",
        description: "You need to be logged in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.size === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to add to cart.",
        variant: "destructive",
      });
      return;
    }

    setAddingToCart(true);
    try {
      const promises = Array.from(selectedProducts).map(productId => 
        apiClient.post('/cart', {
          userId: user.id,
          productId: productId,
          quantity: 1
        })
      );

      await Promise.all(promises);

      setSelectedProducts(new Set());
      onCartUpdate?.();
      
      toast({
        title: "Added to cart",
        description: `${selectedProducts.size} items have been added to your cart.`,
      });
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add items to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddSingleToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: "Please login first",
        description: "You need to be logged in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error("Product not found");
      }

      await apiClient.post('/cart', {
        userId: user.id,
        productId: productId,
        quantity: 1
      });

      onCartUpdate?.();
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const getFilteredProducts = () => {
    if (filterCategory === 'All') return products;
    return products.filter(product => 
      product.category.toLowerCase().includes(filterCategory.toLowerCase())
    );
  };

  const filteredProducts = getFilteredProducts();
  const categories = ['All', 'Lehenga', 'Saree', 'Anarkali', 'Sharara', 'Kurti'];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-royal-purple to-royal-crimson bg-clip-text text-transparent">
              Handcrafted Collections
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Each piece tells a story of Rajasthani heritage, crafted by skilled artisans with love and precision
          </p>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Debug: {products.length} products loaded, {selectedProducts.size} selected
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleSelectAll}
              disabled={loading || filteredProducts.length === 0}
            >
              {selectedProducts.size === filteredProducts.length && filteredProducts.every(p => selectedProducts.has(p.id)) && filteredProducts.length > 0
                ? 'Deselect All' 
                : 'Select All'
              }
            </Button>
            
            {selectedProducts.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedProducts.size} of {filteredProducts.length} selected
              </span>
            )}
          </div>

          {selectedProducts.size > 0 && (
            <Button 
              variant="royal" 
              onClick={handleAddSelectedToCart}
              disabled={addingToCart}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {addingToCart ? 'Adding...' : `Add ${selectedProducts.size} items to Cart`}
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button 
                key={category}
                variant={filterCategory === category ? "outline" : "ghost"} 
                size="sm"
                onClick={() => setFilterCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-64 rounded-lg mb-4"></div>
                <div className="bg-muted h-4 rounded mb-2"></div>
                <div className="bg-muted h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No products found in this category.</p>
            <Button 
              variant="outline" 
              onClick={loadProducts}
              className="mt-4"
            >
              Retry Loading Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={selectedProducts.has(product.id)}
                onProductSelect={handleProductSelect}
                onAddToCart={handleAddSingleToCart}
              />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length > 0 && (
          <div className="text-center">
            <Button variant="royal" size="lg">
              Load More Collections
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
