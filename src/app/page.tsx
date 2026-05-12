"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    // Prevent hydration mismatch: render nothing until auth is checked
    return null;
  }
  if (!isAuthenticated) {
    // Prevent dashboard render until redirect
    return null;
  }

  const DashboardPage = require("./dashboard/page").default;
  return (
    <div className="container mx-auto py-2 px-2">
      <DashboardPage />
    </div>
  );
}
