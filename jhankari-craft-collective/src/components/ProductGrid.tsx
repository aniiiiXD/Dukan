import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal } from "lucide-react";
import { getAllProducts, getCurrentUser } from "@/lib/mockDatabase";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

const ProductGrid = ({ onCartUpdate }: { onCartUpdate?: () => void }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  // useEffect(() => {
  //   const currentUser = getCurrentUser();
  //   if (currentUser) {
  //     setUser(currentUser);
  //   } else {
  //     // Try to get user from localStorage if not in memory
  //     const storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  //     if (storedUser) {
  //       setUser(storedUser);
  //     }
  //   }
  // }, []);
  
  console.log("🔵 ProductGrid rendered");

  useEffect(() => {
    loadProducts();
  }, []);  

  const loadProducts = async () => {
    console.log("🔵 loadProducts called");
    setLoading(true);
    try {
      const response = await axios.get("https://dukan-backend-preview.vercel.app/api/v1/products");
      const products = response.data;
      setProducts(products);
      console.log("✅ Products loaded successfully:", products.length);
    } catch (error) {
      console.error("❌ Error loading products:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load products. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    console.log("🔵 handleAddToCart called with productId:", productId);
    
    const user = getCurrentUser(); 
    console.log(user); 
    if (!user) {
      console.log("❌ No user logged in for add to cart");
      toast({
        title: "Please login first",
        description: "You need to be logged in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the product details
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Add to cart using API endpoint
      const response = await axios.post("https://dukan-backend-preview.vercel.app/api/v1/cart", {
        userId: user.id,
        productId: productId,
        quantity: 1
      });
      console.log(response)
      // Update the cart count in the UI
      onCartUpdate?.();
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
      console.log("✅ Item added to cart successfully");
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="ghost" size="sm">Lehengas</Button>
            <Button variant="ghost" size="sm">Sarees</Button>
            <Button variant="ghost" size="sm">Anarkalis</Button>
            <Button variant="ghost" size="sm">Shararas</Button>
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

        {/* Product Grid */}
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  rating: 4.5 + Math.random() * 0.5, // Random rating for demo
                  isNew: Math.random() > 0.5 // Random new status for demo
                }}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        <div className="text-center">
          <Button variant="royal" size="lg">
            Load More Collections
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;