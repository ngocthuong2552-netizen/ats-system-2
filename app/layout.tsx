import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "AIV ATS - Recruitment",
  description: "AI for Vietnam - Applicant Tracking System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
