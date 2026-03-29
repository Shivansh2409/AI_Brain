"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      router.push("/auth/login");
      return;
    }
  }, [router]);

  return <>{children}</>;
}
