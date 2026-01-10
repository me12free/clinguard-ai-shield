import React, { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const RegisterForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Registration failed");
      setSuccess("Registration successful! You can now log in.");
      setName(""); setEmail(""); setPassword("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4 p-6 md:p-8 border rounded-lg bg-white shadow-lg w-full max-w-md">
      <h2 className="font-bold">Register</h2>
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded" />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded" />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Register</button>
      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}
    </form>
  );
};

export default RegisterForm;
