import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import { useState } from "react";

const Index = () => {
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);

  const handleCartUpdate = () => {
    setCartUpdateTrigger(prev => prev + 1);
  };    

  return (
    <div className="min-h-screen">
      <Header key={cartUpdateTrigger} />
      <Hero />
      <ProductGrid onCartUpdate={handleCartUpdate} />
      <Footer />
    </div>
  );
};

export default Index;
