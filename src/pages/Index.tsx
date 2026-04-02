import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ComplianceSection from "@/components/landing/ComplianceSection";
import CTASection from "@/components/landing/CTASection";

import Footer from "@/components/landing/Footer";
import BackendHello from "../components/BackendHello";
import LogoutButton from "../components/LogoutButton";

const Index = () => {
  const navigate = useNavigate();
  const [token, setToken] = React.useState<string | null>(localStorage.getItem("auth_token"));

  useEffect(() => {
    if (token) navigate("/dashboard", { replace: true });
  }, [token, navigate]);

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
