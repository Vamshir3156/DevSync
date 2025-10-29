
import { useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data } = await api.post("/auth/register", { email, name, password });
      setAuth(data.token, data.user);
      nav("/");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-slate-400 mb-6">Join DevSync in seconds</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="text-pink-300 text-sm">{error}</div>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
        </form>
        <div className="text-sm mt-4 text-slate-400">
          Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
