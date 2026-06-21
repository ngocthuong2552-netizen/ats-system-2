import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRANSITION_TEMPLATES, NEXT_STAGE, Outcome } from "@/lib/stage-transitions";

function fillTemplate(body: string, fields: Record<string, string>) {
  let out = body;
  for (const [key, val] of Object.entries(fields)) {
    out = out.replaceAll(`{{${key}}}`, val ?? "");
  }
  return out;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const outcome: Outcome = body.outcome; // advance | reject | position_filled | offer | onboard
  const rejectionReason: string | undefined = body.rejectionReason;
  const fastTrackOverride: boolean = !!body.fastTrackOverride;
  const fastTrackNote: string | undefined = body.fastTrackNote;

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { candidate: true, jobOpening: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // FR-5.1: rejection requires a reason
  if ((outcome === "reject" || outcome === "position_filled") && !rejectionReason) {
    return NextResponse.json({ error: "rejectionReason is required" }, { status: 400 });
  }

  let newStage = application.stage;
  let newStatus = application.status;

  if (outcome === "advance" || outcome === "offer" || outcome === "onboard") {
    // Referral fast-track: skip TECHNICAL round straight to OFFER
    if (fastTrackOverride && application.stage === "CULTURE_FIT") {
      newStage = "OFFER" as any;
    } else {
      newStage = (NEXT_STAGE[application.stage] || application.stage) as any;
    }
  } else if (outcome === "reject") {
    newStatus = "REJECTED" as any;
  } else if (outcome === "position_filled") {
    newStatus = "POSITION_FILLED" as any;
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: {
      stage: newStage,
      status: newStatus,
      rejectionReason: outcome === "reject" || outcome === "position_filled" ? rejectionReason : application.rejectionReason,
      rejectionStage: outcome === "reject" || outcome === "position_filled" ? application.stage : application.rejectionStage,
      fastTrackOverride: fastTrackOverride || application.fastTrackOverride,
      fastTrackNote: fastTrackNote ?? application.fastTrackNote,
    },
  });

  await prisma.activityLog.create({
    data: {
      applicationId: application.id,
      userId: session.user.id,
      action: "stage_change",
      fromValue: application.stage,
      toValue: `${newStage}/${newStatus}`,
    },
  });

  // Draft the matching email template(s) - FR-8.1, §8.2
  const templateKeys = TRANSITION_TEMPLATES[application.stage]?.[outcome] || [];
  const drafts = [];
  for (const key of templateKeys) {
    const template = await prisma.emailTemplate.findUnique({ where: { key } });
    if (!template) continue;
    const fields = {
      "Candidate Name": application.candidate.fullName,
      "Position": application.jobOpening.title,
      "Role Name": application.jobOpening.title,
      "Duration": "45 minutes",
      "Date/Time": "(to be scheduled)",
      "Deadline": "(HR to set)",
    };
    const log = await prisma.emailLog.create({
      data: {
        applicationId: application.id,
        templateKey: key,
        renderedSubject: fillTemplate(template.subject, fields),
        renderedBody: fillTemplate(template.body, fields),
        status: "draft",
      },
    });
    drafts.push(log);
  }

  return NextResponse.json({ application: updated, emailDrafts: drafts });
}
