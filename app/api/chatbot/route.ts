import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SOP_KNOWLEDGE = `
AIV Long-Term Volunteer Recruitment SOP:
- Pipeline stages: Applied -> CV Screening -> Culture-Fit -> Technical -> Offer -> Onboarding -> Hired.
- Terminal statuses: Rejected (requires reason), Position Filled, Talent Pool, Withdrawn.
- Referral fast-track: referred candidates may skip Technical round with HR override.
- Onboarding requires Offer marked as Signed in DocuSign.
- HR/Admin = full access. Hiring Manager = own openings only. Interviewer = assigned packets only.
- Active Candidates = passed CV Screening, currently in Culture-Fit or Technical stage.
- New Applicants = in Applied stage, not yet CV-screened.
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

  let candidateContext = "No specific candidate matched.";
  if (mentioned.length > 0) {
    candidateContext = mentioned.map((c) => {
      const apps = c.applications
        .map((a) => `  - "${a.jobOpening.title}": stage=${a.stage}, status=${a.status}`)
        .join("\n");
      return `Candidate: ${c.fullName}\n${apps || "  (no applications)"}`;
    }).join("\n\n");
  }

  try {
    const answer = await generateText(`You are an HR assistant for AI for Vietnam's ATS. Answer using ONLY the data and SOP below. If not found, say so.

=== SOP ===
${SOP_KNOWLEDGE}

=== CANDIDATE DATA ===
${candidateContext}

=== QUESTION ===
${question}

Answer in 2-4 sentences.`);

    return NextResponse.json({ answer });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI request failed" }, { status: 502 });
  }
}