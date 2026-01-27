'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-slate-900">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo / Branding */}
        <div className="space-y-4">
          <div className="inline-flex p-4 rounded-xl bg-blue-50 text-blue-600 mb-2 ring-1 ring-blue-100 shadow-sm">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Leadify License Server
          </h1>
          <p className="text-slate-500 text-base font-medium">
            Secure License Management for Administrators
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
          <p className="text-slate-600 mb-6 font-medium">
            This portal is restricted to authorized administrators only.
          </p>

          <Link
            href="/leadifyadmin"
            className="block w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
          >
            Access Dashboard &rarr;
          </Link>
        </div>

        {/* Footer */}
        <div className="text-slate-400 text-xs font-medium">
          &copy; 2026 Saputra Studio. All rights reserved.
          <br />
          <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Operational
          </span>
        </div>
      </div>
    </div>
  );
}
