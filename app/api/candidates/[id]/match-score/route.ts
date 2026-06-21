import { NextResponse } from "next/server";
import { anthropic, AI_MODEL } from "@/lib/ai/claude";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { applicationId } = await req.json();
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: true, jobOpening: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const skills = application.candidate.skills ? JSON.parse(application.candidate.skills) : [];

  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Compare this candidate against the job description. Return ONLY JSON: {"score": number 0-100, "rationale": string (max 2 sentences)}.

JOB DESCRIPTION:
${application.jobOpening.jdText || application.jobOpening.title}

CANDIDATE:
Skills: ${skills.join(", ")}
Experience years: ${application.candidate.experienceYears ?? "unknown"}`,
      },
    ],
  });

  const raw = msg.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/, "");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 502 });
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { matchingScore: parsed.score, matchingRationale: parsed.rationale },
  });

  return NextResponse.json(updated);
}
