"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

// Re-check the token when another tab logs in or out.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
const hasTokenOnClient = () => Boolean(localStorage.getItem("jwtToken"));
// During the static build there is no localStorage: "unknown yet".
const hasTokenOnServer = () => null;

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hasToken = useSyncExternalStore(
    subscribe,
    hasTokenOnClient,
    hasTokenOnServer,
  );

  useEffect(() => {
    // replace (not push) so Back doesn't return to a page that bounces again
    if (hasToken === false) router.replace("/auth/login");
  }, [hasToken, router]);

  // Don't show the protected page until we know the user is logged in.
  if (!hasToken) {
    return <div className="min-h-screen bg-[#050507]" />;
  }
  return <>{children}</>;
}
