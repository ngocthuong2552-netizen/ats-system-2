import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { interviewId, criteriaScores, recommendation, notes } = body;

  const evaluation = await prisma.evaluation.create({
    data: {
      interviewId,
      interviewerId: session.user.id,
      criteriaScores: JSON.stringify(criteriaScores || {}),
      recommendation,
      notes,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "evaluation_submitted",
      toValue: recommendation,
    },
  });

  return NextResponse.json(evaluation, { status: 201 });
}
