import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-royal-purple/80 via-royal-crimson/70 to-royal-purple/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-royal-cream/10 backdrop-blur-sm border border-royal-cream/20 rounded-full px-6 py-2">
            <Sparkles className="h-4 w-4 text-royal-gold" />
            <span className="text-sm font-medium">Authentic Rajasthani Craftsmanship</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="block">Royal</span>
              <span className="block bg-gradient-to-r from-royal-gold via-accent to-royal-gold bg-clip-text text-transparent">
                Jhankari
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-royal-cream/90 max-w-2xl mx-auto leading-relaxed">
              Discover exquisite handcrafted Rajasthani clothing that tells stories of royal heritage and timeless elegance
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button variant="hero" size="xl" className="group">
              Explore Collections
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="hero" size="xl" className="group">
              Watch Our Story
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-royal-cream/20">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-royal-gold">500+</div>
              <div className="text-sm text-royal-cream/80">Handcrafted Pieces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-royal-gold">50+</div>
              <div className="text-sm text-royal-cream/80">Local Artisans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-royal-gold">1000+</div>
              <div className="text-sm text-royal-cream/80">Happy Customers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border border-royal-gold/30 rounded-full animate-pulse" />
      <div className="absolute bottom-10 right-10 w-16 h-16 border border-royal-cream/30 rounded-full animate-pulse" />
    </section>
  );
};

export default Hero;