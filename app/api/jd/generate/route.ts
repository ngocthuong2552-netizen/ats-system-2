import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { openingId } = await req.json();
  const opening = await prisma.jobOpening.findUnique({
    where: { id: openingId },
    include: { request: true },
  });
  if (!opening) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const jdText = await generateText(`Write a standardized job description for a non-profit (AI for Vietnam) long-term volunteer role.
Job title: ${opening.title}
Team: ${opening.team}
Headcount: ${opening.openingsCount}
Reason for hiring: ${opening.request.reason}

Structure: Role Summary, Responsibilities (bullets), Requirements (bullets), What you will gain (bullets).
Keep it concise, professional, in English. Return plain text only, no markdown headers with #.`);

    return NextResponse.json({ jdText });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "AI generation failed" }, { status: 502 });
  }
}