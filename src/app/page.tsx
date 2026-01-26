'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo / Branding */}
        <div className="space-y-2">
          <div className="inline-block p-4 rounded-full bg-blue-600/20 mb-4 ring-1 ring-blue-500/50">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Leadify License Server
          </h1>
          <p className="text-slate-400 text-lg">
            Secure License Management System for Leadify Extensions
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <p className="text-slate-300 mb-6">
            This is a restricted access portal for administrators only.
          </p>

          <Link
            href="/admin"
            className="block w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
          >
            Access Admin Dashboard &rarr;
          </Link>
        </div>

        {/* Footer */}
        <div className="text-slate-600 text-sm">
          &copy; 2026 Saputra Studio. All rights reserved.
          <br />
          System Status: <span className="text-emerald-500">Target Operational</span>
        </div>
      </div>
    </div>
  );
}
