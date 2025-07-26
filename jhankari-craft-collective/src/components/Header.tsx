import { useState, useEffect } from "react";
import { ShoppingCart, Search, User, Menu, X, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginDialog } from './LoginDialog';
import CartDialog from "./CartDialog";
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/config/api';

const Header = () => { 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (user) {
      updateCartCount(user.id);
    } else {
      setCartCount(0);
    }
  }, [user]);

  const updateCartCount = async (userId: string) => {
    try {
      const response = await apiClient.get(`/cart/${userId}`);
      const cart = response.data;
      const count = cart?.CartItem?.length || 0;
      setCartCount(count);
    } catch (error) {
      console.error("❌ Error updating cart count:", error);
      setCartCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    setCartCount(0);
    setIsMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality here
      console.log("Searching for:", searchQuery);
    }
  };

  const handleCartUpdate = () => {
    if (user) {
      updateCartCount(user.id);
    }
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-royal-purple to-royal-crimson bg-clip-text text-transparent">
                झंकारी
              </h1>
              <span className="text-sm text-muted-foreground font-medium">Jhankari</span>
            </div>
            <div className="animate-pulse h-8 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-royal-purple to-royal-crimson bg-clip-text text-transparent">
              झंकारी
            </h1>
            <span className="text-sm text-muted-foreground font-medium">Jhankari</span>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for royal outfits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-royal-gold/20 focus:border-royal-gold"
              />
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-foreground hover:text-primary transition-colors">Collections</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">Lehengas</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">Sarees</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">About</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Hello, {user.first_name || user.email.split('@')[0]}
                </span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex" 
                onClick={() => setIsLoginOpen(true)}
              >
                <LogIn className="h-5 w-5" />
              </Button>
            )}
            
            {/* Cart Button */}
            <div className="relative">
              <CartDialog onCartUpdate={handleCartUpdate} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-royal-crimson text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pointer-events-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
            <div className="py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search for royal outfits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </form>
              
              {/* Mobile Navigation */}
              <nav className="space-y-2">
                <a 
                  href="#" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Collections
                </a>
                <a 
                  href="#" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Lehengas
                </a>
                <a 
                  href="#" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sarees
                </a>
                <a 
                  href="#" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </a>
                
                {/* Mobile Auth Button */}
                {user ? (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout ({user.first_name || user.email.split('@')[0]})
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={() => {
                      setIsLoginOpen(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Login Dialog */}
      <LoginDialog 
        open={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={() => {
          setIsLoginOpen(false);
        }}
      />
    </header>
  );
};

export default Header;
