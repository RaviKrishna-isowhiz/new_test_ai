import React from 'react';
import Image from 'next/image';
import LoginForm from '@/components/LoginForm';

export const metadata = {
  title: 'Login - AI Planet',
};

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left panel - branding */}
        <div className="flex flex-col justify-between gap-6 p-10 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 text-white">
          <div className="relative flex flex-col items-center text-center">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/70 via-gray-200/80 to-gray-700/60 z-0 rounded-2xl" style={{ filter: 'blur(8px)', opacity: 0.7 }} />
            <div className="relative z-10 flex flex-col items-center">
              <div className="rounded-full bg-white/30 p-4 shadow-xl transform transition-transform duration-500 hover:scale-110 animate-[bounce_2s_infinite]">
                <Image src="/images/android-chrome-192x192.png" alt="AI Toolkit" width={120} height={120} className="w-32 h-32 object-cover rounded-full border-4 border-white/40 shadow-lg" />
              </div>
              <p className="mt-4 text-lg font-semibold max-w-xs opacity-95 drop-shadow-lg">AI Planet — your one-stop AI toolkit for every industry.</p>
            </div>
          </div>

          <div className="mt-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">📁</div>
                <div>
                  <div className="font-semibold">Fast uploads</div>
                  <div className="text-sm opacity-90">Drag & drop CSV/Excel and get instant previews.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">🔍</div>
                <div>
                  <div className="font-semibold">Explore data</div>
                  <div className="text-sm opacity-90">Sort, filter and discover patterns visually.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">🔒</div>
                <div>
                  <div className="font-semibold">Local-first</div>
                  <div className="text-sm opacity-90">Your data stays in the browser until you choose to export.</div>
                </div>
              </li>
            </ul>

            <div className="mt-6 text-center">
              <a href="#" className="inline-block rounded-md bg-white text-indigo-700 px-4 py-2 font-medium hover:bg-white/90">Learn more</a>
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="p-8 md:p-10 bg-gradient-to-br from-gray-100 via-white to-gray-200">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
              <div className="text-sm text-slate-500 dark:text-slate-400">Secure sign in</div>
            </div>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Enter your credentials to access the AI Planet.</p>

            <div className="mt-6">
              <LoginForm />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {/* Sign up removed as requested */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
