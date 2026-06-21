import { NextResponse } from "next/server";
import { anthropic, AI_MODEL } from "@/lib/ai/claude";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { openingId } = await req.json();
  const opening = await prisma.jobOpening.findUnique({
    where: { id: openingId },
    include: { request: true },
  });
  if (!opening) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Write a standardized job description for a non-profit (AI for Vietnam) long-term volunteer role.
Job title: ${opening.title}
Team: ${opening.team}
Headcount: ${opening.openingsCount}
Reason for hiring: ${opening.request.reason}

Structure: Role Summary, Responsibilities (bullets), Requirements (bullets), What you'll gain (bullets).
Keep it concise, professional, in English. Return plain text only, no markdown headers with #.`,
      },
    ],
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  return NextResponse.json({ jdText: text });
}
