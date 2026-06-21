"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function RequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    jobTitle: "", team: "", headcount: 1, priority: "MEDIUM", reason: "", targetOnboardingDate: "",
  });

  function load() {
    fetch("/api/requests").then((r) => r.json()).then(setRequests);
  }
  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, headcount: Number(form.headcount) }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ jobTitle: "", team: "", headcount: 1, priority: "MEDIUM", reason: "", targetOnboardingDate: "" });
      load();
    }
  }

  async function review(id: string, status: string, createOpening = false) {
    const reviewerNotes = status !== "APPROVED" ? prompt("Ghi chú (tuỳ chọn):") || "" : "";
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewerNotes, createOpening }),
    });
    load();
  }

  const isHR = session?.user?.role === "HR" || session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hiring Requests</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Đóng" : "+ Tạo yêu cầu mới"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card grid grid-cols-2 gap-4">
          <div><label className="label">Job Title</label>
            <input className="input" required value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></div>
          <div><label className="label">Team</label>
            <input className="input" required value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} /></div>
          <div><label className="label">Headcount</label>
            <input type="number" min={1} className="input" required value={form.headcount} onChange={(e) => setForm({ ...form, headcount: Number(e.target.value) })} /></div>
          <div><label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
            </select></div>
          <div><label className="label">Target Onboarding Date</label>
            <input type="date" className="input" required value={form.targetOnboardingDate} onChange={(e) => setForm({ ...form, targetOnboardingDate: e.target.value })} /></div>
          <div className="col-span-2"><label className="label">Reason</label>
            <textarea className="input" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="col-span-2"><button className="btn-primary" type="submit">Submit Request</button></div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">Job Title</th><th>Team</th><th>Headcount</th><th>Priority</th><th>Status</th><th>Opening</th>{isHR && <th>Hành động</th>}</tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.jobTitle}</td>
                <td>{r.team}</td>
                <td>{r.headcount}</td>
                <td>{r.priority}</td>
                <td><span className="badge bg-slate-100">{r.status}</span></td>
                <td>{r.opening ? "✅ Đã tạo" : "—"}</td>
                {isHR && (
                  <td className="space-x-2">
                    {r.status === "SUBMITTED" && (
                      <>
                        <button className="btn-secondary" onClick={() => review(r.id, "APPROVED", true)}>Approve + Create Opening</button>
                        <button className="btn-danger" onClick={() => review(r.id, "REJECTED")}>Reject</button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
