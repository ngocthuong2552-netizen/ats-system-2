import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const openingId = searchParams.get("openingId");
  const candidates = await prisma.candidate.findMany({
    where: openingId
      ? { applications: { some: { jobOpeningId: openingId } } }
      : undefined,
    include: { applications: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(candidates);
}

// Create candidate + application (no AI parsing here; CV text/file handled client-side
// then sent to /api/candidates/[id]/parse-cv, or fields entered manually)
export async function POST(req: Request) {
  const body = await req.json();
  const { fullName, email, phone, jobOpeningId, source, isReferral, referrer, cvFileName, cvFileUrl } = body;

  if (!fullName || !email || !jobOpeningId) {
    return NextResponse.json({ error: "fullName, email, jobOpeningId required" }, { status: 400 });
  }

  const candidate = await prisma.candidate.create({
    data: {
      fullName,
      email,
      phone,
      isReferral: !!isReferral,
      referrer,
      cvFileName,
      cvFileUrl,
      applications: {
        create: {
          jobOpeningId,
          source,
          stage: "APPLIED",
          status: "ACTIVE",
        },
      },
    },
    include: { applications: true },
  });

  return NextResponse.json(candidate, { status: 201 });
}
