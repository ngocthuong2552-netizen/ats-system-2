"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const SOURCE_COLORS: Record<string, string> = {
  Referral: "bg-amber-50 text-amber-700",
  LinkedIn: "bg-blue-50 text-blue-700",
  Website: "bg-purple-50 text-purple-700",
  Facebook: "bg-indigo-50 text-indigo-700",
  Other: "bg-slate-100 text-slate-600",
};

const STAGE_COLORS: Record<string, string> = {
  APPLIED: "bg-slate-100 text-slate-600",
  CV_SCREENING: "bg-yellow-50 text-yellow-700",
  CULTURE_FIT: "bg-blue-50 text-blue-700",
  TECHNICAL: "bg-purple-50 text-purple-700",
  OFFER: "bg-green-50 text-green-700",
  ONBOARDING: "bg-teal-50 text-teal-700",
  HIRED: "bg-emerald-50 text-emerald-700",
};

export default function ApplicantsPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/candidates").then((r) => r.json()).then(setCandidates);
  }, []);

  const filtered = candidates.filter((c) => {
    const app = c.applications?.[0];
    const matchSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "ALL" || app?.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Applicants</h1>

      <div className="flex gap-3 flex-wrap">
        <input className="input w-64" placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input w-48" value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}>
          <option value="ALL">All Stages</option>
          <option value="APPLIED">Applied</option>
          <option value="CV_SCREENING">CV Screening</option>
          <option value="CULTURE_FIT">Culture-Fit</option>
          <option value="TECHNICAL">Technical</option>
          <option value="OFFER">Offer</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="HIRED">Hired</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              <th className="py-3 pr-4">Full Name</th>
              <th className="pr-4">Email</th>
              <th className="pr-4">Phone</th>
              <th className="pr-4">Source</th>
              <th className="pr-4">Position</th>
              <th className="pr-4">Stage</th>
              <th className="pr-4">Skills</th>
              <th className="pr-4">Experience</th>
              <th className="pr-4">Referral</th>
              <th className="pr-4">Applied Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const app = c.applications?.[0];
              const skills = c.skills ? JSON.parse(c.skills) : [];
              return (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="py-2.5 pr-4">
                    <Link href={`/applicants/${c.id}`}
                      className="font-medium text-indigo-600 hover:underline">
                      {c.fullName}
                    </Link>
                  </td>
                  <td className="pr-4 text-slate-600">{c.email}</td>
                  <td className="pr-4 text-slate-500">{c.phone || "—"}</td>
                  <td className="pr-4">
                    {app?.source
                      ? <span className={`badge ${SOURCE_COLORS[app.source] || "bg-slate-100"}`}>{app.source}</span>
                      : "—"}
                  </td>
                  <td className="pr-4 text-slate-600">{app?.jobOpening?.title || "—"}</td>
                  <td className="pr-4">
                    {app?.stage
                      ? <span className={`badge ${STAGE_COLORS[app.stage] || "bg-slate-100"}`}>
                          {app.stage.replace("_", " ")}
                        </span>
                      : "—"}
                  </td>
                  <td className="pr-4 text-slate-500 max-w-[150px] truncate">
                    {skills.length > 0 ? skills.slice(0, 3).join(", ") : "—"}
                  </td>
                  <td className="pr-4 text-slate-500">
                    {c.experienceYears != null ? `${c.experienceYears} yrs` : "—"}
                  </td>
                  <td className="pr-4">{c.isReferral ? "✅" : "—"}</td>
                  <td className="pr-4 text-slate-400 text-xs">
                    {app?.appliedAt ? new Date(app.appliedAt).toLocaleDateString("en-GB") : "—"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="py-8 text-center text-slate-400">No applicants found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}