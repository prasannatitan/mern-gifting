import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { LoginResponse } from "@/lib/api";
import type { User } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Invalid credentials");
      }
      const data = (await res.json()) as LoginResponse;
      login(data.token, data.user as User);
      if (data.user.role === "VENDOR") navigate(from.startsWith("/admin") ? "/" : from || "/", { replace: true });
      else if (data.user.role === "CEE" || data.user.role === "SUPER_ADMIN") {
        navigate(from.startsWith("/admin") ? from : "/admin", { replace: true });
      } else {
        navigate(from || "/", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-card border border-border p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Vendor & Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to Tanishq backoffice
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full bg-[#832729] text-accent-foreground hover:bg-[#832729]/90"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
