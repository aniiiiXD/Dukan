import { useState, useEffect } from "react";
import { ShoppingCart, Search, User, Menu, X, LogIn, LogOut, Heart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CartDialog from './CartDialog';
import OTPLoginDialog from './OTPLoginDialog';
import { useAuth } from '@/contexts/AuthContext';
import { getGuestCart } from '@/utils/cart';

const Header = () => { 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout, loading, isAuthenticated } = useAuth();

  // Update cart count when cart changes
  useEffect(() => {
    const updateCartCount = () => {
      if (isAuthenticated && user) {
        // For authenticated users, you might want to fetch from API
        // For now, we'll use localStorage as fallback
        const guestCart = getGuestCart();
        const count = guestCart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      } else {
        // For guests, use localStorage
        const guestCart = getGuestCart();
        const count = guestCart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      }
    };

    updateCartCount();
    
    // Listen for cart updates
    const handleStorageChange = () => updateCartCount();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated, user]);

  const handleLoginClick = () => {
    setIsLoginOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCartCount(0); // Reset cart count on logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCartUpdate = () => {
    // Trigger cart count update
    const guestCart = getGuestCart();
    const count = guestCart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-royal-purple to-royal-crimson rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">झ</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-royal-purple to-royal-crimson bg-clip-text text-transparent">
                    Jhankari
                  </h1>
                  <p className="text-xs text-muted-foreground -mt-1">Craft Collective</p>
                </div>
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search authentic crafts..."
                  className="pl-10 pr-4 h-11 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-royal-purple/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Wishlist */}
              <Button variant="ghost" size="icon" className="relative hover:bg-royal-purple/10 transition-colors">
                <Heart className="h-6 w-6" />
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  0
                </Badge>
              </Button>

              {/* Cart */}
              <CartDialog onCartUpdate={handleCartUpdate} />

              {/* Auth Section */}
              {loading ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              ) : isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-royal-purple/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal-purple to-royal-crimson flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium">
                        {user.first_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="royal"
                  onClick={handleLoginClick}
                  className="px-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <CartDialog onCartUpdate={handleCartUpdate} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:bg-royal-purple/10"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search crafts..."
                className="pl-10 pr-4 h-11 bg-gray-50 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-md">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {isAuthenticated && user ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-royal-purple/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-royal-purple to-royal-crimson flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.first_name || 'User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start">
                      <Package className="h-4 w-4 mr-2" />
                      Orders
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Heart className="h-4 w-4 mr-2" />
                      Wishlist
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  variant="royal"
                  onClick={handleLoginClick}
                  className="w-full justify-center shadow-lg"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login to Jhankari
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <OTPLoginDialog
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default Header;
