"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [candidate, setCandidate] = useState<any>(null);
  const [cvText, setCvText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [schedule, setSchedule] = useState({ round: "CULTURE_FIT", scheduledAt: "", format: "Google Meet", durationMins: 45 });

  function load() {
    fetch(`/api/candidates/${id}`).then((r) => r.json()).then(setCandidate);
  }
  useEffect(load, [id]);

  async function parseCv() {
    setParsing(true);
    await fetch(`/api/candidates/${id}/parse-cv`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText }),
    });
    setParsing(false);
    load();
  }

  async function uploadAndParse() {
    if (!cvFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", cvFile);
    const upRes = await fetch("/api/upload", { method: "POST", body: fd });
    const upData = await upRes.json();
    if (!upRes.ok) {
      setUploading(false);
      alert(upData.error || "Upload thất bại");
      return;
    }
    await fetch(`/api/candidates/${id}/parse-cv`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText: upData.cvText, cvFileUrl: upData.fileUrl, cvFileName: upData.fileName }),
    });
    setUploading(false);
    setCvFile(null);
    load();
  }

  async function addNote() {
    if (!noteText) return;
    await fetch("/api/notes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: id, text: noteText }),
    });
    setNoteText("");
    load();
  }

  async function scheduleInterview(applicationId: string) {
    await fetch("/api/interviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, ...schedule, panelistUserIds: session?.user?.id ? [session.user.id] : [] }),
    });
    load();
  }

  async function markSent(emailId: string) {
    await fetch(`/api/emails/${emailId}/send`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    load();
  }

  async function updateDocusign(applicationId: string, status: string) {
    await fetch(`/api/applications/${applicationId}/docusign`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docusignStatus: status }),
    });
    load();
  }

  async function toggleTalentPool() {
    await fetch("/api/talent-pool", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: id, talentPool: !candidate.talentPool }),
    });
    load();
  }

  if (!candidate) return <p className="text-slate-500">Đang tải...</p>;
  const skills = candidate.skills ? JSON.parse(candidate.skills) : [];
  const application = candidate.applications[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{candidate.fullName}</h1>
          <p className="text-slate-500">{candidate.email} · {candidate.phone || "no phone"}</p>
        </div>
        <button className={candidate.talentPool ? "btn-primary" : "btn-secondary"} onClick={toggleTalentPool}>
          {candidate.talentPool ? "★ In Talent Pool" : "☆ Add to Talent Pool"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2 space-y-3">
          <p className="font-medium">CV Parsing (AI)</p>

          {candidate.cvFileUrl && (
            <p className="text-sm">CV hiện tại: <a className="text-indigo-600" href={candidate.cvFileUrl} target="_blank">{candidate.cvFileName}</a></p>
          )}

          <div className="flex items-center gap-2">
            <input type="file" accept=".pdf,.docx" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="text-sm" />
            <button className="btn-secondary" onClick={uploadAndParse} disabled={uploading || !cvFile}>
              {uploading ? "Đang xử lý..." : "Upload & Parse"}
            </button>
          </div>

          <p className="text-xs text-slate-400">Hoặc dán text CV trực tiếp:</p>
          <textarea className="input h-28" placeholder="Dán nội dung CV (text) vào đây để AI trích xuất..." value={cvText} onChange={(e) => setCvText(e.target.value)} />
          <button className="btn-secondary" onClick={parseCv} disabled={parsing || !cvText}>
            {parsing ? "Đang phân tích..." : "✨ Parse CV"}
          </button>

          <div className="border-t pt-3 text-sm space-y-1">
            <p><b>Skills:</b> {skills.join(", ") || "—"}</p>
            <p><b>Experience:</b> {candidate.experienceYears ?? "—"} years</p>
          </div>
        </div>

        <div className="card space-y-2">
          <p className="font-medium">Notes</p>
          <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
            {candidate.notes?.map((n: any) => (
              <div key={n.id} className="border-b pb-1">
                <p>{n.text}</p>
                <p className="text-xs text-slate-400">{n.author?.name} · {new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <textarea className="input h-16" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Thêm note..." />
          <button className="btn-secondary w-full" onClick={addNote}>Add Note</button>
        </div>
      </div>

      {application && (
        <div className="card space-y-4">
          <p className="font-medium">Application — {application.jobOpening?.title} ({application.stage})</p>

          {/* Schedule interview */}
          {(application.stage === "CULTURE_FIT" || application.stage === "TECHNICAL") && (
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Schedule {application.stage === "CULTURE_FIT" ? "Culture-Fit" : "Technical"} Interview</p>
              <div className="flex gap-2 flex-wrap">
                <input type="datetime-local" className="input w-auto" value={schedule.scheduledAt}
                  onChange={(e) => setSchedule({ ...schedule, scheduledAt: e.target.value, round: application.stage })} />
                <button className="btn-secondary" onClick={() => scheduleInterview(application.id)}>Generate Invite</button>
              </div>
            </div>
          )}

          {/* DocuSign */}
          {application.stage === "OFFER" && (
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">DocuSign Status: {application.docusignStatus}</p>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => updateDocusign(application.id, "sent")}>Mark Sent</button>
                <button className="btn-primary" onClick={() => updateDocusign(application.id, "signed")}>Mark Signed</button>
              </div>
            </div>
          )}

          {/* Interviews */}
          {application.interviews?.map((iv: any) => (
            <div key={iv.id} className="border rounded-lg p-3 text-sm">
              <p className="font-medium">{iv.round} — {iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString() : "not scheduled"}</p>
              <pre className="text-xs bg-slate-50 p-2 rounded mt-1 whitespace-pre-wrap">{iv.inviteText}</pre>
              {iv.evaluation ? (
                <p className="mt-1 text-xs text-emerald-700">Evaluation: {iv.evaluation.recommendation}</p>
              ) : (
                <p className="mt-1 text-xs text-amber-600">No evaluation yet</p>
              )}
            </div>
          ))}

          {/* Email log */}
          <div>
            <p className="text-sm font-medium mb-2">Email Drafts / Log</p>
            <div className="space-y-2">
              {application.emailLogs?.map((e: any) => (
                <div key={e.id} className="border rounded-lg p-2 text-sm">
                  <p className="font-medium">{e.templateKey} — <span className={e.status === "sent" ? "text-emerald-600" : "text-amber-600"}>{e.status}</span></p>
                  <p className="text-xs text-slate-500">{e.renderedSubject}</p>
                  {e.status === "draft" && <button className="btn-secondary text-xs mt-1" onClick={() => markSent(e.id)}>Mark as Sent</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
