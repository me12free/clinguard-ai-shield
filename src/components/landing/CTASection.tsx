import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const CTASection = () => {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 mb-8 hover:opacity-90 transition-opacity"
          >
            <BrandLogo className="h-4 w-4 rounded-sm ring-1 ring-primary-foreground/30" />
            <span className="text-sm font-medium text-primary-foreground">
              Start protecting patient data today
            </span>
          </Link>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Secure Your Healthcare AI Workflow?
          </h2>
          
          <p className="text-lg text-primary-foreground/80 mb-10">
            Join leading healthcare organizations using ClinGuard to leverage AI safely. 
            Get started with a free trial – no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="w-full sm:w-auto text-lg px-8"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
