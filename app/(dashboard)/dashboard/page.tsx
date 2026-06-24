"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied", CV_SCREENING: "CV Screening", CULTURE_FIT: "Culture-Fit",
  TECHNICAL: "Technical", OFFER: "Offer", ONBOARDING: "Onboarding", HIRED: "Hired",
};

const STAGE_GRADIENTS = [
  "from-slate-400 to-slate-500",
  "from-yellow-400 to-amber-500",
  "from-blue-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-green-400 to-emerald-500",
  "from-teal-400 to-teal-500",
  "from-emerald-500 to-green-600",
];

const CONVERSION_COLORS = [
  { bar: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
  { bar: "bg-blue-400", bg: "bg-blue-50", text: "text-blue-700" },
  { bar: "bg-violet-400", bg: "bg-violet-50", text: "text-violet-700" },
  { bar: "bg-green-400", bg: "bg-green-50", text: "text-green-700" },
  { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
];

const SOURCE_PALETTE = ["#6366f1","#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6","#ec4899"];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH: "bg-amber-50 text-amber-600",
  URGENT: "bg-red-50 text-red-600",
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [showActive, setShowActive] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard?days=${days}`).then((r) => r.json()).then(setData);
  }, [days]);

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  const funnelEntries = Object.entries(data.funnel) as [string, number][];
  const maxFunnel = Math.max(...funnelEntries.map(([, v]) => v), 1);
  const sourceData = data.bySource.filter((s: any) => s._count._all > 0);
  const totalSource = sourceData.reduce((sum: number, s: any) => sum + s._count._all, 0);

  const conversionSteps = [
    { label: "Applied → CV Screening", value: data.funnel["CV_SCREENING"] || 0, total: data.funnel["APPLIED"] || 1 },
    { label: "CV Screening → Culture-Fit", value: data.funnel["CULTURE_FIT"] || 0, total: data.funnel["CV_SCREENING"] || 1 },
    { label: "Culture-Fit → Technical", value: data.funnel["TECHNICAL"] || 0, total: data.funnel["CULTURE_FIT"] || 1 },
    { label: "Technical → Offer", value: data.funnel["OFFER"] || 0, total: data.funnel["TECHNICAL"] || 1 },
    { label: "Offer → Hired", value: data.funnel["HIRED"] || 0, total: data.funnel["OFFER"] || 1 },
  ].map((s, i) => ({
    ...s,
    pct: Math.min(100, s.total > 0 ? Math.round((s.value / s.total) * 100) : 0),
    ...CONVERSION_COLORS[i],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Opening Positions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Recruitment overview & pipeline metrics</p>
        </div>
        <select
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowActive(!showActive)}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-left shadow-lg shadow-indigo-100 hover:shadow-xl hover:shadow-indigo-200 transition-all"
        >
          <p className="text-indigo-100 text-sm font-medium">Active Candidates</p>
          <p className="text-5xl font-bold text-white mt-2">{data.activeCandidatesCount}</p>
          <p className="text-indigo-200 text-xs mt-2">
            {showActive ? "▲ Hide details" : "▼ Show details"} · Culture-Fit + Technical
          </p>
        </button>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-lg shadow-emerald-100">
          <p className="text-emerald-100 text-sm font-medium">New Applicants</p>
          <p className="text-5xl font-bold text-white mt-2">{data.newApplicantsCount}</p>
          <p className="text-emerald-200 text-xs mt-2">Applied, not yet CV-screened</p>
        </div>
      </div>

      {/* Active Candidates Expand */}
      {showActive && data.activeCandidates.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="font-semibold text-slate-700">Active Candidates</p>
            <span className="badge bg-indigo-50 text-indigo-700">{data.activeCandidatesCount} total</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-5 text-slate-500 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Position</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Stage</th>
              </tr>
            </thead>
            <tbody>
              {data.activeCandidates.map((a: any) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-5">
                    <Link href={`/applicants/${a.candidate.id}`} className="text-indigo-600 hover:underline font-medium">
                      {a.candidate.fullName}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{a.jobOpening?.title}</td>
                  <td className="py-3 px-4">
                    <span className="badge bg-indigo-50 text-indigo-700">{STAGE_LABELS[a.stage]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pipeline Funnel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="font-semibold text-slate-700 mb-4">Pipeline Funnel</p>
        <div className="space-y-3">
          {funnelEntries.map(([stage, count], i) => (
            <div key={stage} className="flex items-center gap-3">
              <div className="w-32 text-xs text-slate-500 text-right font-medium">{STAGE_LABELS[stage]}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-7 relative overflow-hidden">
                <div
                  className={`h-7 rounded-full bg-gradient-to-r ${STAGE_GRADIENTS[i]} transition-all duration-700 flex items-center justify-end pr-3`}
                  style={{ width: `${Math.max((count / maxFunnel) * 100, count > 0 ? 6 : 0)}%` }}
                >
                  {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                </div>
                {count === 0 && (
                  <span className="absolute left-3 top-1.5 text-xs text-slate-400">0</span>
                )}
              </div>
              <div className="w-8 text-xs text-slate-500 text-right">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2 Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Source Pie */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="font-semibold text-slate-700 mb-4">Source Breakdown</p>
          {sourceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm">No applicants yet</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative w-36 h-36 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90 drop-shadow-sm">
                  {(() => {
                    let offset = 0;
                    return sourceData.map((s: any, i: number) => {
                      const pct = (s._count._all / totalSource) * 100;
                      const circumference = 87.96;
                      const el = (
                        <circle key={i} cx="18" cy="18" r="14"
                          fill="none"
                          stroke={SOURCE_PALETTE[i % SOURCE_PALETTE.length]}
                          strokeWidth="4"
                          strokeDasharray={`${(pct / 100) * circumference} ${circumference - (pct / 100) * circumference}`}
                          strokeDashoffset={-offset * circumference / 100}
                          strokeLinecap="round"
                        />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-700">{totalSource}</span>
                  <span className="text-xs text-slate-400">total</span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {sourceData.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: SOURCE_PALETTE[i % SOURCE_PALETTE.length] }} />
                    <span className="text-sm text-slate-600 flex-1">{s.source || "Unknown"}</span>
                    <span className="text-sm font-semibold text-slate-700">{s._count._all}</span>
                    <span className="text-xs text-slate-400 w-8 text-right">
                      {Math.round((s._count._all / totalSource) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="font-semibold text-slate-700 mb-4">Conversion Rate</p>
          <div className="space-y-3">
            {conversionSteps.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.bg} ${item.text}`}>
                    {item.pct}%
                  </span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${item.bar} transition-all duration-700`}
                    style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Overall offer acceptance rate</span>
            <span className="text-sm font-bold text-slate-700">{Math.min(100, data.offerAcceptanceRate)}%</span>
          </div>
        </div>
      </div>

      {/* Open Positions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="font-semibold text-slate-700">Open Requests & Openings</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-5 text-slate-500 font-medium">Position</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">Headcount</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">Filled</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">Priority</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">Target Onboarding</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">Progress</th>
            </tr>
          </thead>
          <tbody>
            {data.openings.map((o: any) => {
              const fillPct = o.openingsCount > 0
                ? Math.round((o.filledCount / o.openingsCount) * 100) : 0;
              return (
                <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-5">
                    <Link href={`/openings/${o.id}`} className="text-indigo-600 hover:underline font-semibold">
                      {o.title}
                    </Link>
                    <p className="text-xs text-slate-400">{o.request?.team || "—"}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{o.openingsCount}</td>
                  <td className="py-3 px-4 text-slate-600">{o.filledCount}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${PRIORITY_COLORS[o.request?.priority] || "bg-slate-100 text-slate-600"}`}>
                      {o.request?.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{o.request?.targetOnboardingDate?.slice(0, 10)}</td>
                  <td className="py-3 px-4 w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${fillPct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8">{fillPct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data.openings.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <span className="text-2xl block mb-1">📋</span>
                  No open positions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}