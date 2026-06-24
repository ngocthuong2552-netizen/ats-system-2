"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function OpeningsPage() {
  const [openings, setOpenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/openings")
      .then((r) => r.json())
      .then((d) => { setOpenings(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading openings...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Job Openings</h1>
        <p className="text-sm text-slate-500 mt-0.5">{openings.length} active opening{openings.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {openings.map((o) => {
          const filled = o.filledCount || 0;
          const total = o.openingsCount || 1;
          const pct = Math.round((filled / total) * 100);
          const applicants = o.applications?.length || 0;
          return (
            <Link key={o.id} href={`/openings/${o.id}`} className="block">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800">{o.title}</p>
                    <p className="text-sm text-slate-500">{o.team}</p>
                  </div>
                  <span className={`badge text-xs ${
                    o.status === "OPEN" ? "bg-green-50 text-green-700" :
                    o.status === "ON_HOLD" ? "bg-amber-50 text-amber-700" :
                    o.status === "FILLED" ? "bg-slate-100 text-slate-600" :
                    "bg-red-50 text-red-600"
                  }`}>{o.status}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                  <span>👥 {applicants} applicant{applicants !== 1 ? "s" : ""}</span>
                  <span>🎯 {filled}/{total} filled</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Fill rate</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {openings.length === 0 && (
          <div className="col-span-2 text-center py-16 text-slate-400">
            <span className="text-4xl block mb-3">📂</span>
            <p className="font-medium">No openings yet</p>
            <p className="text-sm mt-1">Approve a Hiring Request to create an opening</p>
          </div>
        )}
      </div>
    </div>
  );
}