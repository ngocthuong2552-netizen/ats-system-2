"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  if (!loading) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-0.5 bg-indigo-500 animate-pulse" />
    </div>
  );
}

function KeepAlive() {
  useEffect(() => {
    // Ping server every 4 minutes to prevent cold start
    const ping = () => fetch("/api/ping").catch(() => {});
    ping(); // ping immediately on load
    const interval = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <KeepAlive />
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
    </SessionProvider>
  );
}