import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const interview = await prisma.interview.findUnique({
    where: { id: params.id },
    include: {
      panelists: { include: { user: true } },
      evaluation: true,
      application: {
        include: {
          candidate: true,
          jobOpening: true,
          interviews: { include: { evaluation: true } },
        },
      },
    },
  });
  if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Packet rule: technical packet ALSO includes culture-fit evaluation/feedback
  let priorFeedback = null;
  if (interview.round === "TECHNICAL") {
    const cultureFit = interview.application.interviews.find((i) => i.round === "CULTURE_FIT");
    priorFeedback = cultureFit?.evaluation || null;
  }

  return NextResponse.json({
    interview,
    candidate: interview.application.candidate,
    opening: interview.application.jobOpening,
    priorFeedback,
  });
}
