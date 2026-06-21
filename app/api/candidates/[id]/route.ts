import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: {
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      applications: {
        include: {
          jobOpening: true,
          interviews: { include: { evaluation: true, panelists: { include: { user: true } } } },
          emailLogs: { orderBy: { createdAt: "desc" } },
          activityLogs: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(candidate);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const allowed = [
    "fullName", "email", "phone", "country", "skills",
    "experienceYears", "education", "certifications", "talentPool",
  ];
  const data: Record<string, any> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  const updated = await prisma.candidate.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
