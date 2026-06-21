"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  CV_SCREENING: "CV Screening",
  CULTURE_FIT: "Culture-Fit",
  TECHNICAL: "Technical",
  OFFER: "Offer",
  ONBOARDING: "Onboarding",
  HIRED: "Hired",
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [showActive, setShowActive] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard?days=${days}`).then((r) => r.json()).then(setData);
  }, [days]);

  if (!data) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Headline KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => setShowActive(!showActive)} className="card text-left hover:shadow-md transition">
          <p className="text-sm text-slate-500">Active Candidates</p>
          <p className="text-3xl font-bold text-indigo-600">{data.activeCandidatesCount}</p>
          <p className="text-xs text-slate-400 mt-1">Đã qua CV screening, chưa offer/reject (Culture-Fit + Technical)</p>
        </button>
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">New Applicants</p>
            <select className="text-xs border rounded px-2 py-1" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={90}>90 ngày</option>
            </select>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{data.newApplicantsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Chưa CV-screened (Applied)</p>
        </div>
      </div>

      {showActive && (
        <div className="card">
          <p className="font-medium mb-2">Active candidates ({data.activeCandidatesCount})</p>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-1">Tên</th><th>Vị trí</th><th>Giai đoạn</th></tr>
            </thead>
            <tbody>
              {data.activeCandidates.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="py-1">
                    <Link href={`/candidates/${a.candidate.id}`} className="text-indigo-600">{a.candidate.fullName}</Link>
                  </td>
                  <td>{a.jobOpening?.title}</td>
                  <td><span className="badge bg-indigo-50 text-indigo-700">{STAGE_LABELS[a.stage]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Funnel */}
      <div className="card">
        <p className="font-medium mb-3">Pipeline Funnel</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.funnel).map(([stage, count]: any) => (
            <div key={stage} className="flex-1 min-w-[110px] bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500">{STAGE_LABELS[stage]}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open requests */}
      <div className="card">
        <p className="font-medium mb-3">Open Requests / Openings</p>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-1">Vị trí</th><th>Headcount</th><th>Đã tuyển</th><th>Ưu tiên</th><th>Hạn onboarding</th></tr>
          </thead>
          <tbody>
            {data.openings.map((o: any) => (
              <tr key={o.id} className="border-t">
                <td className="py-1"><Link href={`/openings/${o.id}`} className="text-indigo-600">{o.title}</Link></td>
                <td>{o.openingsCount}</td>
                <td>{o.filledCount}</td>
                <td>{o.request?.priority}</td>
                <td>{o.request?.targetOnboardingDate?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Source & conversion */}
      <div className="card">
        <p className="font-medium mb-3">Source & Conversion</p>
        <p className="text-sm text-slate-600 mb-2">Offer acceptance rate: <b>{data.offerAcceptanceRate}%</b></p>
        <div className="flex flex-wrap gap-2">
          {data.bySource.map((s: any, i: number) => (
            <span key={i} className="badge bg-slate-100 text-slate-700">{s.source || "Unknown"}: {s._count._all}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
