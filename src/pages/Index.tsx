import React from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ComplianceSection from "@/components/landing/ComplianceSection";
import CTASection from "@/components/landing/CTASection";

import Footer from "@/components/landing/Footer";
import BackendHello from "../components/BackendHello";
// import RegisterForm from "../components/RegisterForm";
// import LoginForm from "../components/LoginForm";
import LogoutButton from "../components/LogoutButton";

const Index = () => {
  const [token, setToken] = React.useState<string | null>(localStorage.getItem("auth_token"));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ComplianceSection />
      <CTASection />
      {/* Auth forms moved to separate views */}
      {token && <LogoutButton onLogout={() => setToken(null)} />}
      <BackendHello />
      <Footer />
    </div>
  );
};

export default Index;
