import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const opening = await prisma.jobOpening.findUnique({
    where: { id: params.id },
    include: {
      request: true,
      applications: {
        include: { candidate: true },
        orderBy: { appliedAt: "desc" },
      },
    },
  });
  if (!opening) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(opening);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.jobOpening.update({
    where: { id: params.id },
    data: {
      jdText: body.jdText,
      status: body.status,
    },
  });
  return NextResponse.json(updated);
}
