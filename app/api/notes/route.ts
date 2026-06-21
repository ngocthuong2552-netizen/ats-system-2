import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { candidateId, text } = await req.json();
  const note = await prisma.note.create({
    data: { candidateId, authorId: session.user.id, text },
  });
  return NextResponse.json(note, { status: 201 });
}
