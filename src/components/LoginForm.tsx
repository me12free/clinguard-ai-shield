import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "@/lib/api";

const LoginForm: React.FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        setSuccess("Login successful!");
        onLogin(data.token);
        navigate("/dashboard", { replace: true });
      } else {
        throw new Error("No token received");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 p-6 md:p-8 border rounded-lg bg-white shadow-lg w-full max-w-md">
      <h2 className="font-bold">Login</h2>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded" />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}
    </form>
  );
};

export default LoginForm;
