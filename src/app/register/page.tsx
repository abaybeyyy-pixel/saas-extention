'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '', // Used as email prefix or metadata if needed, but schema uses email
        email: '',
        whatsapp: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(data.error || 'Registration failed');
            }
        } catch (err) {
            setStatus('error');
            setErrorMessage('Connection error. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-slate-900 p-8 text-white text-center">
                    <div className="mb-4 inline-flex p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">Join Leadify</h1>
                    <p className="text-slate-300 mt-2 text-sm">Daftar sekarang untuk akses Leadify Pro</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {status === 'success' ? (
                        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Pendaftaran Berhasil!</h3>
                            <p className="text-slate-600">Terima kasih telah mendaftar. Admin kami akan memverifikasi data Anda.</p>
                            <div className="bg-slate-50 text-slate-700 p-4 rounded-xl text-sm mt-4 border border-slate-200 text-left">
                                <strong className="block mb-1 text-slate-900">Apa selanjutnya?</strong>
                                Kunci lisensi (License Key) akan dikirimkan langsung ke WhatsApp Anda (<span className="font-mono bg-white px-1 rounded border border-slate-200">{formData.whatsapp}</span>) setelah disetujui.
                            </div>
                            <Link href="/" className="block w-full py-3 bg-slate-900 text-white rounded-xl font-semibold mt-6 hover:bg-slate-800 transition">
                                Kembali ke Beranda
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Contoh: Budi Santoso"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Alamat Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="nama@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Nomor WhatsApp</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none text-sm"></span>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="081234567890"
                                        value={formData.whatsapp}
                                        onChange={e => {
                                            // Allow only numbers
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormData({ ...formData, whatsapp: val });
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">*Pastikan nomor aktif untuk menerima lisensi.</p>
                            </div>

                            {status === 'error' && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                                    <AlertCircle size={16} />
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    'Daftar Sekarang'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
