import React from "react";
import { api } from "@/lib/api";

const LogoutButton: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem("auth_token");
    onLogout();
  };

  return (
    <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded mt-2">
      Logout
    </button>
  );
};

export default LogoutButton;
