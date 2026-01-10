import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ComplianceSection from "@/components/landing/ComplianceSection";
import CTASection from "@/components/landing/CTASection";

import Footer from "@/components/landing/Footer";
import BackendHello from "../components/BackendHello";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ComplianceSection />
      <CTASection />
      <BackendHello />
      <Footer />
    </div>
  );
};

export default Index;
