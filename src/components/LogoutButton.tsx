import React from "react";
import { api } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const LogoutButton: React.FC<{ onLogout: () => void; className?: string }> = ({ onLogout, className }) => {
  const handleLogout = async () => {
    try {
      await api.logout();
      localStorage.removeItem("auth_token");
      notifySuccess("Signed out", "You have been logged out.");
      onLogout();
    } catch (e) {
      localStorage.removeItem("auth_token");
      const msg = e instanceof Error ? e.message : "Logout request failed";
      notifyError("Sign out", `${msg}. Local session cleared.`);
      onLogout();
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Sign out
    </Button>
  );
};

export default LogoutButton;
