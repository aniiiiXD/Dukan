import { useState, useEffect } from "react";
import { ShoppingCart, Search, User, Menu, X, LogIn, LogOut, Heart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CartDialog from './CartDialog';
import { useAuth } from '@/contexts/AuthContext';
import { getGuestCart } from '@/utils/cart';

const Header = () => { 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout, loading, isAuthenticated, signInWithGoogle } = useAuth();

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

  const handleGoogleLogin = async () => {
    try {
      const success = await signInWithGoogle();
      if (!success) {
        console.error('Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
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
                onClick={handleGoogleLogin}
                className="px-6 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
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
                onClick={handleGoogleLogin}
                className="w-full justify-center shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
