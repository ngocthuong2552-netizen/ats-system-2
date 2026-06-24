"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied", CV_SCREENING: "CV Screening", CULTURE_FIT: "Culture-Fit",
  TECHNICAL: "Technical", OFFER: "Offer", ONBOARDING: "Onboarding", HIRED: "Hired",
};
const STAGE_COLORS = ["bg-slate-400","bg-yellow-400","bg-blue-400","bg-purple-400","bg-green-400","bg-teal-400","bg-emerald-500"];
const SOURCE_PALETTE = ["#6366f1","#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [showActive, setShowActive] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard?days=${days}`).then((r) => r.json()).then(setData);
  }, [days]);

  if (!data) return <p className="text-slate-500">Loading...</p>;

  const funnelEntries = Object.entries(data.funnel) as [string, number][];
  const maxFunnel = Math.max(...funnelEntries.map(([, v]) => v), 1);
  const sourceData = data.bySource.filter((s: any) => s._count._all > 0);
  const totalSource = sourceData.reduce((sum: number, s: any) => sum + s._count._all, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Opening Positions</h1>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setShowActive(!showActive)} className="card text-left hover:shadow-md transition">
          <p className="text-sm text-slate-500">Active Candidates</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{data.activeCandidatesCount}</p>
          <p className="text-xs text-slate-400 mt-1">Passed CV Screening — in Culture-Fit or Technical</p>
        </button>
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">New Applicants</p>
            <select className="text-xs border rounded-lg px-2 py-1 bg-white"
              value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{data.newApplicantsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Applied, not yet CV-screened</p>
        </div>
      </div>

      {showActive && data.activeCandidates.length > 0 && (
        <div className="card">
          <p className="font-medium mb-3">Active Candidates ({data.activeCandidatesCount})</p>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b">
              <tr><th className="py-2">Name</th><th>Position</th><th>Stage</th></tr>
            </thead>
            <tbody>
              {data.activeCandidates.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="py-2">
                    <Link href={`/applicants/${a.candidate.id}`} className="text-indigo-600 hover:underline">
                      {a.candidate.fullName}
                    </Link>
                  </td>
                  <td className="text-slate-600">{a.jobOpening?.title}</td>
                  <td><span className="badge bg-indigo-50 text-indigo-700">{STAGE_LABELS[a.stage]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <p className="font-medium mb-4">Pipeline Funnel</p>
        <div className="space-y-2">
          {funnelEntries.map(([stage, count], i) => (
            <div key={stage} className="flex items-center gap-3">
              <div className="w-28 text-xs text-slate-500 text-right">{STAGE_LABELS[stage]}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-6 relative">
                <div className={`h-6 rounded-full ${STAGE_COLORS[i]} transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max((count / maxFunnel) * 100, count > 0 ? 8 : 0)}%` }}>
                  {count > 0 && <span className="text-white text-xs font-medium">{count}</span>}
                </div>
                {count === 0 && <span className="absolute left-2 top-1 text-xs text-slate-400">0</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="font-medium mb-4">Source Breakdown</p>
          {sourceData.length === 0 ? (
            <p className="text-slate-400 text-sm">No data available yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  {(() => {
                    let offset = 0;
                    return sourceData.map((s: any, i: number) => {
                      const pct = (s._count._all / totalSource) * 100;
                      const el = (
                        <circle key={i} cx="18" cy="18" r="15.9" fill="none"
                          stroke={SOURCE_PALETTE[i % SOURCE_PALETTE.length]}
                          strokeWidth="3.2"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={-offset} />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-700">{totalSource}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {sourceData.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: SOURCE_PALETTE[i % SOURCE_PALETTE.length] }} />
                    <span className="text-slate-600">{s.source || "Unknown"}</span>
                    <span className="text-slate-400 ml-auto">{s._count._all}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <p className="font-medium mb-4">Conversion Rate</p>
          <div className="space-y-3">
            {[
              { label: "Applied → CV Screening", value: data.funnel["CV_SCREENING"]||0, total: data.funnel["APPLIED"]||1, color: "bg-yellow-400" },
              { label: "CV Screening → Culture-Fit", value: data.funnel["CULTURE_FIT"]||0, total: data.funnel["CV_SCREENING"]||1, color: "bg-blue-400" },
              { label: "Culture-Fit → Technical", value: data.funnel["TECHNICAL"]||0, total: data.funnel["CULTURE_FIT"]||1, color: "bg-purple-400" },
              { label: "Technical → Offer", value: data.funnel["OFFER"]||0, total: data.funnel["TECHNICAL"]||1, color: "bg-green-400" },
              { label: "Offer → Hired", value: data.funnel["HIRED"]||0, total: data.funnel["OFFER"]||1, color: "bg-emerald-500" },
            ].map((item, i) => {
              const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium text-slate-700">{pct}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-3">
                    <div className={`h-3 rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Overall offer acceptance rate: <b>{data.offerAcceptanceRate}%</b>
          </p>
        </div>
      </div>

      <div className="card">
        <p className="font-medium mb-3">Open Requests / Openings</p>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              <th className="py-2 pr-4">Position</th>
              <th className="pr-4">Headcount</th>
              <th className="pr-4">Filled</th>
              <th className="pr-4">Priority</th>
              <th>Target Onboarding</th>
            </tr>
          </thead>
          <tbody>
            {data.openings.map((o: any) => (
              <tr key={o.id} className="border-t hover:bg-slate-50">
                <td className="py-2 pr-4">
                  <Link href={`/openings/${o.id}`} className="text-indigo-600 hover:underline font-medium">
                    {o.title}
                  </Link>
                </td>
                <td className="pr-4">{o.openingsCount}</td>
                <td className="pr-4">{o.filledCount}</td>
                <td className="pr-4">
                  <span className={`badge ${
                    o.request?.priority === "URGENT" ? "bg-red-50 text-red-600" :
                    o.request?.priority === "HIGH" ? "bg-amber-50 text-amber-600" :
                    "bg-slate-100 text-slate-600"
                  }`}>{o.request?.priority}</span>
                </td>
                <td className="text-slate-500">{o.request?.targetOnboardingDate?.slice(0, 10)}</td>
              </tr>
            ))}
            {data.openings.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-slate-400">No open positions</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}