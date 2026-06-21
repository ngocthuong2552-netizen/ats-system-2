import { NextResponse } from "next/server";
import { anthropic, AI_MODEL } from "@/lib/ai/claude";
import { prisma } from "@/lib/prisma";

// Expects { cvText: string } - extraction of text from the uploaded PDF/DOCX
// should happen client-side or in a separate pre-step (pdf-parse / mammoth)
// before calling this route, to keep this endpoint storage-agnostic.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { cvText, cvFileUrl, cvFileName } = await req.json();
  if (!cvText) return NextResponse.json({ error: "cvText required" }, { status: 400 });

  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Extract structured candidate data from this CV text. Return ONLY valid JSON, no markdown fences, matching this shape exactly:
{"full_name": string, "email": string, "phone": string, "skills": string[], "experience_years": number, "education": [{"school": string, "degree": string}], "certifications": string[]}

CV TEXT:
"""
${cvText.slice(0, 8000)}
"""`,
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

  const updated = await prisma.candidate.update({
    where: { id: params.id },
    data: {
      fullName: parsed.full_name || undefined,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      skills: JSON.stringify(parsed.skills || []),
      experienceYears: parsed.experience_years ?? undefined,
      education: JSON.stringify(parsed.education || []),
      certifications: JSON.stringify(parsed.certifications || []),
      cvFileUrl: cvFileUrl || undefined,
      cvFileName: cvFileName || undefined,
    },
  });

  return NextResponse.json(updated);
}
