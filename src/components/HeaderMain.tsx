"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getUser, clearUser } from '@/lib/auth';
import Link from 'next/link';

function HeaderMain() {
  const [open, setOpen] = useState(false); // User menu dropdown
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // read initial user
    setUser(getUser());

    // handle user changes dispatched by auth helpers
    function onUserChanged(e: Event) {
      // CustomEvent.detail will hold the user object or null
      const ce = e as CustomEvent;
      setUser(ce.detail ?? getUser());
    }

    window.addEventListener('ai-planet:user-changed', onUserChanged);
    return () => { window.removeEventListener('ai-planet:user-changed', onUserChanged); };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close user dropdown if clicking outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const navLinks = [
    { href: '/', label: 'Home' },
    //{ href: '/datasets', label: 'Datasets' },
  ];

  return (
    <header className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 shadow-sm sticky top-0 z-50 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
      <div className="max-w-960px mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/AI_Planet.png" alt="AI Planet" width={140} height={44} className="object-contain" />
            <span className="sr-only">AI Planet</span>
          </Link>

          {user ? (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group relative px-1 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 transition-all hover:text-navy dark:hover:text-indigo-400 tracking-wide uppercase"
                >
                  {l.label}
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-navy to-indigo transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}



              {/* User menu */}
              <div className="relative z-50" ref={dropdownRef}>
                <button onClick={() => setOpen((s) => !s)} className="ml-4 px-3 py-2 rounded-md bg-blue-100 dark:bg-slate-700 text-md inline-flex items-center gap-2 hover:bg-blue-200 dark:hover:bg-slate-600 transition-colors">
                  <span className="text-md text-blue-900 dark:text-blue-200 font-medium">{user.name || user.email}</span>
                  <svg className="w-4 h-4 text-blue-900 dark:text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>

                <div className={`absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 transform origin-top-right z-50 ${open ? 'opacity-100 translate-y-0 scale-100 block' : 'opacity-0 -translate-y-2 scale-95 hidden'}`}>
                  <div className="py-2 px-1">
                    <button 
                      onClick={() => { clearUser(); setUser(null); setOpen(false); router.push('/login'); }} 
                      className="w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          ) : null}
        </div>
      </div>

      {/* Mobile menu */}
      {/* Mobile bottom navigation (always visible on small screens) */}
      {user && (
        <nav className="fixed bottom-3 inset-x-4 z-50 md:hidden">
          <div className="backdrop-blur-sm bg-gray-800 dark:bg-gray-900 text-white rounded-2xl shadow-lg flex justify-between px-3 py-3 items-center">
            <Link href="/" className="flex flex-col items-center text-white/90 hover:text-white transition-colors">
              <div className="p-2 rounded-lg hover:bg-gray-700">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9v7a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1v-7z" /></svg>
              </div>
              <span className="text-xs font-bold">Home</span>
            </Link>

            <Link href="/about" className="flex flex-col items-center text-white/90 hover:text-white transition-colors">
              <div className="p-2 rounded-lg hover:bg-gray-700">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /></svg>
              </div>
              <span className="text-xs font-bold">About</span>
            </Link>

            <Link href="/audit/anomaly-detection" className="flex flex-col items-center text-white/90 hover:text-white transition-colors">
              <div className="p-2 rounded-lg hover:bg-gray-700">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v4H3zM3 10h18v11H3z" /></svg>
              </div>
              <span className="text-xs font-bold">Audit</span>
            </Link>

            <button
              onClick={() => { clearUser(); setUser(null); router.push('/login'); }}
              className="flex flex-col items-center text-white/90 hover:text-white transition-colors"
            >
              <div className="p-2 rounded-lg hover:bg-gray-700">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
              </div>
              <span className="text-xs font-bold">Logout</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

export default HeaderMain;