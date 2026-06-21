iimport { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { applicationId } = await req.json();
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: true, jobOpening: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const skills = application.candidate.skills ? JSON.parse(application.candidate.skills) : [];

  let parsed;
  try {
    parsed = await generateJSON(`Compare this candidate against the job description. Return ONLY JSON: {"score": number 0-100, "rationale": string (max 2 sentences)}.

JOB DESCRIPTION:
${application.jobOpening.jdText || application.jobOpening.title}

CANDIDATE:
Skills: ${skills.join(", ")}
Experience years: ${application.candidate.experienceYears ?? "unknown"}`);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI returned invalid JSON" }, { status: 502 });
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { matchingScore: parsed.score, matchingRationale: parsed.rationale },
  });

  return NextResponse.json(updated);
}