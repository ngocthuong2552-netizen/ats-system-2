import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// -----------------------------------------------------------------------
// 12 EMAIL TEMPLATES (§8.1 of PRD)
// NOTE: subject/body below are PLACEHOLDER copy. Replace with the verbatim
// text from the People team's Email Template document before going live —
// the PRD explicitly states this copy "must not be paraphrased."
// -----------------------------------------------------------------------
const templates = [
  {
    key: "CV_PASS_CULTUREFIT_INVITE",
    purpose: "CV passed -> invite to culture-fit interview",
    subject: "Invitation to Interview - {{Position}} at AI for Vietnam",
    body: `Dear {{Candidate Name}},

Thank you for applying for the {{Position}} role at AI for Vietnam. We were impressed with your application and would like to invite you to a Culture-Fit interview.

Duration: {{Duration}}
Proposed time: {{Date/Time}}
Please confirm your availability by {{Deadline}}.

Best regards,
AI for Vietnam People Team`,
    mergeFields: ["Candidate Name", "Position", "Duration", "Date/Time", "Deadline"],
  },
  {
    key: "CAL_INVITE_CULTUREFIT",
    purpose: "Calendar-invite body for culture-fit",
    subject: "Culture-Fit Interview - {{Candidate Name}} / {{Position}}",
    body: `Culture-Fit Interview with {{Candidate Name}} for the {{Position}} role.
Duration: {{Duration}}
Format: Google Meet (link to be added)`,
    mergeFields: ["Candidate Name", "Position", "Duration"],
  },
  {
    key: "CV_REJECT",
    purpose: "CV screening reject (standard)",
    subject: "Update on your application - {{Position}}",
    body: `Dear {{Candidate Name}},

Thank you for your interest in the {{Position}} role at AI for Vietnam. After careful review, we will not be moving forward with your application at this time.

We appreciate the time you invested and encourage you to apply again in the future.

Best regards,
AI for Vietnam People Team`,
    mergeFields: ["Candidate Name", "Position"],
  },
  {
    key: "POSITION_FILLED",
    purpose: "Strong candidate, seat filled",
    subject: "Update on your application - {{Position}}",
    body: `Dear {{Candidate Name}},

Thank you for your interest in the {{Position}} role. You were a strong candidate; however, the open seat(s) for this cycle have been filled.

We would like to keep your profile in our talent pool for future opportunities.

Best regards,
AI for Vietnam People Team`,
    mergeFields: ["Candidate Name", "Position"],
  },
  {
    key: "CAL_INVITE_TECHNICAL",
    purpose: "Calendar-invite body for technical",
    subject: "Technical Interview - {{Candidate Name}} / {{Position}}",
    body: `Technical Interview with {{Candidate Name}} for the {{Position}} role.
Duration: {{Duration}}
Format: Google Meet (link to be added)`,
    mergeFields: ["Candidate Name", "Position", "Duration"],
  },
  {
    key: "CULTUREFIT_REJECT",
    purpose: "Reject after culture-fit interview",
    subject: "Update on your application - {{Position}}",
    body: `Dear {{Candidate Name}},

Thank you for taking the time to interview for the {{Position}} role. After careful consideration, we will not be moving forward at this stage.

We wish you the best in your future endeavors.

Best regards,
AI for Vietnam People Team`,
    mergeFields: ["Candidate Name", "Position"],
  },
  {
    key: "TECH_INVITE_CONFIRM",
    purpose: "Culture-fit passed -> invite to technical (confirm availability)",
    subject: "Next Step: Technical Interview - {{Position}}",
    body: `Dear {{Candidate Name}},

Congratulations on advancing to the Technical Interview round for the {{Position}} role!

Duration: {{Duration}}
Proposed time: {{Date/Time}}
Please confirm your availability by {{Deadline}}.

Best regards,
AI for Vietnam People Team`,
    mergeFields: ["Candidate Name", "Position", "Date/Time", "Deadline", "Duration"],
  },
  {
    key: "VOLUNTEER_INVITATION_OFFER",
    purpose: "Offer / volunteer invitation + onboarding steps",
    subject: "Volunteer Invitation - {{Role Name}} at AI for Vietnam",
    body: `Dear {{Candidate Name}},

We are delighted to invite you to join AI for Vietnam as a {{Role Name}}!

Please review and sign the attached agreement by {{Deadline}}. Once signed, we will share onboarding and account-setup details, including Slack access.

Welcome to the team!

Best regards,
AI for Vietnam People Team`,
    mergeFields: ["Candidate Name", "Role Name", "Deadline"],
  },
  {
    key: "DOCUSIGN_ENVELOPE",
    purpose: "DocuSign envelope message",
    subject: "Please sign: {{Position}} Volunteer Agreement",
    body: `Dear {{Candidate Name}},

Please find attached your Volunteer Agreement for the {{Position}} role. Kindly review and sign at your earliest convenience.

Best regards,
AI for Vietnam People Team`,
    mergeFields: ["Candidate Name", "Position"],
  },
  {
    key: "INTERVIEW_REJECT",
    purpose: "Reject after (technical) interview",
    subject: "Update on your application - {{Position}}",
    body: `Dear {{Candidate Name}},

Thank you for interviewing for the {{Position}} role. After careful consideration, we have decided not to move forward with your application.

We truly appreciate your time and interest in AI for Vietnam.

Best regards,
AI for Vietnam People Team`,
    mergeFields: ["Candidate Name", "Position"],
  },
  {
    key: "ONBOARDING_INFO",
    purpose: "Onboarding / account-setup hand-off after signature",
    subject: "Welcome aboard! Onboarding info for {{Role Name}}",
    body: `Dear {{Candidate Name}},

Welcome to AI for Vietnam! Here is your onboarding information for the {{Role Name}} role:
- Slack invitation: (to be sent)
- Account setup: (to be sent)
- Onboarding checklist: (to be attached)

We're excited to have you on the team!

Best regards,
AI for Vietnam People Team`,
    mergeFields: ["Candidate Name", "Role Name"],
  },
  {
    key: "REQUEST_INFO_NEEDED",
    purpose: "HR asks Hiring Manager for more info on a request (internal)",
    subject: "Action needed: more info on your hiring request ({{Position}})",
    body: `Hi,

We need a bit more information on your hiring request for {{Position}} before we can approve it. Please review the notes in the ATS and update accordingly.

Thanks,
AI for Vietnam People Team`,
    mergeFields: ["Position"],
  },
];

async function main() {
  console.log("Seeding email templates...");
  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { key: t.key },
      update: {
        purpose: t.purpose,
        subject: t.subject,
        body: t.body,
        mergeFields: JSON.stringify(t.mergeFields),
      },
      create: {
        key: t.key,
        purpose: t.purpose,
        subject: t.subject,
        body: t.body,
        mergeFields: JSON.stringify(t.mergeFields),
      },
    });
  }

  console.log("Seeding demo accounts...");
  const demoUsers = [
    { name: "Admin HR", email: "[email protected]", role: "ADMIN", password: "Admin@123" },
    { name: "HR Recruiter", email: "[email protected]", role: "HR", password: "Hr@12345" },
    { name: "Hiring Manager", email: "[email protected]", role: "HIRING_MANAGER", password: "Manager@123" },
    { name: "Interviewer One", email: "[email protected]", role: "INTERVIEWER", password: "Interview@123" },
  ];

  for (const u of demoUsers) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
      },
    });
  }
// ---- THÊM VÀO ĐÂY ----

  console.log("Seeding sample candidates...");

  // Tạo Opening mẫu (cần có 1 user HR làm hiringManager)
  const hrUser = await prisma.user.findFirst({ where: { role: "HR" } });
  if (hrUser) {
    const request = await prisma.hiringRequest.create({
      data: {
        hiringManagerId: hrUser.id,
        jobTitle: "Frontend Developer",
        team: "Engineering",
        headcount: 2,
        priority: "HIGH",
        reason: "Mở rộng team Engineering Q3 2025",
        targetOnboardingDate: new Date("2025-09-01"),
        status: "APPROVED",
      },
    });

    const opening = await prisma.jobOpening.create({
      data: {
        requestId: request.id,
        title: "Frontend Developer",
        team: "Engineering",
        openingsCount: 2,
        status: "OPEN",
        jdText: "We are looking for a Frontend Developer to join our Engineering team.",
      },
    });

    // Candidate 1
    await prisma.candidate.create({
      data: {
        fullName: "Nguyen Van A",
        email: "[email protected]",
        phone: "0901234567",
        country: "Vietnam",
        skills: JSON.stringify(["React", "TypeScript", "NextJS"]),
        experienceYears: 3,
        applications: {
          create: {
            jobOpeningId: opening.id,
            source: "LinkedIn",
            stage: "CV_SCREENING",
            status: "ACTIVE",
          },
        },
      },
    });

    // Candidate 2
    await prisma.candidate.create({
      data: {
        fullName: "Tran Thi B",
        email: "[email protected]",
        phone: "0912345678",
        country: "Vietnam",
        isReferral: true,
        referrer: "Team Lead Minh",
        skills: JSON.stringify(["Python", "Machine Learning", "FastAPI"]),
        experienceYears: 5,
        applications: {
          create: {
            jobOpeningId: opening.id,
            source: "Referral",
            stage: "CULTURE_FIT",
            status: "ACTIVE",
          },
        },
      },
    });

    // Candidate 3
    await prisma.candidate.create({
      data: {
        fullName: "Le Hoang C",
        email: "[email protected]",
        phone: "0923456789",
        country: "Vietnam",
        skills: JSON.stringify(["UI/UX", "Figma", "React"]),
        experienceYears: 2,
        talentPool: true,
        applications: {
          create: {
            jobOpeningId: opening.id,
            source: "Website",
            stage: "APPLIED",
            status: "ACTIVE",
          },
        },
      },
    });

    console.log("Sample data seeded: 1 opening, 3 candidates");
  }

  // ---- KẾT THÚC PHẦN THÊM ----
  console.log("Done. Demo logins:");
  demoUsers.forEach((u) => console.log(`  ${u.email} / ${u.password} (${u.role})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
