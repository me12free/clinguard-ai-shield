import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const data = await api.register(name, email, password, passwordConfirmation || password);
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        setSuccess("Registration successful!");
        setName(""); setEmail(""); setPassword(""); setPasswordConfirmation("");
        navigate("/dashboard", { replace: true });
      } else {
        setSuccess("Registration successful! You can now log in.");
        setName(""); setEmail(""); setPassword(""); setPasswordConfirmation("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4 p-6 md:p-8 border rounded-lg bg-white shadow-lg w-full max-w-md">
      <h2 className="font-bold">Register</h2>
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded" />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded" />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded" />
      <input type="password" placeholder="Confirm password" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} required className="w-full p-2 border rounded" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Register</button>
      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}
    </form>
  );
};

export default RegisterForm;
