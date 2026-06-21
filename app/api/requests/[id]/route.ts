import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updated = await prisma.hiringRequest.update({
    where: { id: params.id },
    data: {
      status: body.status,
      reviewerNotes: body.reviewerNotes,
    },
  });

  // FR-1.2: Approved request -> one-click create JobOpening
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
