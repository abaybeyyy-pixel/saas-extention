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

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Admin Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between hover:border-slate-300 transition-all group">
            <div>
              <div className="p-3 bg-slate-100 rounded-xl w-fit mb-4 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <span className="text-xl">🛡️</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Administrator</h3>
              <p className="text-slate-500 text-sm mb-6">
                Access the license management dashboard and system settings.
              </p>
            </div>
            <Link
              href="/leadifyadmin"
              className="block w-full py-3 text-center bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]"
            >
              Admin Login
            </Link>
          </div>

          {/* User Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between hover:border-slate-300 transition-all group">
            <div>
              <div className="p-3 bg-blue-50 rounded-xl w-fit mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <span className="text-xl">🚀</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">New User</h3>
              <p className="text-slate-500 text-sm mb-6">
                Register for a new account and get your license key via WhatsApp.
              </p>
            </div>
            <Link
              href="/register"
              className="block w-full py-3 text-center bg-white border-2 border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-700 rounded-xl font-semibold transition-all active:scale-[0.98]"
            >
              Sign Up Now
            </Link>
          </div>
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
