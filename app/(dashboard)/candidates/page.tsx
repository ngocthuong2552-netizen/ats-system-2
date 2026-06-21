"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/candidates").then((r) => r.json()).then(setCandidates);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Candidates</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-2">Tên</th><th>Email</th><th>Talent Pool</th><th>Referral</th></tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="py-2"><Link href={`/candidates/${c.id}`} className="text-indigo-600">{c.fullName}</Link></td>
                <td>{c.email}</td>
                <td>{c.talentPool ? "✅" : "—"}</td>
                <td>{c.isReferral ? "✅" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
