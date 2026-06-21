import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { docusignStatus } = await req.json(); // not_sent | sent | signed

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = { docusignStatus };
  // Moving to Onboarding requires Offer marked Signed (§5.3)
  if (docusignStatus === "signed" && application.stage === "OFFER") {
    data.stage = "ONBOARDING";
  }

  const updated = await prisma.application.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
