// Maps (current stage, outcome) -> ordered list of email template keys to draft.
// Mirrors PRD §8.2 stage-transition -> template trigger matrix.

export type Outcome = "advance" | "reject" | "position_filled" | "offer" | "onboard";

export const TRANSITION_TEMPLATES: Record<string, Partial<Record<Outcome, string[]>>> = {
  CV_SCREENING: {
    advance: ["CV_PASS_CULTUREFIT_INVITE", "CAL_INVITE_CULTUREFIT"],
    reject: ["CV_REJECT"],
    position_filled: ["POSITION_FILLED"],
  },
  CULTURE_FIT: {
    advance: ["TECH_INVITE_CONFIRM", "CAL_INVITE_TECHNICAL"],
    reject: ["CULTUREFIT_REJECT"],
  },
  TECHNICAL: {
    offer: ["VOLUNTEER_INVITATION_OFFER", "DOCUSIGN_ENVELOPE"],
    reject: ["INTERVIEW_REJECT"],
  },
  OFFER: {
    onboard: ["ONBOARDING_INFO"],
  },
};

// Next stage when "advance" / "offer" / "onboard" outcome is applied.
export const NEXT_STAGE: Record<string, string> = {
  APPLIED: "CV_SCREENING",
  CV_SCREENING: "CULTURE_FIT",
  CULTURE_FIT: "TECHNICAL",
  TECHNICAL: "OFFER",
  OFFER: "ONBOARDING",
  ONBOARDING: "HIRED",
};
