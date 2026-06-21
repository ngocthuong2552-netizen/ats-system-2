import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { applicationId, round, scheduledAt, format, durationMins, panelistUserIds } = body;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: true, jobOpening: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inviteText = `Interview: ${round === "CULTURE_FIT" ? "Culture-Fit" : "Technical"} Round
Candidate: ${application.candidate.fullName}
Position: ${application.jobOpening.title}
Time: ${scheduledAt}
Format: ${format || "Google Meet"}
Duration: ${durationMins || 45} minutes`;

  const interview = await prisma.interview.create({
    data: {
      applicationId,
      round,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      format,
      durationMins,
      inviteText,
      panelists: {
        create: (panelistUserIds || []).map((userId: string) => ({ userId })),
      },
    },
    include: { panelists: { include: { user: true } } },
  });

  return NextResponse.json(interview, { status: 201 });
}
