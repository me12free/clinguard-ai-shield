import React from "react";

const API_URL = "http://127.0.0.1:8000";

const LogoutButton: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });
      localStorage.removeItem("auth_token");
      onLogout();
    } catch (err) {
      // Optionally handle error
    }
  };

  return (
    <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded mt-2">
      Logout
    </button>
  );
};

export default LogoutButton;
