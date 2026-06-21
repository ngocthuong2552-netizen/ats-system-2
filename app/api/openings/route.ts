import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const openings = await prisma.jobOpening.findMany({
    include: { applications: true, request: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(openings);
}