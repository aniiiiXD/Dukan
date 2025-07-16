import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-royal-purple text-royal-cream">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-royal-gold to-accent bg-clip-text text-transparent">
              झंकारी Jhankari
            </h3>
            <p className="text-royal-cream/80 text-sm leading-relaxed">
              Preserving the rich heritage of Rajasthani craftsmanship through exquisite handwoven clothing that celebrates tradition and elegance.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="text-royal-cream hover:text-royal-gold hover:bg-royal-cream/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-royal-cream hover:text-royal-gold hover:bg-royal-cream/10">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-royal-cream hover:text-royal-gold hover:bg-royal-cream/10">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-royal-gold">Collections</h4>
            <nav className="space-y-2">
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Lehengas</a>
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Sarees</a>
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Anarkalis</a>
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Shararas</a>
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Dupattas</a>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-royal-gold">Support</h4>
            <nav className="space-y-2">
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Size Guide</a>
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Care Instructions</a>
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Shipping Info</a>
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Returns</a>
              <a href="#" className="block text-sm text-royal-cream/80 hover:text-royal-gold transition-colors">Contact Us</a>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-royal-gold">Stay Connected</h4>
            <p className="text-sm text-royal-cream/80">
              Get updates on new collections and exclusive offers
            </p>
            <div className="space-y-3">
              <Input
                placeholder="Enter your email"
                className="bg-royal-cream/10 border-royal-cream/20 text-royal-cream placeholder:text-royal-cream/60 focus:border-royal-gold"
              />
              <Button variant="gold" className="w-full">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-royal-cream/20 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-royal-gold" />
              <span className="text-royal-cream/80">+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-royal-gold" />
              <span className="text-royal-cream/80">hello@jhankari.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-royal-gold" />
              <span className="text-royal-cream/80">Jaipur, Rajasthan, India</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-royal-cream/20 py-6 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-royal-cream/60">
            <p>&copy; 2024 Jhankari. All rights reserved. Made with ❤️ for preserving heritage.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-royal-gold transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-royal-gold transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;