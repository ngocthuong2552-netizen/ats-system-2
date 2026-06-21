"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/requests", label: "Hiring Requests" },
  { href: "/openings", label: "Openings" },
  { href: "/candidates", label: "Candidates" },
  { href: "/talent-pool", label: "Talent Pool" },
  { href: "/assistant", label: "AI Assistant" },
];

export default function NavBar({ user }: { user: any }) {
  const pathname = usePathname();
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">AIV ATS</span>
          <nav className="flex gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm ${
                  pathname?.startsWith(l.href) ? "text-indigo-600 font-medium" : "text-slate-600"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{user?.name} · {user?.role}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-secondary">
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
