import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInUser, createUser, setCurrentUser } from "@/lib/mockDatabase";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios'; 

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChange?: () => void; 
} 

const LoginDialog = ({ isOpen, onClose, onUserChange }: LoginDialogProps) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    phoneNumber: "",
    address: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  console.log("🔵 LoginDialog rendered, isOpen:", isOpen);


  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔵 Login form submitted with:", loginData);
    setIsLoading(true);

    try {
      const response = await axios.post("https://dukan-backend-preview.vercel.app/api/v1/user", {
        email: loginData.email,
        password: loginData.password
      });
      
      setCurrentUser(response.data);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      onClose();
      setLoginData({ email: "", password: "" });
      onUserChange?.();
    } catch (error) {
      console.error("❌ Login error:", error);
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove the redundant doLogin function since we're using it now

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔵 Register form submitted with:", registerData);
    setIsLoading(true);
    
    try {
      const response = await axios.post("https://dukan-backend-preview.vercel.app/api/v1/user", {
        email: registerData.email,
        password: registerData.password,
        phoneNumber: registerData.phoneNumber,
        address: registerData.address
      });
      
      setCurrentUser(response.data);
      toast({
        title: "Welcome to Jhankari!",
        description: "Your account has been created successfully.",
      });
      onClose();
      setRegisterData({ email: "", password: "", phoneNumber: "", address: "" });
      onUserChange?.();
    } catch (error) {
      console.error("❌ Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Please try again with different details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-royal-purple to-royal-crimson bg-clip-text text-transparent">
            झंकारी Jhankari
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={doLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" variant="royal" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={registerData.phoneNumber}
                  onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  placeholder="Enter your address"
                  value={registerData.address}
                  onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                />
              </div>
              <Button type="submit" variant="royal" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          <p>Demo Credentials:</p>
          <p>Email: test@jhankari.com | Password: password123</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;