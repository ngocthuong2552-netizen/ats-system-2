import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { cvText, cvFileUrl, cvFileName } = await req.json();
  if (!cvText) return NextResponse.json({ error: "cvText required" }, { status: 400 });

  let parsed;
  try {
    parsed = await generateJSON(`Extract structured candidate data from this CV text. Return ONLY valid JSON matching this shape exactly:
{"full_name": string, "email": string, "phone": string, "skills": string[], "experience_years": number, "education": [{"school": string, "degree": string}], "certifications": string[]}

CV TEXT:
"""
${cvText.slice(0, 8000)}
"""`);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI returned invalid JSON" }, { status: 502 });
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