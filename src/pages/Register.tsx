
import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import RegisterForm from "../components/RegisterForm";

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 flex-1 flex items-center justify-center">
          <RegisterForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterPage;
