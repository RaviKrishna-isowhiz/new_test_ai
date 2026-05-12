"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import { useTheme } from "@/contexts/ThemeContext";

export default function AboutPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const router = useRouter();
  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
    }
  }, [router]);

  const user = typeof window !== "undefined" ? getUser() : null;
  if (!user) {
    return null;
  }
  return (
    <div className={`max-w-4xl mx-auto p-6 flex-1 bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-slate-900 ${isDark ? 'dark-mode-active' : ''}`}>
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-900/20 p-6 border dark:border-slate-700 ${isDark ? 'force-dark-card' : ''}`}>
        <h1 className="text-2xl font-semibold mb-4 text-blue-900 dark:text-white">About</h1>
        <p className="text-slate-700 dark:text-slate-200">AI Planet — a demo app for uploading and exploring datasets.</p>
      </div>
    </div>
  );
}
