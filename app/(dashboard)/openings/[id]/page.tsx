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
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
    let cvFileUrl, cvFileName, cvText;

    if (cvFile) {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", cvFile);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await upRes.json();
      setUploading(false);
      if (!upRes.ok) {
        alert(upData.error || "Upload thất bại");
        return;
      }
      cvFileUrl = upData.fileUrl;
      cvFileName = upData.fileName;
      cvText = upData.cvText;
    }

    const res = await fetch("/api/candidates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...candForm, jobOpeningId: id, cvFileUrl, cvFileName }),
    });
    const candidate = await res.json();

    if (cvText && candidate?.id) {
      await fetch(`/api/candidates/${candidate.id}/parse-cv`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText }),
      });
    }

    setShowAddCandidate(false);
    setCandForm({ fullName: "", email: "", phone: "", source: "Referral", isReferral: false });
    setCvFile(null);
    load();
  }

  async function moveStage(applicationId: string, outcome: string) {
    let rejectionReason;
    if (outcome === "reject" || outcome === "position_filled") {
      rejectionReason = prompt("Lý do từ chối (bắt buộc):");
      if (!rejectionReason) return;
    }
    const res = await fetch(`/api/applications/${applicationId}/transition`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, rejectionReason }),
    });
    const data = await res.json();
    if (data.emailDrafts?.length) {
      alert(`Email draft đã tạo: ${data.emailDrafts.map((d: any) => d.templateKey).join(", ")}\nVào trang ứng viên để xem & gửi.`);
    }
    load();
  }

  if (!opening) return <p className="text-slate-500">Đang tải...</p>;

  const byStage: Record<string, any[]> = {};
  STAGES.forEach((s) => (byStage[s] = []));
  opening.applications.forEach((a: any) => {
    if (a.status === "ACTIVE") byStage[a.stage]?.push(a);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{opening.title}</h1>
        <p className="text-slate-500">{opening.team} · Seats {opening.filledCount}/{opening.openingsCount} · {opening.status}</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium">Job Description</p>
          <button className="btn-secondary" onClick={generateJD} disabled={genLoading}>
            {genLoading ? "Đang tạo..." : "✨ Generate JD (AI)"}
          </button>
        </div>
        <textarea className="input h-40" value={jdDraft} onChange={(e) => setJdDraft(e.target.value)} placeholder="JD sẽ hiện ở đây..." />
        <button className="btn-primary mt-2" onClick={saveJD}>Save JD</button>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-medium">Pipeline</p>
        <button className="btn-primary" onClick={() => setShowAddCandidate(!showAddCandidate)}>+ Add Candidate</button>
      </div>

      {showAddCandidate && (
        <form onSubmit={addCandidate} className="card grid grid-cols-2 gap-4">
          <div><label className="label">Full name</label>
            <input className="input" required value={candForm.fullName} onChange={(e) => setCandForm({ ...candForm, fullName: e.target.value })} /></div>
          <div><label className="label">Email</label>
            <input type="email" className="input" required value={candForm.email} onChange={(e) => setCandForm({ ...candForm, email: e.target.value })} /></div>
          <div><label className="label">Phone</label>
            <input className="input" value={candForm.phone} onChange={(e) => setCandForm({ ...candForm, phone: e.target.value })} /></div>
          <div><label className="label">Source</label>
            <input className="input" value={candForm.source} onChange={(e) => setCandForm({ ...candForm, source: e.target.value })} /></div>
          <label className="flex items-center gap-2 col-span-2 text-sm">
            <input type="checkbox" checked={candForm.isReferral} onChange={(e) => setCandForm({ ...candForm, isReferral: e.target.checked })} />
            Referral candidate (fast-track eligible)
          </label>
          <div className="col-span-2">
            <label className="label">CV file (PDF/DOCX) — sẽ tự AI-parse</label>
            <input type="file" accept=".pdf,.docx" className="input"
              onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
          </div>
          <div className="col-span-2 text-xs text-slate-400">
            Có thể bỏ trống CV và nhập tay; có thể parse lại sau ở trang Candidate Profile.
          </div>
          <div className="col-span-2">
            <button className="btn-primary" type="submit" disabled={uploading}>
              {uploading ? "Đang upload & trích xuất..." : "Add"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-7 gap-3 overflow-x-auto">
        {STAGES.map((stage) => (
          <div key={stage} className="min-w-[180px] bg-slate-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">
              {STAGE_LABELS[stage]} <span className="text-slate-400">({byStage[stage].length})</span>
            </p>
            <div className="space-y-2">
              {byStage[stage].map((a: any) => (
                <div key={a.id} className="bg-white rounded-lg border p-2 text-sm">
                  <Link href={`/candidates/${a.candidate.id}`} className="font-medium text-indigo-600">
                    {a.candidate.fullName}
                  </Link>
                  {a.matchingScore != null && (
                    <p className="text-xs text-slate-500">Score: {a.matchingScore}</p>
                  )}
                  {a.isReferral && (
                    <span className="badge bg-amber-50 text-amber-700">Referral</span>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stage === "APPLIED" && (
                      <button className="text-xs btn-secondary" onClick={() => moveStage(a.id, "advance")}>
                        Move to CV Screening
                      </button>
                    )}
                    {stage === "CV_SCREENING" && (
                      <>
                        <button className="text-xs btn-secondary" onClick={() => moveStage(a.id, "advance")}>Advance</button>
                        <button className="text-xs btn-danger" onClick={() => moveStage(a.id, "reject")}>Reject</button>
                        <button className="text-xs btn-secondary" onClick={() => moveStage(a.id, "position_filled")}>Filled</button>
                      </>
                    )}
                    {stage === "CULTURE_FIT" && (
                      <>
                        <button className="text-xs btn-secondary" onClick={() => moveStage(a.id, "advance")}>Advance</button>
                        <button className="text-xs btn-danger" onClick={() => moveStage(a.id, "reject")}>Reject</button>
                      </>
                    )}
                    {stage === "TECHNICAL" && (
                      <>
                        <button className="text-xs btn-secondary" onClick={() => moveStage(a.id, "offer")}>Offer</button>
                        <button className="text-xs btn-danger" onClick={() => moveStage(a.id, "reject")}>Reject</button>
                      </>
                    )}
                    {stage === "OFFER" && (
                      <span className="text-xs text-slate-400">Xem chi tiết để cập nhật DocuSign</span>
                    )}
                    {stage === "ONBOARDING" && (
                      <button className="text-xs btn-primary" onClick={() => moveStage(a.id, "onboard")}>
                        ✓ Advance to Hired
                      </button>
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