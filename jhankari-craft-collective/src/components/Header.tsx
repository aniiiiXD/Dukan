import { useState, useEffect } from "react";
import { ShoppingCart, Search, User, Menu, X, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser, getCartCount } from "@/lib/mockDatabase";
import { LoginDialog } from './LoginDialog';
import CartDialog from "./CartDialog";

const Header = () => { 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      updateCartCount(currentUser.id);
    }
  }, []);

  const updateCartCount = async (userId) => {
    console.log("🔵 Header updateCartCount called for userId:", userId);
    try {
      const count = await getCartCount(userId);
      setCartCount(count);
      console.log("📊 Header cart count updated to:", count);
    } catch (error) {
      console.error("❌ Error updating cart count:", error);
    }
  };

  const logout = () => {
    console.log("🔵 Header logout called");
    localStorage.removeItem('currentUser');
    setUser(null);
    setCartCount(0);
    console.log("✅ User logged out successfully");
  };

  console.log("🔵 Header rendered with user:", user, "cartCount:", cartCount);

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
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for royal outfits..."
                className="pl-10 border-royal-gold/20 focus:border-royal-gold"
              />
            </div>
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
                <span className="text-sm text-muted-foreground">Hello, {user.email.split('@')[0]}</span>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setIsLoginOpen(true)}>
                <LogIn className="h-5 w-5" />
              </Button>
            )}
            <div className="relative">
              <CartDialog onCartUpdate={() => user && updateCartCount(user.id)} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-royal-crimson text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pointer-events-none">
                  {cartCount}
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search for royal outfits..."
                  className="pl-10"
                />
              </div>
              
              {/* Mobile Navigation */}
              <nav className="space-y-2">
                <a href="#" className="block py-2 text-foreground hover:text-primary transition-colors">Collections</a>
                <a href="#" className="block py-2 text-foreground hover:text-primary transition-colors">Lehengas</a>
                <a href="#" className="block py-2 text-foreground hover:text-primary transition-colors">Sarees</a>
                <a href="#" className="block py-2 text-foreground hover:text-primary transition-colors">About</a>
                {user ? (
                  <Button variant="outline" className="w-full mt-4" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full mt-4" onClick={() => setIsLoginOpen(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>

      <LoginDialog 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onUserChange={() => {
          const currentUser = getCurrentUser();
          setUser(currentUser);
          if (currentUser) updateCartCount(currentUser.id);
        }}
      />
    </header>
  );
};

export default Header;