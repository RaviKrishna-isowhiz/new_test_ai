"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import logger from '@/lib/logger';
import { authenticate } from '@/lib/auth';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate() {
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return false;
    }
    const re = /^\S+@\S+\.\S+$/;
    if (!re.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError(null);
    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);

    logger.debug('Starting login submit', { email });

    // Mock submit delay
    await new Promise((r) => setTimeout(r, 700));

    const result = authenticate(email, password);
    if (!result.success) {
      setError('Invalid credentials.');
      logger.warn('Login failed: invalid credentials', { email });
      setLoading(false);
      return;
    }

    // success
    logger.info('Login successful', { email });
    setLoading(false);
    router.push('/');
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transform transition-all duration-500 hover:scale-[1.01]">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Demo credentials box moved here */}
        <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-700 dark:text-slate-200">
          <div className="font-medium">Demo credentials</div>
          <div className="mt-1">Email: <span className="font-mono">demouser@aiplanet.ai</span></div>
          <div>Password: <span className="font-mono">Pass1234</span></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Your password"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy to-indigo hover:from-indigo hover:to-navy text-white px-4 py-3 text-sm font-bold tracking-wide uppercase transition-all duration-300 disabled:opacity-60 shadow-lg shadow-indigo-500/25"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="flex items-center justify-center gap-3">
          {/* <span className="h-px w-14 bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-500 dark:text-slate-400">or continue with</span>
          <span className="h-px w-14 bg-slate-200 dark:bg-slate-700" /> */}
        </div>

        {/* <div className="flex gap-3">
          <button type="button" className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M22 12.07c0-.6-.05-1.18-.15-1.74H12v3.3h5.72c-.25 1.35-.99 2.49-2.1 3.25v2.7h3.4c1.99-1.84 3.13-4.54 3.13-7.51z" fill="#4285F4"/><path d="M12 23c2.7 0 4.97-.9 6.64-2.44l-3.4-2.7c-.95.64-2.18 1.02-3.24 1.02-2.49 0-4.6-1.68-5.35-3.95H3.08v2.48C4.79 20.87 8.13 23 12 23z" fill="#34A853"/><path d="M6.65 13.93A7.01 7.01 0 016 12c0-.67.1-1.32.32-1.93V7.6H3.08A11 11 0 002 12c0 1.68.4 3.27 1.08 4.69l3.57-2.76z" fill="#FBBC05"/><path d="M12 5.3c1.47 0 2.8.5 3.85 1.5l2.9-2.9C16.96 2.3 14.7 1 12 1 8.13 1 4.79 3.13 3.08 6.12l3.57 2.48C7.4 7.04 9.51 5.3 12 5.3z" fill="#EA4335"/></svg>
            <span className="text-sm">Google</span>
          </button>
          <button type="button" className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#000"/></svg>
            <span className="text-sm">GitHub</span>
          </button>
        </div> */}
      </div>
    </form>
  );
}
