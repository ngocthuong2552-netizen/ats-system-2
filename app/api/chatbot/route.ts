import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SOP_KNOWLEDGE = `
AIV Long-Term Volunteer Recruitment SOP:
- Pipeline stages in order: Applied -> CV Screening -> Culture-Fit Interview (Round 1) -> Technical Interview (Round 2) -> Offer (Volunteer Invitation) -> Onboarding -> Hired.
- Terminal/side statuses: Rejected (requires a reason), Position Filled, Talent Pool, Withdrawn.
- Referral fast-track: a referred candidate already interviewed by a lead may skip the Technical round (HR override), but Culture-Fit + time-commitment check are still required.
- Moving to Onboarding requires the Offer to be marked "Signed" in DocuSign status.
- Every stage advance or rejection must produce a matching email draft before sending (manual-assist: HR copies into Gmail and marks Sent).
- HR/Admin has full access; Hiring Manager submits requests and views own openings; Interviewer only sees the assigned candidate packet and submits evaluations.
- Active Candidates KPI = candidates who passed CV Screening but have not yet received an offer or rejection (currently in Culture-Fit or Technical).
- New Applicants KPI = candidates still in the Applied stage (not yet CV-screened).
`;

export async function POST(req: Request) {
  const { question } = await req.json();
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });

  const candidates = await prisma.candidate.findMany({
    include: { applications: { include: { jobOpening: true } } },
  });
  const mentioned = candidates.filter((c) =>
    question.toLowerCase().includes(c.fullName.toLowerCase())
  );

  let candidateContext = "No specific candidate matched in the question.";
  if (mentioned.length > 0) {
    candidateContext = mentioned
      .map((c) => {
        const apps = c.applications
          .map((a) => `  - Application for "${a.jobOpening.title}": stage=${a.stage}, status=${a.status}`)
          .join("\n");
        return `Candidate: ${c.fullName}\n${apps || "  (no applications)"}`;
      })
      .join("\n\n");
  }

  try {
    const answer = await generateText(`You are an internal HR assistant for AI for Vietnam's ATS. Answer the HR user's question using ONLY the data and SOP below. If the answer isn't in the data, say you don't have that information in the system.

=== RECRUITMENT SOP ===
${SOP_KNOWLEDGE}

=== LIVE CANDIDATE DATA (matched to the question) ===
${candidateContext}

=== QUESTION ===
${question}

Answer concisely in 2-4 sentences.`);

    return NextResponse.json({ answer });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI request failed" }, { status: 502 });
  }
}