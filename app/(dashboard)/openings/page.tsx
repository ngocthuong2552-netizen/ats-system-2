"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function OpeningsPage() {
  const [openings, setOpenings] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/openings").then((r) => r.json()).then(setOpenings);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Job Openings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {openings.map((o) => (
          <Link key={o.id} href={`/openings/${o.id}`} className="card hover:shadow-md transition block">
            <div className="flex items-center justify-between">
              <p className="font-medium">{o.title}</p>
              <span className="badge bg-indigo-50 text-indigo-700">{o.status}</span>
            </div>
            <p className="text-sm text-slate-500">{o.team}</p>
            <p className="text-sm mt-2">Seats: {o.filledCount}/{o.openingsCount} · Candidates: {o.applications?.length || 0}</p>
          </Link>
        ))}
        {openings.length === 0 && <p className="text-slate-500">Chưa có opening nào. Hãy approve một Hiring Request trước.</p>}
      </div>
    </div>
  );
}
