'use client';

import Link from 'next/link';
import { Lock, UserPlus } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-slate-900">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo / Branding */}
        <div className="space-y-4">
          <div className="inline-flex p-4 rounded-xl bg-slate-50 text-slate-900 mb-2 ring-1 ring-slate-100 shadow-sm">
            <Lock size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Leadify License Server
          </h1>
          <p className="text-slate-500 text-base font-medium">
            Secure License Management for Administrators
          </p>
        </div>

        {/* Action Cards */}
        <div className="flex justify-center w-full">
          {/* User Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 flex flex-col items-center justify-between hover:border-slate-900 transition-all group max-w-sm w-full">
            <div className="text-center">
              <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto mb-6 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:scale-110">
                <UserPlus size={32} />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3">Daftar Leadify</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Daftar sekarang untuk mendapatkan akses Leadify Pro dan dapatkan License Key melalui WhatsApp.
              </p>
            </div>
            <Link
              href="/register"
              className="w-full py-4 text-center bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98]"
            >
              Mulai Sekarang
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
