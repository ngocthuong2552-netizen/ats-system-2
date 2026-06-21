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
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") || data.error || "Đăng ký thất bại");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm card">
        <h1 className="text-xl font-semibold mb-1">Tạo tài khoản</h1>
        <p className="text-sm text-slate-500 mb-6">Tài khoản sẽ được lưu lại trong hệ thống</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Họ tên</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Mật khẩu</label>
            <input type="password" className="input" required minLength={6} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Vai trò</label>
            <select className="input" value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="HIRING_MANAGER">Hiring Manager</option>
              <option value="INTERVIEWER">Interviewer</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="btn-primary w-full" type="submit">
            {loading ? "Đang tạo..." : "Đăng ký"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-indigo-600 font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
