"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const STAGES = ["APPLIED", "CV_SCREENING", "CULTURE_FIT", "TECHNICAL", "OFFER", "ONBOARDING", "HIRED"];
const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied", CV_SCREENING: "CV Screening", CULTURE_FIT: "Culture-Fit",
  TECHNICAL: "Technical", OFFER: "Offer", ONBOARDING: "Onboarding", HIRED: "Hired",
};

export default function OpeningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [opening, setOpening] = useState<any>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [jdDraft, setJdDraft] = useState("");
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [candForm, setCandForm] = useState({ fullName: "", email: "", phone: "", source: "Referral", isReferral: false });

  function load() {
    fetch(`/api/openings/${id}`).then((r) => r.json()).then((d) => {
      setOpening(d);
      setJdDraft(d.jdText || "");
    });
  }
  useEffect(load, [id]);

  async function generateJD() {
    setGenLoading(true);
    const res = await fetch("/api/jd/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingId: id }),
    });
    const data = await res.json();
    setGenLoading(false);
    if (data.jdText) setJdDraft(data.jdText);
  }

  async function saveJD() {
    await fetch(`/api/openings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jdText: jdDraft }),
    });
    load();
  }

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/candidates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...candForm, jobOpeningId: id }),
    });
    const candidate = await res.json();
    if (!candidate?.id) { alert("Failed to add applicant"); return; }
    setShowAddCandidate(false);
    setCandForm({ fullName: "", email: "", phone: "", source: "Referral", isReferral: false });
    load();
  }

  async function moveStage(applicationId: string, outcome: string) {
    let rejectionReason;
    if (outcome === "reject" || outcome === "position_filled") {
      rejectionReason = prompt("Reason for rejection (required):");
      if (!rejectionReason) return;
    }
    const res = await fetch(`/api/applications/${applicationId}/transition`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, rejectionReason }),
    });
    const data = await res.json();
    if (data.emailDrafts?.length) {
      alert(`✉️ Email drafts created: ${data.emailDrafts.map((d: any) => d.templateKey).join(", ")}\nView them on the applicant profile.`);
    }
    load();
  }

  if (!opening) return <p className="text-slate-500">Loading...</p>;

  const byStage: Record<string, any[]> = {};
  STAGES.forEach((s) => (byStage[s] = []));
  opening.applications.forEach((a: any) => {
    if (a.status === "ACTIVE") byStage[a.stage]?.push(a);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{opening.title}</h1>
        <p className="text-slate-500">{opening.team} · Headcount: {opening.openingsCount} · {opening.status}</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium">Job Description</p>
          <button className="btn-secondary" onClick={generateJD} disabled={genLoading}>
            {genLoading ? "Generating..." : "✨ Generate JD (AI)"}
          </button>
        </div>
        <textarea className="input h-40" value={jdDraft}
          onChange={(e) => setJdDraft(e.target.value)}
          placeholder="Job description will appear here..." />
        <button className="btn-primary mt-2" onClick={saveJD}>Save JD</button>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-medium">Pipeline</p>
        <button className="btn-primary" onClick={() => setShowAddCandidate(!showAddCandidate)}>
          + Add Applicant
        </button>
      </div>

      {showAddCandidate && (
        <form onSubmit={addCandidate} className="card grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" required value={candForm.fullName}
              onChange={(e) => setCandForm({ ...candForm, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" required value={candForm.email}
              onChange={(e) => setCandForm({ ...candForm, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={candForm.phone}
              onChange={(e) => setCandForm({ ...candForm, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Source</label>
            <select className="input" value={candForm.source}
              onChange={(e) => setCandForm({ ...candForm, source: e.target.value })}>
              <option>Referral</option>
              <option>LinkedIn</option>
              <option>Website</option>
              <option>Facebook</option>
              <option>Other</option>
            </select>
          </div>
          <label className="flex items-center gap-2 col-span-2 text-sm">
            <input type="checkbox" checked={candForm.isReferral}
              onChange={(e) => setCandForm({ ...candForm, isReferral: e.target.checked })} />
            Referral candidate (eligible for fast-track)
          </label>
          <div className="col-span-2 flex gap-2">
            <button className="btn-primary" type="submit">Add</button>
            <button className="btn-secondary" type="button" onClick={() => setShowAddCandidate(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage} className="min-w-[160px] flex-shrink-0 bg-slate-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {STAGE_LABELS[stage]} <span className="text-slate-400">({byStage[stage].length})</span>
            </p>
            <div className="space-y-2">
              {byStage[stage].map((a: any) => (
                <div key={a.id} className="bg-white rounded-lg border border-slate-200 p-2.5 text-sm shadow-sm">
                  <Link href={`/applicants/${a.candidate.id}`}
                    className="font-medium text-indigo-600 hover:underline block">
                    {a.candidate.fullName}
                  </Link>
                  {a.matchingScore != null && (
                    <p className="text-xs text-slate-400 mt-0.5">Score: {a.matchingScore}</p>
                  )}
                  {a.candidate.isReferral && (
                    <span className="badge bg-amber-50 text-amber-600 text-xs mt-1">Referral</span>
                  )}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {stage === "APPLIED" && (
                      <button title="Move to CV Screening" className="text-lg hover:scale-110 transition"
                        onClick={() => moveStage(a.id, "advance")}>▶️</button>
                    )}
                    {stage === "CV_SCREENING" && (<>
                      <button title="Advance" className="text-lg hover:scale-110 transition"
                        onClick={() => moveStage(a.id, "advance")}>✅</button>
                      <button title="Reject" className="text-lg hover:scale-110 transition"
                        onClick={() => moveStage(a.id, "reject")}>❌</button>
                      <button title="Position Filled" className="text-lg hover:scale-110 transition"
                        onClick={() => moveStage(a.id, "position_filled")}>🔒</button>
                    </>)}
                    {stage === "CULTURE_FIT" && (<>
                      <button title="Advance to Technical" className="text-lg hover:scale-110 transition"
                        onClick={() => moveStage(a.id, "advance")}>✅</button>
                      <button title="Reject" className="text-lg hover:scale-110 transition"
                        onClick={() => moveStage(a.id, "reject")}>❌</button>
                    </>)}
                    {stage === "TECHNICAL" && (<>
                      <button title="Send Offer" className="text-lg hover:scale-110 transition"
                        onClick={() => moveStage(a.id, "offer")}>🎉</button>
                      <button title="Reject" className="text-lg hover:scale-110 transition"
                        onClick={() => moveStage(a.id, "reject")}>❌</button>
                    </>)}
                    {stage === "OFFER" && (
                      <span className="text-xs text-slate-400">Update DocuSign on profile</span>
                    )}
                    {stage === "ONBOARDING" && (
                      <button title="Mark as Hired" className="text-lg hover:scale-110 transition"
                        onClick={() => moveStage(a.id, "onboard")}>🏆</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}