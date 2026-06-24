"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH: "bg-amber-50 text-amber-600",
  URGENT: "bg-red-50 text-red-600",
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-50 text-blue-600",
  UNDER_REVIEW: "bg-yellow-50 text-yellow-600",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
  NEEDS_INFO: "bg-orange-50 text-orange-600",
};

export default function RequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    jobTitle: "", team: "", headcount: 1,
    priority: "MEDIUM", reason: "", targetOnboardingDate: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/requests")
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ jobTitle: "", team: "", headcount: 1, priority: "MEDIUM", reason: "", targetOnboardingDate: "" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(r: any) {
    setForm({
      jobTitle: r.jobTitle, team: r.team, headcount: r.headcount,
      priority: r.priority, reason: r.reason,
      targetOnboardingDate: r.targetOnboardingDate?.slice(0, 10) || "",
    });
    setEditingId(r.id);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = editingId
        ? await fetch(`/api/requests/${editingId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, headcount: Number(form.headcount) }),
          })
        : await fetch("/api/requests", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, headcount: Number(form.headcount) }),
          });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.formErrors?.join(", ") || data.error || "Failed to save");
        setSubmitting(false);
        return;
      }
      resetForm();
      load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const reviewerNotes = (status === "REJECTED" || status === "NEEDS_INFO")
      ? prompt("Notes (optional):") || "" : "";
    await fetch(`/api/requests/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewerNotes, createOpening: status === "APPROVED" }),
    });
    load();
  }

  async function deleteRequest(id: string) {
    if (!confirm("Are you sure you want to delete this request?")) return;
    await fetch(`/api/requests/${id}`, { method: "DELETE" });
    load();
  }

  const isHR = session?.user?.role === "HR" || session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hiring Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">For team leads to submit headcount requests</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? "Close" : "+ New Request"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card grid grid-cols-2 gap-4">
          <div className="col-span-2 font-medium text-slate-700">
            {editingId ? "Edit Hiring Request" : "New Hiring Request"}
          </div>
          {error && (
            <div className="col-span-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">❌ {error}</div>
          )}
          <div>
            <label className="label">Job Title</label>
            <input className="input" required value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
          </div>
          <div>
            <label className="label">Team</label>
            <input className="input" required value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })} />
          </div>
          <div>
            <label className="label">Headcount</label>
            <input type="number" min={1} className="input" required value={form.headcount}
              onChange={(e) => setForm({ ...form, headcount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="label">Target Onboarding Date</label>
            <input type="date" className="input" required value={form.targetOnboardingDate}
              onChange={(e) => setForm({ ...form, targetOnboardingDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input" required value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="col-span-2 flex gap-2">
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Submit Request"}
            </button>
            <button className="btn-secondary" type="button" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b">
              <tr>
                <th className="py-3 pr-4">Job Title</th>
                <th className="pr-4">Team</th>
                <th className="pr-4">Headcount</th>
                <th className="pr-4">Priority</th>
                <th className="pr-4">Status</th>
                <th className="pr-4">Opening</th>
                <th className="pr-4">Target Date</th>
                {isHR && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="py-3 pr-4 font-medium">{r.jobTitle}</td>
                  <td className="pr-4 text-slate-600">{r.team}</td>
                  <td className="pr-4">{r.headcount}</td>
                  <td className="pr-4">
                    <span className={`badge ${PRIORITY_COLORS[r.priority] || "bg-slate-100"}`}>{r.priority}</span>
                  </td>
                  <td className="pr-4">
                    <span className={`badge ${STATUS_COLORS[r.status] || "bg-slate-100"}`}>{r.status}</span>
                  </td>
                  <td className="pr-4">{r.opening ? "✅ Created" : "—"}</td>
                  <td className="pr-4 text-slate-500">{r.targetOnboardingDate?.slice(0, 10)}</td>
                  {isHR && (
                    <td>
                      <div className="flex items-center gap-1">
                        {r.status === "SUBMITTED" && (<>
                          <button title="Approve" className="p-1.5 rounded hover:bg-green-50 text-green-600 font-bold" onClick={() => updateStatus(r.id, "APPROVED")}>✓</button>
                          <button title="Reject" className="p-1.5 rounded hover:bg-red-50 text-red-600 font-bold" onClick={() => updateStatus(r.id, "REJECTED")}>✕</button>
                          <button title="Needs Info" className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600 font-bold" onClick={() => updateStatus(r.id, "NEEDS_INFO")}>?</button>
                        </>)}
                        <button title="Edit" className="p-1.5 rounded hover:bg-slate-100" onClick={() => startEdit(r)}>✏️</button>
                        <button title="Delete" className="p-1.5 rounded hover:bg-red-50" onClick={() => deleteRequest(r.id)}>🗑️</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isHR ? 8 : 7} className="py-8 text-center text-slate-400">
                    No hiring requests yet. Click "+ New Request" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}