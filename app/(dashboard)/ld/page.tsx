"use client";
import { useState } from "react";

const PROGRAMS = [
  { id: 1, name: "Onboarding Orientation", type: "Onboarding", duration: "2 days", target: "New Volunteers", status: "Active" },
  { id: 2, name: "AI Fundamentals", type: "Technical", duration: "4 weeks", target: "All Members", status: "Active" },
  { id: 3, name: "Leadership Development", type: "Soft Skills", duration: "3 months", target: "Team Leads", status: "Active" },
  { id: 4, name: "Product Management Basics", type: "Technical", duration: "2 weeks", target: "PM Track", status: "Draft" },
  { id: 5, name: "Communication & Presentation", type: "Soft Skills", duration: "1 week", target: "All Members", status: "Active" },
];

const TRACKER = [
  { name: "Nguyen Van A", program: "AI Fundamentals", progress: 75 },
  { name: "Tran Thi B", program: "Onboarding Orientation", progress: 100 },
  { name: "Le Hoang C", program: "Communication & Presentation", progress: 40 },
  { name: "Pham Minh D", program: "Leadership Development", progress: 20 },
];

const TYPE_COLORS: Record<string, string> = {
  Onboarding: "bg-teal-50 text-teal-700",
  Technical: "bg-blue-50 text-blue-700",
  "Soft Skills": "bg-purple-50 text-purple-700",
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-50 text-green-700",
  Draft: "bg-slate-100 text-slate-600",
};

export default function LDPage() {
  const [tab, setTab] = useState<"programs" | "tracker">("programs");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Learning & Development</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage training programs and track individual progress</p>
      </div>

      <div className="flex gap-2 border-b">
        {(["programs", "tracker"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
              tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"
            }`}>
            {t === "programs" ? "Programs" : "Progress Tracker"}
          </button>
        ))}
      </div>

      {tab === "programs" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-indigo-600">{PROGRAMS.filter(p => p.status === "Active").length}</p>
              <p className="text-sm text-slate-500 mt-1">Active Programs</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-amber-600">{PROGRAMS.length}</p>
              <p className="text-sm text-slate-500 mt-1">Total Programs</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">3</p>
              <p className="text-sm text-slate-500 mt-1">Program Types</p>
            </div>
          </div>
          <div className="card overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">All Programs</p>
              <button className="btn-primary text-sm">+ Add Program</button>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b">
                <tr>
                  <th className="py-2 pr-4">Program Name</th>
                  <th className="pr-4">Type</th>
                  <th className="pr-4">Duration</th>
                  <th className="pr-4">Target Audience</th>
                  <th className="pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {PROGRAMS.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                    <td className="pr-4"><span className={`badge ${TYPE_COLORS[p.type] || "bg-slate-100"}`}>{p.type}</span></td>
                    <td className="pr-4 text-slate-500">{p.duration}</td>
                    <td className="pr-4 text-slate-500">{p.target}</td>
                    <td className="pr-4"><span className={`badge ${STATUS_COLORS[p.status] || "bg-slate-100"}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "tracker" && (
        <div className="card">
          <p className="font-medium mb-4">Individual Progress Tracker</p>
          <div className="space-y-4">
            {TRACKER.map((t, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-36 text-sm font-medium truncate">{t.name}</div>
                <div className="w-52 text-sm text-slate-500 truncate">{t.program}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${
                    t.progress === 100 ? "bg-emerald-500" : t.progress >= 50 ? "bg-indigo-500" : "bg-amber-400"
                  }`} style={{ width: `${t.progress}%` }} />
                </div>
                <div className="w-10 text-xs text-slate-500 text-right">{t.progress}%</div>
                <span className={`badge text-xs w-24 text-center ${
                  t.progress === 100 ? "bg-green-50 text-green-700" :
                  t.progress >= 50 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {t.progress === 100 ? "Completed" : t.progress >= 50 ? "In Progress" : "Just Started"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}