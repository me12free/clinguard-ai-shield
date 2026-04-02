import React from "react";
import LoginForm from "@/components/LoginForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

const LoginPage: React.FC = () => {
  return (
    <AuthPageShell
      headline="Welcome back"
      subheadline="Sign in to use ClinGuard clinical AI with automatic PHI detection and redaction before anything reaches external models."
    >
      <LoginForm />
    </AuthPageShell>
  );
};

export default LoginPage;
