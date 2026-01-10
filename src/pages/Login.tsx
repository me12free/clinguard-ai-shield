
import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import LoginForm from "../components/LoginForm";

const LoginPage: React.FC = () => {
  const [token, setToken] = React.useState<string | null>(localStorage.getItem("auth_token"));
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 flex-1 flex items-center justify-center">
          <LoginForm onLogin={setToken} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
