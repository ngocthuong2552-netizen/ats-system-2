import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.emailLog.update({
    where: { id: params.id },
    data: {
      status: "sent",
      sentAt: new Date(),
      renderedSubject: body.renderedSubject ?? undefined,
      renderedBody: body.renderedBody ?? undefined,
    },
  });
  return NextResponse.json(updated);
}
