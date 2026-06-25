"use client";
import { useState } from "react";

const INITIAL_PROGRAMS = [
  { id: 1, name: "Onboarding Orientation", type: "Onboarding", duration: "2 days", target: "New Volunteers", status: "Active", description: "Introduction to AIV culture, tools, and processes." },
  { id: 2, name: "AI Fundamentals", type: "Technical", duration: "4 weeks", target: "All Members", status: "Active", description: "Core concepts of AI/ML for non-technical members." },
  { id: 3, name: "Leadership Development", type: "Soft Skills", duration: "3 months", target: "Team Leads", status: "Active", description: "Leadership, decision-making, and team management skills." },
  { id: 4, name: "Product Management Basics", type: "Technical", duration: "2 weeks", target: "PM Track", status: "Draft", description: "Introduction to product thinking and roadmap planning." },
  { id: 5, name: "Communication & Presentation", type: "Soft Skills", duration: "1 week", target: "All Members", status: "Active", description: "Effective communication and public speaking skills." },
];

const INITIAL_TRACKER = [
  { id: 1, name: "Nguyen Van A", program: "AI Fundamentals", progress: 75, startDate: "2026-05-01" },
  { id: 2, name: "Tran Thi B", program: "Onboarding Orientation", progress: 100, startDate: "2026-06-01" },
  { id: 3, name: "Le Hoang C", program: "Communication & Presentation", progress: 40, startDate: "2026-06-10" },
  { id: 4, name: "Pham Minh D", program: "Leadership Development", progress: 20, startDate: "2026-06-15" },
];

const TYPE_COLORS: Record<string, string> = {
  Onboarding: "bg-teal-50 text-teal-700 border-teal-200",
  Technical: "bg-blue-50 text-blue-700 border-blue-200",
  "Soft Skills": "bg-purple-50 text-purple-700 border-purple-200",
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-50 text-green-700",
  Draft: "bg-slate-100 text-slate-600",
  Archived: "bg-red-50 text-red-600",
};

export default function LDPage() {
  const [tab, setTab] = useState<"programs" | "tracker">("programs");
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS);
  const [tracker, setTracker] = useState(INITIAL_TRACKER);
  const [showForm, setShowForm] = useState(false);
  const [showTrackerForm, setShowTrackerForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", type: "Technical", duration: "", target: "", status: "Draft", description: "" });
  const [trackerForm, setTrackerForm] = useState({ name: "", program: "", progress: 0, startDate: "" });

  function submitProgram(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      setPrograms(programs.map(p => p.id === editingId ? { ...p, ...form } : p));
      setEditingId(null);
    } else {
      setPrograms([...programs, { ...form, id: Date.now() }]);
    }
    setForm({ name: "", type: "Technical", duration: "", target: "", status: "Draft", description: "" });
    setShowForm(false);
  }

  function startEdit(p: any) {
    setForm({ name: p.name, type: p.type, duration: p.duration, target: p.target, status: p.status, description: p.description });
    setEditingId(p.id);
    setShowForm(true);
  }

  function deleteProgram(id: number) {
    if (!confirm("Delete this program?")) return;
    setPrograms(programs.filter(p => p.id !== id));
  }

  function submitTracker(e: React.FormEvent) {
    e.preventDefault();
    setTracker([...tracker, { ...trackerForm, id: Date.now() }]);
    setTrackerForm({ name: "", program: "", progress: 0, startDate: "" });
    setShowTrackerForm(false);
  }

  const activeCount = programs.filter(p => p.status === "Active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Learning & Development</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage training programs and track individual progress</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-100">
          <p className="text-indigo-200 text-sm">Active Programs</p>
          <p className="text-4xl font-bold mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-slate-500 text-sm">Total Programs</p>
          <p className="text-4xl font-bold text-slate-800 mt-1">{programs.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-slate-500 text-sm">Members Enrolled</p>
          <p className="text-4xl font-bold text-slate-800 mt-1">{tracker.length}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["programs", "tracker"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === t ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
            }`}>
            {t === "programs" ? "📚 Programs" : "📊 Progress Tracker"}
          </button>
        ))}
      </div>

      {tab === "programs" && (
        <div className="space-y-4">
          {showForm && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="font-semibold text-slate-700 mb-4">{editingId ? "Edit Program" : "New Program"}</p>
              <form onSubmit={submitProgram} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Program Name</label>
                  <input className="input" required value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Data Analytics Bootcamp" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option>Technical</option>
                    <option>Soft Skills</option>
                    <option>Onboarding</option>
                  </select>
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input className="input" required value={form.duration}
                    onChange={e => setForm({...form, duration: e.target.value})}
                    placeholder="e.g. 2 weeks" />
                </div>
                <div>
                  <label className="label">Target Audience</label>
                  <input className="input" required value={form.target}
                    onChange={e => setForm({...form, target: e.target.value})}
                    placeholder="e.g. All Members" />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option>Draft</option>
                    <option>Active</option>
                    <option>Archived</option>
                  </select>
                </div>
                <div>
                  <label className="label">Description</label>
                  <input className="input" value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Brief description..." />
                </div>
                <div className="col-span-2 flex gap-2">
                  <button className="btn-primary" type="submit">
                    {editingId ? "Save Changes" : "Create Program"}
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => {
                    setShowForm(false); setEditingId(null);
                    setForm({ name: "", type: "Technical", duration: "", target: "", status: "Draft", description: "" });
                  }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-700">All Programs</p>
              <button className="btn-primary text-sm"
                onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
                {showForm ? "Close" : "+ Add Program"}
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-5 text-slate-500 font-medium">Program Name</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Duration</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Target</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium">Status</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-5">
                      <p className="font-medium text-slate-800">{p.name}</p>
                      {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge border text-xs ${TYPE_COLORS[p.type] || "bg-slate-100 text-slate-600"}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.duration}</td>
                    <td className="py-3 px-4 text-slate-500">{p.target}</td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${STATUS_COLORS[p.status] || "bg-slate-100"}`}>{p.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded hover:bg-slate-100" onClick={() => startEdit(p)}>✏️</button>
                        <button className="p-1.5 rounded hover:bg-red-50" onClick={() => deleteProgram(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "tracker" && (
        <div className="space-y-4">
          {showTrackerForm && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="font-semibold text-slate-700 mb-4">Add Member Progress</p>
              <form onSubmit={submitTracker} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Member Name</label>
                  <input className="input" required value={trackerForm.name}
                    onChange={e => setTrackerForm({...trackerForm, name: e.target.value})}
                    placeholder="Full name" />
                </div>
                <div>
                  <label className="label">Program</label>
                  <select className="input" value={trackerForm.program}
                    onChange={e => setTrackerForm({...trackerForm, program: e.target.value})}>
                    <option value="">Select program...</option>
                    {programs.filter(p => p.status === "Active").map(p => (
                      <option key={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Progress (%)</label>
                  <input type="number" min={0} max={100} className="input" value={trackerForm.progress}
                    onChange={e => setTrackerForm({...trackerForm, progress: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={trackerForm.startDate}
                    onChange={e => setTrackerForm({...trackerForm, startDate: e.target.value})} />
                </div>
                <div className="col-span-2 flex gap-2">
                  <button className="btn-primary" type="submit">Add</button>
                  <button className="btn-secondary" type="button" onClick={() => setShowTrackerForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-700">Individual Progress Tracker</p>
              <button className="btn-primary text-sm" onClick={() => setShowTrackerForm(!showTrackerForm)}>
                {showTrackerForm ? "Close" : "+ Add Member"}
              </button>
            </div>
            <div className="p-5 space-y-3">
              {tracker.map((t) => {
                const statusLabel = t.progress === 100 ? "Completed" : t.progress >= 50 ? "In Progress" : "Just Started";
                const statusColor = t.progress === 100 ? "bg-emerald-50 text-emerald-700" : t.progress >= 50 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
                const barColor = t.progress === 100 ? "bg-emerald-500" : t.progress >= 50 ? "bg-indigo-500" : "bg-amber-400";
                return (
                  <div key={t.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div className="w-36 flex-shrink-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{t.name}</p>
                      <p className="text-xs text-slate-400 truncate">{t.program}</p>
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-2.5 rounded-full ${barColor} transition-all duration-700`}
                          style={{ width: `${t.progress}%` }} />
                      </div>
                    </div>
                    <div className="w-10 text-sm font-bold text-slate-700 text-right">{t.progress}%</div>
                    <span className={`badge text-xs w-24 text-center flex-shrink-0 ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}