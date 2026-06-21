import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "HR" | "HIRING_MANAGER" | "INTERVIEWER";
    } & DefaultSession["user"];
  }
}
