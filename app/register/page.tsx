"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "HIRING_MANAGER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.join(", ") || data.error || "Registration failed");
        setLoading(false);
        return;
      }
      router.push("/login");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1">Your account will be saved in the system</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" required placeholder="Your full name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" required placeholder="your@email.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" required minLength={6}
                placeholder="Min. 6 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="HIRING_MANAGER">Hiring Manager</option>
                <option value="INTERVIEWER">Interviewer</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">❌ {error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="text-sm text-slate-500 mt-4 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}