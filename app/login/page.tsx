"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <div className="text-2xl font-bold text-indigo-700 mb-1">AIV ATS</div>
            <h1 className="text-xl font-semibold text-slate-800">Sign in</h1>
            <p className="text-sm text-slate-500 mt-0.5">Recruitment management system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">❌ {error}</p>
            )}

            <button
              disabled={loading}
              className="btn-primary w-full py-2.5"
              type="submit"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-4 text-center">
            Don't have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Register
            </Link>
          </p>

          <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
            Demo: admin@aivietnam.org / Admin@123
          </div>
        </div>
      </div>
    </div>
  );
}