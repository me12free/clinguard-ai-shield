import React from "react";
import RegisterForm from "@/components/RegisterForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

const RegisterPage: React.FC = () => {
  return (
    <AuthPageShell
      headline="Get started with ClinGuard"
      subheadline="Create your account to access PHI-safe workflows, audit trails, and organization policies aligned with how your team uses AI."
    >
      <RegisterForm />
    </AuthPageShell>
  );
};

export default RegisterPage;
