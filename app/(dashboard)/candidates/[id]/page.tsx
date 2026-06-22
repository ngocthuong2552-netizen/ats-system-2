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
  const [parseError, setParseError] = useState("");
  const [parseSuccess, setParseSuccess] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [schedule, setSchedule] = useState({ round: "CULTURE_FIT", scheduledAt: "", format: "Google Meet", durationMins: 45 });

  function load() {
    fetch(`/api/candidates/${id}`).then((r) => r.json()).then(setCandidate);
  }
  useEffect(load, [id]);

  async function parseCv() {
    if (!cvText.trim()) return;
    setParsing(true);
    setParseError("");
    setParseSuccess(false);
    try {
      const res = await fetch(`/api/candidates/${id}/parse-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || "Parse thất bại, thử lại.");
      } else {
        setParseSuccess(true);
        setCvText("");
        load();
      }
    } catch (e) {
      setParseError("Không kết nối được server. Kiểm tra mạng và thử lại.");
    } finally {
      setParsing(false);
    }
  }

  async function toggleTalentPool() {
    await fetch("/api/talent-pool", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: id, talentPool: !candidate.talentPool }),
    });
    load();
  }

  async function addNote() {
    if (!noteText) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: id, text: noteText }),
    });
    setNoteText("");
    load();
  }

  async function scheduleInterview(applicationId: string) {
    await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId,
        ...schedule,
        panelistUserIds: session?.user?.id ? [session.user.id] : [],
      }),
    });
    load();
  }

  async function markSent(emailId: string) {
    await fetch(`/api/emails/${emailId}/send`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    load();
  }

  async function updateDocusign(applicationId: string, status: string) {
    await fetch(`/api/applications/${applicationId}/docusign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docusignStatus: status }),
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
        <button
          className={candidate.talentPool ? "btn-primary" : "btn-secondary"}
          onClick={toggleTalentPool}
        >
          {candidate.talentPool ? "★ In Talent Pool" : "☆ Add to Talent Pool"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* CV Parsing */}
        <div className="card col-span-2 space-y-3">
          <p className="font-medium">CV Parsing (AI)</p>

          {candidate.cvFileUrl && (
            <p className="text-sm">
              CV hiện tại:{" "}
              <a className="text-indigo-600" href={candidate.cvFileUrl} target="_blank">
                {candidate.cvFileName}
              </a>
            </p>
          )}

          <p className="text-xs text-slate-500">
            Dán nội dung text từ CV vào ô bên dưới (mở PDF → Cmd+A → Cmd+C → dán vào đây):
          </p>

          <textarea
            className="input h-40"
            placeholder="Dán nội dung CV (text) vào đây để AI trích xuất kỹ năng, kinh nghiệm..."
            value={cvText}
            onChange={(e) => {
              setCvText(e.target.value);
              setParseError("");
              setParseSuccess(false);
            }}
          />

          <button
            className="btn-primary"
            onClick={parseCv}
            disabled={parsing || !cvText.trim()}
          >
            {parsing ? "⏳ Đang phân tích (15-30 giây)..." : "✨ Parse CV"}
          </button>

          {parseError && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">❌ {parseError}</p>
          )}
          {parseSuccess && (
            <p className="text-sm text-green-600 bg-green-50 rounded p-2">✅ Parse thành công! Đã cập nhật thông tin ứng viên.</p>
          )}

          <div className="border-t pt-3 text-sm space-y-1">
            <p><b>Skills:</b> {skills.length > 0 ? skills.join(", ") : "—"}</p>
            <p><b>Experience:</b> {candidate.experienceYears ?? "—"} years</p>
          </div>
        </div>

        {/* Notes */}
        <div className="card space-y-2">
          <p className="font-medium">Notes</p>
          <div className="max-h-48 overflow-y-auto space-y-2 text-sm">
            {candidate.notes?.length === 0 && (
              <p className="text-slate-400 text-xs">Chưa có note nào.</p>
            )}
            {candidate.notes?.map((n: any) => (
              <div key={n.id} className="border-b pb-1">
                <p>{n.text}</p>
                <p className="text-xs text-slate-400">
                  {n.author?.name} · {new Date(n.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
          <textarea
            className="input h-16"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Thêm note..."
          />
          <button className="btn-secondary w-full" onClick={addNote}>Add Note</button>
        </div>
      </div>

      {/* Application */}
      {application && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <p className="font-medium">Application — {application.jobOpening?.title}</p>
            <span className="badge bg-indigo-50 text-indigo-700">{application.stage}</span>
            <span className="badge bg-slate-100 text-slate-600">{application.status}</span>
          </div>

          {/* Schedule interview */}
          {(application.stage === "CULTURE_FIT" || application.stage === "TECHNICAL") && (
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">
                Schedule {application.stage === "CULTURE_FIT" ? "Culture-Fit" : "Technical"} Interview
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="datetime-local"
                  className="input w-auto"
                  value={schedule.scheduledAt}
                  onChange={(e) =>
                    setSchedule({ ...schedule, scheduledAt: e.target.value, round: application.stage })
                  }
                />
                <button
                  className="btn-secondary"
                  onClick={() => scheduleInterview(application.id)}
                >
                  Generate Invite
                </button>
              </div>
            </div>
          )}

          {/* DocuSign */}
          {application.stage === "OFFER" && (
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">
                DocuSign Status:{" "}
                <span className={application.docusignStatus === "signed" ? "text-green-600" : "text-amber-600"}>
                  {application.docusignStatus}
                </span>
              </p>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => updateDocusign(application.id, "sent")}>
                  Mark Sent
                </button>
                <button className="btn-primary" onClick={() => updateDocusign(application.id, "signed")}>
                  Mark Signed → Move to Onboarding
                </button>
              </div>
            </div>
          )}

          {/* Interviews */}
          {application.interviews?.map((iv: any) => (
            <div key={iv.id} className="border rounded-lg p-3 text-sm">
              <p className="font-medium">
                {iv.round} —{" "}
                {iv.scheduledAt
                  ? new Date(iv.scheduledAt).toLocaleString("vi-VN")
                  : "chưa xếp lịch"}
              </p>
              <pre className="text-xs bg-slate-50 p-2 rounded mt-1 whitespace-pre-wrap">
                {iv.inviteText}
              </pre>
              {iv.evaluation ? (
                <p className="mt-1 text-xs text-emerald-700">
                  ✅ Evaluation: {iv.evaluation.recommendation}
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-600">⏳ Chưa có evaluation</p>
              )}
            </div>
          ))}

          {/* Email Drafts */}
          <div>
            <p className="text-sm font-medium mb-2">Email Drafts / Log</p>
            {application.emailLogs?.length === 0 && (
              <p className="text-xs text-slate-400">Chưa có email nào.</p>
            )}
            <div className="space-y-2">
              {application.emailLogs?.map((e: any) => (
                <div key={e.id} className="border rounded-lg p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{e.templateKey}</p>
                    <span
                      className={`badge ${
                        e.status === "sent"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{e.renderedSubject}</p>
                  {e.status === "draft" && (
                    <button
                      className="btn-secondary text-xs mt-2"
                      onClick={() => markSent(e.id)}
                    >
                      ✓ Mark as Sent
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}