"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Activity, Lock, User, Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Welcome back, ${json.data.name}!`);
      // Small delay so the button success state is visible
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 400);
    } catch (e: any) {
      setError(true);
      setLoading(false);
      toast.error(e.message || "Login failed");
      // remove shake class after animation
      setTimeout(() => setError(false), 500);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 bg-[length:200%_200%] p-4 animate-gradient-pan">
      {/* Floating decorative blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-float" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-indigo-300/20 blur-2xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="pointer-events-none absolute right-1/4 top-10 h-24 w-24 rounded-full bg-white/10 blur-xl animate-float"
        style={{ animationDelay: "0.8s" }}
      />

      {/* Login card */}
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg animate-pop-in">
              <Activity size={30} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">MediCare ERP</h1>
            <p className="text-sm text-slate-500">Admin Panel — Sign in to continue</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className={error ? "animate-shake" : ""}
          >
            {/* Username */}
            <div
              className="mb-4 animate-fade-in-up"
              style={{ animationDelay: "0.15s" }}
            >
              <label className="label">Username</label>
              <div className="relative">
                <User
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="input pl-10"
                  placeholder="admin"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div
              className="mb-6 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-brand-700 hover:shadow-brand-500/40 active:scale-[0.97] disabled:opacity-80 animate-fade-in-up"
              style={{ animationDelay: "0.45s" }}
            >
              {/* Shine sweep on hover */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-white/70">
          © 2026 MediCare Hospital ERP
        </p>
      </div>
    </div>
  );
}
