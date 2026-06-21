"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TalentPoolPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);

  function search() {
    fetch(`/api/talent-pool?q=${encodeURIComponent(q)}`).then((r) => r.json()).then(setResults);
  }
  useEffect(search, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Talent Pool</h1>
      <p className="text-slate-500 text-sm">Ứng viên đã được giữ lại cho các đợt tuyển dụng tương lai (FR-10.1).</p>

      <div className="flex gap-2">
        <input className="input" placeholder="Tìm theo tên, kỹ năng, quốc gia..." value={q}
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
        <button className="btn-primary" onClick={search}>Search</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((c) => {
          const skills = c.skills ? JSON.parse(c.skills) : [];
          return (
            <Link key={c.id} href={`/candidates/${c.id}`} className="card hover:shadow-md transition block">
              <p className="font-medium">{c.fullName}</p>
              <p className="text-sm text-slate-500">{c.country || "—"} · {c.experienceYears ?? "?"} yrs</p>
              <p className="text-xs text-slate-400 mt-1">{skills.join(", ")}</p>
            </Link>
          );
        })}
        {results.length === 0 && <p className="text-slate-500">Không có ứng viên nào trong Talent Pool khớp tìm kiếm.</p>}
      </div>
    </div>
  );
}
