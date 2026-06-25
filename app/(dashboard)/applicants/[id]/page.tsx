"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ApplicantProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [candidate, setCandidate] = useState<any>(null);
  const [cvText, setCvText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parseSuccess, setParseSuccess] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<"cv" | "notes" | "emails">("cv");
  const [schedule, setSchedule] = useState({ round: "CULTURE_FIT", scheduledAt: "", format: "Google Meet", durationMins: 45 });

  function load() {
    fetch(`/api/candidates/${id}`).then((r) => r.json()).then(setCandidate);
  }
  useEffect(load, [id]);

  async function parseCv() {
    if (!cvText.trim()) return;
    setParsing(true); setParseError(""); setParseSuccess(false);
    try {
      const res = await fetch(`/api/candidates/${id}/parse-cv`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText }),
      });
      const data = await res.json();
      if (!res.ok) { setParseError(data.error || "Parse failed."); }
      else { setParseSuccess(true); setCvText(""); load(); }
    } catch { setParseError("Cannot connect to server."); }
    finally { setParsing(false); }
  }

  async function toggleTalentPool() {
    await fetch("/api/talent-pool", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: id, talentPool: !candidate.talentPool }),
    });
    load();
  }

  async function addNote() {
    if (!noteText.trim()) return;
    await fetch("/api/notes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: id, text: noteText }),
    });
    setNoteText(""); load();
  }

  async function scheduleInterview(applicationId: string) {
    await fetch("/api/interviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, ...schedule, panelistUserIds: session?.user?.id ? [session.user.id] : [] }),
    });
    load();
  }

  async function markSent(emailId: string) {
    await fetch(`/api/emails/${emailId}/send`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    load();
  }

  async function updateDocusign(applicationId: string, status: string) {
    await fetch(`/api/applications/${applicationId}/docusign`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docusignStatus: status }),
    });
    load();
  }

  if (!candidate) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const skills = candidate.skills ? JSON.parse(candidate.skills) : [];
  const application = candidate.applications[0];
  const STAGE_STEPS = ["APPLIED", "CV_SCREENING", "CULTURE_FIT", "TECHNICAL", "OFFER", "ONBOARDING", "HIRED"];
  const currentStageIdx = application ? STAGE_STEPS.indexOf(application.stage) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-3">
              {candidate.fullName[0]?.toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold">{candidate.fullName}</h1>
            <p className="text-indigo-200 mt-1">{candidate.email} · {candidate.phone || "No phone"}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {skills.slice(0, 5).map((s: string, i: number) => (
                <span key={i} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{s}</span>
              ))}
              {candidate.experienceYears != null && (
                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                  {candidate.experienceYears} yrs exp
                </span>
              )}
            </div>
          </div>
          <button
            onClick={toggleTalentPool}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              candidate.talentPool
                ? "bg-white text-indigo-600 hover:bg-indigo-50"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {candidate.talentPool ? "★ In Talent Pool" : "☆ Add to Talent Pool"}
          </button>
        </div>

        {/* Stage Progress */}
        {application && (
          <div className="mt-5 pt-5 border-t border-white/20">
            <p className="text-indigo-200 text-xs mb-2">Pipeline Stage</p>
            <div className="flex items-center gap-1">
              {STAGE_STEPS.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1">
                  <div className={`h-2 rounded-full flex-1 transition-all ${
                    i <= currentStageIdx ? "bg-white" : "bg-white/25"
                  }`} />
                  {i < STAGE_STEPS.length - 1 && <div className="w-1" />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-indigo-200">Applied</span>
              <span className="text-xs text-white font-medium">{application.stage.replace(/_/g, " ")}</span>
              <span className="text-xs text-indigo-200">Hired</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left */}
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
              {(["cv", "notes", "emails"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium transition ${
                    activeTab === tab
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                      : "text-slate-500 hover:text-slate-700"
                  }`}>
                  {tab === "cv" ? "📄 CV & Skills" : tab === "notes" ? "📝 Notes" : "✉️ Emails"}
                  {tab === "emails" && application?.emailLogs?.filter((e: any) => e.status === "draft").length > 0 && (
                    <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5">
                      {application.emailLogs.filter((e: any) => e.status === "draft").length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* CV Tab */}
            {activeTab === "cv" && (
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">AI CV Parser</p>
                  <p className="text-xs text-slate-400 mb-3">
                    Open CV PDF →{" "}
                    <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">Cmd+A</kbd> →{" "}
                    <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">Cmd+C</kbd> → paste below
                  </p>
                  <textarea
                    className="input h-36 text-sm"
                    placeholder="Paste CV text here to extract skills, experience, and education automatically..."
                    value={cvText}
                    onChange={(e) => { setCvText(e.target.value); setParseError(""); setParseSuccess(false); }}
                  />
                  <button
                    className="btn-primary mt-2 w-full"
                    onClick={parseCv}
                    disabled={parsing || !cvText.trim()}
                  >
                    {parsing ? "⏳ Analyzing CV... (15–30 sec)" : "✨ Parse CV with AI"}
                  </button>
                  {parseError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mt-2">❌ {parseError}</p>
                  )}
                  {parseSuccess && (
                    <p className="text-sm text-green-600 bg-green-50 rounded-lg p-3 mt-2">
                      ✅ CV parsed! Profile updated successfully.
                    </p>
                  )}
                </div>
                <div className="border-t pt-4 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Skills</p>
                    {skills.length > 0
                      ? <div className="flex flex-wrap gap-1">
                          {skills.map((s: string, i: number) => (
                            <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      : <p className="text-sm text-slate-400">Not parsed yet</p>}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Experience</p>
                    <p className="text-sm font-medium text-slate-700">
                      {candidate.experienceYears != null ? `${candidate.experienceYears} years` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="p-5 space-y-3">
                <div className="max-h-56 overflow-y-auto space-y-2">
                  {candidate.notes?.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-4">No notes yet.</p>
                  )}
                  {candidate.notes?.map((n: any) => (
                    <div key={n.id} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-sm text-slate-700">{n.text}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {n.author?.name} · {new Date(n.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <textarea
                    className="input flex-1 h-16 text-sm"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                  />
                  <button className="btn-primary px-4 self-end" onClick={addNote}>Add</button>
                </div>
              </div>
            )}

            {/* Emails Tab */}
            {activeTab === "emails" && (
              <div className="p-5 space-y-2">
                {application?.emailLogs?.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">No emails yet.</p>
                )}
                {application?.emailLogs?.map((e: any) => (
                  <div key={e.id} className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700">{e.templateKey.replace(/_/g, " ")}</p>
                      <span className={`badge text-xs ${
                        e.status === "sent" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>{e.status}</span>
                    </div>
                    <p className="text-xs text-slate-500">{e.renderedSubject}</p>
                    {e.status === "draft" && (
                      <button className="btn-secondary text-xs mt-2" onClick={() => markSent(e.id)}>
                        ✓ Mark as Sent
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interview Scheduling */}
          {application && (application.stage === "CULTURE_FIT" || application.stage === "TECHNICAL") && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="font-semibold text-slate-700 mb-3">
                📅 Schedule {application.stage === "CULTURE_FIT" ? "Culture-Fit" : "Technical"} Interview
              </p>
              <div className="flex gap-3 flex-wrap">
                <input type="datetime-local" className="input flex-1" value={schedule.scheduledAt}
                  onChange={(e) => setSchedule({ ...schedule, scheduledAt: e.target.value, round: application.stage })} />
                <select className="input w-40" value={schedule.format}
                  onChange={(e) => setSchedule({ ...schedule, format: e.target.value })}>
                  <option>Google Meet</option>
                  <option>Zoom</option>
                  <option>In-person</option>
                </select>
                <button className="btn-primary" onClick={() => scheduleInterview(application.id)}>
                  Generate Invite
                </button>
              </div>
              {application.interviews?.filter((iv: any) => iv.round === application.stage).map((iv: any) => (
                <div key={iv.id} className="mt-3 bg-slate-50 rounded-xl p-3 text-sm">
                  <p className="font-medium text-slate-700">
                    Scheduled: {iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString("en-GB") : "TBD"}
                  </p>
                  <pre className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{iv.inviteText}</pre>
                </div>
              ))}
            </div>
          )}

          {/* DocuSign */}
          {application?.stage === "OFFER" && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
              <p className="font-semibold text-slate-700 mb-2">🖊 DocuSign — Offer Agreement</p>
              <p className="text-sm text-slate-500 mb-3">
                Status:{" "}
                <span className={`font-medium ${
                  application.docusignStatus === "signed" ? "text-green-600" : "text-amber-600"
                }`}>
                  {application.docusignStatus}
                </span>
              </p>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => updateDocusign(application.id, "sent")}>
                  📤 Mark Sent
                </button>
                <button className="btn-primary" onClick={() => updateDocusign(application.id, "signed")}>
                  ✅ Mark Signed → Onboarding
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-4">
          {application && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="font-semibold text-slate-700 mb-3">Application</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Position</span>
                  <span className="font-medium text-slate-700">{application.jobOpening?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stage</span>
                  <span className={`badge text-xs ${
                    application.stage === "HIRED" ? "bg-emerald-50 text-emerald-700" :
                    application.stage === "OFFER" ? "bg-green-50 text-green-700" :
                    "bg-indigo-50 text-indigo-700"
                  }`}>{application.stage.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="badge bg-slate-100 text-slate-600 text-xs">{application.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Source</span>
                  <span className="text-slate-700">{application.source || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Referral</span>
                  <span>{candidate.isReferral ? "✅ Yes" : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Applied</span>
                  <span className="text-slate-500 text-xs">
                    {new Date(application.appliedAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
                {application.matchingScore != null && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Match Score</span>
                      <span className="font-bold text-indigo-600">{application.matchingScore}/100</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${application.matchingScore}%` }} />
                    </div>
                    {application.matchingRationale && (
                      <p className="text-xs text-slate-400 mt-1">{application.matchingRationale}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {application?.interviews?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="font-semibold text-slate-700 mb-3">Interviews</p>
              <div className="space-y-2">
                {application.interviews.map((iv: any) => (
                  <div key={iv.id} className="bg-slate-50 rounded-xl p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{iv.round.replace(/_/g, " ")}</span>
                      {iv.evaluation
                        ? <span className={`badge text-xs ${
                            iv.evaluation.recommendation === "ADVANCE" ? "bg-green-50 text-green-700" :
                            iv.evaluation.recommendation === "REJECT" ? "bg-red-50 text-red-600" :
                            "bg-amber-50 text-amber-700"
                          }`}>{iv.evaluation.recommendation}</span>
                        : <span className="badge bg-slate-100 text-slate-500 text-xs">Pending</span>}
                    </div>
                    {iv.scheduledAt && (
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(iv.scheduledAt).toLocaleString("en-GB")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}