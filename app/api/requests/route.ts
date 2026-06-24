import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: any = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.reviewerNotes !== undefined) data.reviewerNotes = body.reviewerNotes;
  if (body.jobTitle !== undefined) data.jobTitle = body.jobTitle;
  if (body.team !== undefined) data.team = body.team;
  if (body.headcount !== undefined) data.headcount = Number(body.headcount);
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.reason !== undefined) data.reason = body.reason;
  if (body.targetOnboardingDate !== undefined) data.targetOnboardingDate = new Date(body.targetOnboardingDate);

  const updated = await prisma.hiringRequest.update({ where: { id: params.id }, data });

  if (body.status === "APPROVED" && body.createOpening) {
    const existing = await prisma.jobOpening.findUnique({ where: { requestId: updated.id } });
    if (!existing) {
      await prisma.jobOpening.create({
        data: {
          requestId: updated.id,
          title: updated.jobTitle,
          team: updated.team,
          openingsCount: updated.headcount,
          status: "OPEN",
        },
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.hiringRequest.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}