import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Lock, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 mb-8">
            <Shield className="h-4 w-4 text-accent-foreground" />
            <span className="text-sm font-medium text-accent-foreground">
              HIPAA & DPA Compliant
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Protect Patient Data in
            <span className="text-primary block mt-2">AI-Powered Healthcare</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            ClinGuard automatically detects and redacts Protected Health Information (PHI) 
            before it reaches AI services, ensuring compliance without sacrificing efficiency.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="w-full sm:w-auto text-lg px-8">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Lock className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">End-to-End Encryption</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Real-Time Processing</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">SOC 2 Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
