'use client';

import { useState, useEffect, useCallback } from 'react';
import { PLAN_CONFIG, PlanType } from '@/lib/license';

interface License {
    id: string;
    license_key: string;
    email: string;
    plan: PlanType;
    device_limit: number;
    expires_at: string;
    is_active: boolean;
    created_at: string;
    sessions?: {
        id: string;
        device_fingerprint: string;
        last_heartbeat: string;
        ip_address: string | null;
    }[];
}

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [secret, setSecret] = useState('');
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newPlan, setNewPlan] = useState<PlanType>('PRO');
    const [creating, setCreating] = useState(false);

    // Fetch licenses
    const fetchLicenses = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/licenses', { credentials: 'include' });
            if (res.status === 401) {
                setIsAuthenticated(false);
                return;
            }
            const data = await res.json();
            if (data.success) {
                setLicenses(data.licenses);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        }
    }, []);

    // Auto-refresh every 30s
    useEffect(() => {
        if (isAuthenticated) {
            fetchLicenses();
            const interval = setInterval(fetchLicenses, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchLicenses]);

    // Login handler
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret }),
                credentials: 'include'
            });
            const data = await res.json();

            if (data.success) {
                setIsAuthenticated(true);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    // Create license
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const res = await fetch('/api/admin/licenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, plan: newPlan }),
                credentials: 'include'
            });
            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                setNewEmail('');
                fetchLicenses();
            } else {
                alert(data.error || 'Failed to create license');
            }
        } catch {
            alert('Connection error');
        } finally {
            setCreating(false);
        }
    };

    // Revoke license
    const handleRevoke = async (id: string, email: string) => {
        if (!confirm(`Revoke license for ${email}? This will immediately log out all devices.`)) return;

        try {
            const res = await fetch(`/api/admin/licenses?id=${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) fetchLicenses();
        } catch {
            alert('Failed to revoke');
        }
    };

    // Force logout session
    const handleForceLogout = async (sessionId: string) => {
        if (!confirm('Force logout this device?')) return;

        try {
            const res = await fetch(`/api/admin/sessions?id=${sessionId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) fetchLicenses();
        } catch {
            alert('Failed to logout');
        }
    };

    // Copy license key
    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        alert('License key copied!');
    };

    // Format date
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Check if license is expired
    const isExpired = (date: string) => new Date(date) < new Date();

    // Login Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="text-center mb-8">
                        <div className="inline-flex p-3 rounded-xl bg-blue-50 text-blue-600 mb-4 text-2xl">🔐</div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Access</h1>
                        <p className="text-slate-500 text-sm">Please authenticate to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Admin Secret
                            </label>
                            <input
                                type="password"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                placeholder="Enter secret key..."
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition disabled:opacity-50 shadow-lg shadow-slate-900/10"
                        >
                            {loading ? 'Verifying...' : 'Login to Dashboard'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Dashboard
    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">License Dashboard</h1>
                        <p className="text-slate-500 text-sm">Overview of all active and inactive licenses</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition flex items-center gap-2 text-sm"
                    >
                        <span>✨</span> New License
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Licenses"
                        value={licenses.length}
                        icon="📦"
                        bg="bg-white"
                    />
                    <StatCard
                        label="Active Licenses"
                        value={licenses.filter(l => l.is_active && !isExpired(l.expires_at)).length}
                        icon="✅"
                        color="text-emerald-600"
                        bg="bg-white"
                    />
                    <StatCard
                        label="Expired"
                        value={licenses.filter(l => isExpired(l.expires_at)).length}
                        icon="⚠️"
                        color="text-amber-500"
                        bg="bg-white"
                    />
                    <StatCard
                        label="Active Sessions"
                        value={licenses.reduce((sum, l) => sum + (l.sessions?.length || 0), 0)}
                        icon="🔵"
                        color="text-blue-600"
                        bg="bg-white"
                    />
                </div>

                {/* Licenses Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">License Key</th>
                                    <th className="px-6 py-4">Plan</th>
                                    <th className="px-6 py-4">Expiry</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Sessions</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {licenses.map((license) => (
                                    <tr key={license.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{license.email}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">ID: {license.id.slice(0, 8)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => copyKey(license.license_key)}
                                                className="group flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition"
                                            >
                                                <code className="text-xs font-mono text-slate-600 group-hover:text-slate-900">
                                                    {license.license_key.substring(0, 16)}...
                                                </code>
                                                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">📋</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${license.plan === 'AGENCY' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    license.plan === 'PRO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                {license.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`text-sm font-medium ${isExpired(license.expires_at) ? 'text-red-600' : 'text-slate-600'}`}>
                                                {formatDate(license.expires_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {!license.is_active ? (
                                                <Badge color="red">Revoked</Badge>
                                            ) : isExpired(license.expires_at) ? (
                                                <Badge color="amber">Expired</Badge>
                                            ) : (
                                                <Badge color="emerald">Active</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                {license.sessions && license.sessions.length > 0 ? (
                                                    license.sessions.map((session) => (
                                                        <div key={session.id} className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded border border-slate-100 w-fit">
                                                            <span className="text-slate-500">🖥️</span>
                                                            <span className="font-mono text-slate-600" title={session.device_fingerprint}>
                                                                {session.device_fingerprint.substring(4, 12)}
                                                            </span>
                                                            <button
                                                                onClick={() => handleForceLogout(session.id)}
                                                                className="ml-1 text-slate-400 hover:text-red-500 transition"
                                                                title="Force logout"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">No sessions</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {license.is_active && (
                                                <button
                                                    onClick={() => handleRevoke(license.id, license.email)}
                                                    className="text-xs font-medium text-slate-400 hover:text-red-600 transition"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {licenses.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-3">📭</div>
                                <h3 className="text-slate-900 font-medium">No licenses found</h3>
                                <p className="text-slate-500 text-sm mt-1">Get started by creating a new license.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-2xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">New License</h2>
                        <p className="text-slate-500 text-sm mb-6">Create a new license key for a customer.</p>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                    Customer Email
                                </label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="customer@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                    Subscription Plan
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    <PlanOption
                                        value="TRIAL"
                                        selected={newPlan}
                                        onClick={setNewPlan}
                                        label="Trial (1 Day)"
                                        sub="Free • 1 Device"
                                    />
                                    <PlanOption
                                        value="PRO"
                                        selected={newPlan}
                                        onClick={setNewPlan}
                                        label="Pro (30 Days)"
                                        sub="IDR 99k • 1 Device"
                                    />
                                    <PlanOption
                                        value="AGENCY"
                                        selected={newPlan}
                                        onClick={setNewPlan}
                                        label="Agency (1 Year)"
                                        sub="IDR 799k • 3 Devices"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Generate Key'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// UI Components to keep code clean

function StatCard({ label, value, icon, color = 'text-slate-900', bg = 'bg-white' }: { label: string, value: number, icon: string, color?: string, bg?: string }) {
    return (
        <div className={`${bg} p-5 rounded-xl border border-slate-200 shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm font-medium">{label}</span>
                <span className="text-xl">{icon}</span>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
        </div>
    );
}

function Badge({ children, color }: { children: React.ReactNode, color: 'emerald' | 'amber' | 'red' }) {
    const styles = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        red: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[color]}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            {children}
        </span>
    );
}

function PlanOption({ value, selected, onClick, label, sub }: { value: PlanType, selected: PlanType, onClick: (p: PlanType) => void, label: string, sub: string }) {
    return (
        <div
            onClick={() => onClick(value)}
            className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${selected === value
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className={`font-semibold text-sm ${selected === value ? 'text-blue-700' : 'text-slate-700'}`}>{label}</div>
                    <div className="text-xs text-slate-500">{sub}</div>
                </div>
                {selected === value && <div className="text-blue-500">✓</div>}
            </div>
        </div>
    );
}
