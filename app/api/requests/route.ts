import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  jobTitle: z.string().min(1),
  team: z.string().min(1),
  headcount: z.number().int().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  reason: z.string().min(1),
  targetOnboardingDate: z.string(),
});

export async function GET() {
  const requests = await prisma.hiringRequest.findMany({
    include: { hiringManager: true, opening: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const request = await prisma.hiringRequest.create({
    data: {
      hiringManagerId: session.user.id,
      jobTitle: data.jobTitle,
      team: data.team,
      headcount: data.headcount,
      priority: data.priority,
      reason: data.reason,
      targetOnboardingDate: new Date(data.targetOnboardingDate),
      status: "SUBMITTED",
    },
  });

  return NextResponse.json(request, { status: 201 });
}