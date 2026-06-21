import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") || 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // FR-11.1 Active candidates = passed CV screening, not yet offered/rejected
  // i.e. currently in CULTURE_FIT or TECHNICAL stage, status ACTIVE
  const activeCandidates = await prisma.application.findMany({
    where: {
      status: "ACTIVE",
      stage: { in: ["CULTURE_FIT", "TECHNICAL"] },
    },
    include: { candidate: true, jobOpening: true },
  });

  // FR-11.2 New applicants = still in APPLIED (not yet CV-screened), within time filter
  const newApplicants = await prisma.application.findMany({
    where: {
      stage: "APPLIED",
      appliedAt: { gte: since },
    },
    include: { candidate: true },
  });

  // FR-11.3 Pipeline funnel: counts per stage
  const stages = ["APPLIED", "CV_SCREENING", "CULTURE_FIT", "TECHNICAL", "OFFER", "ONBOARDING", "HIRED"];
  const funnel: Record<string, number> = {};
  for (const stage of stages) {
    funnel[stage] = await prisma.application.count({ where: { stage: stage as any } });
  }

  // FR-11.4 Open requests/openings: headcount vs filled
  const openings = await prisma.jobOpening.findMany({
    include: { request: true },
    where: { status: { in: ["OPEN", "ON_HOLD"] } },
  });

  // FR-11.5 Source & conversion
  const bySource = await prisma.application.groupBy({
    by: ["source"],
    _count: { _all: true },
  });
  const totalOffers = await prisma.application.count({ where: { stage: { in: ["OFFER", "ONBOARDING", "HIRED"] } } });
  const totalHired = await prisma.application.count({ where: { stage: "HIRED" } });
  const offerAcceptanceRate = totalOffers > 0 ? Math.round((totalHired / totalOffers) * 100) : 0;

  return NextResponse.json({
    activeCandidatesCount: activeCandidates.length,
    activeCandidates,
    newApplicantsCount: newApplicants.length,
    newApplicants,
    funnel,
    openings,
    bySource,
    offerAcceptanceRate,
  });
}
