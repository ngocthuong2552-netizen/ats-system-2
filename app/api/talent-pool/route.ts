import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";

  const pool = await prisma.candidate.findMany({
    where: { talentPool: true },
    orderBy: { updatedAt: "desc" },
  });

  const filtered = q
    ? pool.filter((c) => {
        const skills = c.skills ? (JSON.parse(c.skills) as string[]).join(" ").toLowerCase() : "";
        return (
          c.fullName.toLowerCase().includes(q) ||
          skills.includes(q) ||
          (c.country || "").toLowerCase().includes(q)
        );
      })
    : pool;

  return NextResponse.json(filtered);
}

// Toggle talent pool flag on a candidate
export async function PATCH(req: Request) {
  const { candidateId, talentPool } = await req.json();
  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: { talentPool },
  });
  return NextResponse.json(updated);
}
