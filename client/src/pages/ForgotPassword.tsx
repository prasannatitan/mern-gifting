import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "@/lib/api";

type Step = "request" | "reset";

export function ForgotPassword() {
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
        for (let i = 0; i < 6; i++) {
          next[i] = arr[i] ?? "";
        }
        return next;
      });
      const focusIndex = Math.min(arr.length, 5);
      otpRefs.current[focusIndex]?.focus();
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

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Forgot password</h1>
        <p className="mt-1 text-sm text-gray-500">Reset your store account password with OTP.</p>

        {step === "request" ? (
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
            {message && <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#832729] py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email2" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                OTP
              </label>
              <div className="mt-1 flex items-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
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
                    className="h-11 w-11 rounded-lg border border-gray-300 text-center text-base font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">Enter the 6-digit OTP sent to your email.</p>
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
            {message && <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-lg bg-[#832729] py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
            <button
              type="button"
              onClick={requestOtp}
              disabled={loading || resendSeconds > 0}
              className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : "Resend OTP"}
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-gray-500">
          Remember password?{" "}
          <Link to="/login" className="font-medium text-[#832729] hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
