import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

type Step = "request" | "reset";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = otpDigits.join("");

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (step === "reset") {
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  }, [step]);

  const resetOtpInputs = () => {
    setOtpDigits(Array(6).fill(""));
  };

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      setMessage("If your account exists, OTP has been sent to your email.");
      resetOtpInputs();
      setResendSeconds(30);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length === 0) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    if (clean.length > 1) {
      const arr = clean.slice(0, 6).split("");
      setOtpDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < 6; i++) next[i] = arr[i] ?? "";
        return next;
      });
      otpRefs.current[Math.min(arr.length, 5)]?.focus();
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const arr = pasted.split("");
    setOtpDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < 6; i++) next[i] = arr[i] ?? "";
      return next;
    });
    otpRefs.current[Math.min(arr.length, 5)]?.focus();
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setMessage("Password reset successful. You can now sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-card border border-border p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Forgot password</h1>
          <p className="text-sm text-muted-foreground mt-1">Reset your backoffice password using OTP.</p>
        </div>

        {step === "request" ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2">
                {message}
              </p>
            )}
            <Button type="submit" className="w-full bg-[#832729] text-accent-foreground hover:bg-[#832729]/90" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email2">Email</Label>
              <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>OTP</Label>
              <div className="flex items-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <Input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    maxLength={1}
                    className="h-11 w-11 text-center text-base font-medium"
                    required
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Enter the 6-digit OTP sent to your email.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2">
                {message}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#832729] text-accent-foreground hover:bg-[#832729]/90"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Resetting..." : "Reset password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={requestOtp}
              disabled={loading || resendSeconds > 0}
              className="w-full"
            >
              {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : "Resend OTP"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-sm text-center text-muted-foreground">
          Remember password?{" "}
          <Link to="/login" className="text-[#832729] hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
