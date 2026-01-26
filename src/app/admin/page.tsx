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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-white/20">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">🔐 Leadify Admin</h1>
                        <p className="text-slate-400">License Management System</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Admin Secret
                            </label>
                            <input
                                type="password"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter admin secret..."
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Dashboard
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">📋 License Dashboard</h1>
                        <p className="text-slate-400 text-sm">Manage Leadify licenses & sessions</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-semibold hover:opacity-90 transition flex items-center gap-2"
                    >
                        <span>➕</span> Generate License
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                        <div className="text-3xl font-bold text-white">{licenses.length}</div>
                        <div className="text-slate-400 text-sm">Total Licenses</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                        <div className="text-3xl font-bold text-green-400">
                            {licenses.filter(l => l.is_active && !isExpired(l.expires_at)).length}
                        </div>
                        <div className="text-slate-400 text-sm">Active</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                        <div className="text-3xl font-bold text-yellow-400">
                            {licenses.filter(l => isExpired(l.expires_at)).length}
                        </div>
                        <div className="text-slate-400 text-sm">Expired</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                        <div className="text-3xl font-bold text-blue-400">
                            {licenses.reduce((sum, l) => sum + (l.sessions?.length || 0), 0)}
                        </div>
                        <div className="text-slate-400 text-sm">Active Sessions</div>
                    </div>
                </div>

                {/* Licenses Table */}
                <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr className="text-left text-slate-400 text-sm">
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">License Key</th>
                                    <th className="px-4 py-3">Plan</th>
                                    <th className="px-4 py-3">Expires</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Sessions</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {licenses.map((license) => (
                                    <tr key={license.id} className="text-white hover:bg-white/5">
                                        <td className="px-4 py-3 text-sm">{license.email}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs bg-slate-800 px-2 py-1 rounded font-mono">
                                                    {license.license_key.substring(0, 20)}...
                                                </code>
                                                <button
                                                    onClick={() => copyKey(license.license_key)}
                                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${license.plan === 'AGENCY' ? 'bg-purple-500/20 text-purple-300' :
                                                    license.plan === 'PRO' ? 'bg-blue-500/20 text-blue-300' :
                                                        'bg-slate-500/20 text-slate-300'
                                                }`}>
                                                {license.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {formatDate(license.expires_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {!license.is_active ? (
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-300">
                                                    REVOKED
                                                </span>
                                            ) : isExpired(license.expires_at) ? (
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-300">
                                                    EXPIRED
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-300">
                                                    ACTIVE
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                {license.sessions && license.sessions.length > 0 ? (
                                                    license.sessions.map((session) => (
                                                        <div key={session.id} className="flex items-center gap-2 text-xs">
                                                            <span className="text-slate-400">
                                                                🖥️ {session.device_fingerprint.substring(0, 8)}...
                                                            </span>
                                                            <span className="text-slate-500">
                                                                {session.ip_address}
                                                            </span>
                                                            <button
                                                                onClick={() => handleForceLogout(session.id)}
                                                                className="text-red-400 hover:text-red-300"
                                                                title="Force logout"
                                                            >
                                                                ❌
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-500 text-xs">No active sessions</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {license.is_active && (
                                                <button
                                                    onClick={() => handleRevoke(license.id, license.email)}
                                                    className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30 transition"
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
                            <div className="text-center py-12 text-slate-400">
                                No licenses yet. Click &quot;Generate License&quot; to create one.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
                        <h2 className="text-xl font-bold text-white mb-4">Generate New License</h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Customer Email
                                </label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="customer@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Plan
                                </label>
                                <select
                                    value={newPlan}
                                    onChange={(e) => setNewPlan(e.target.value as PlanType)}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="TRIAL">TRIAL (1 Hari - FREE)</option>
                                    <option value="PRO">PRO (30 Hari - Rp 99.000)</option>
                                    <option value="AGENCY">AGENCY (365 Hari - Rp 799.000)</option>
                                </select>
                                <p className="text-slate-400 text-xs mt-2">
                                    Device limit: {PLAN_CONFIG[newPlan].deviceLimit} device(s)
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-slate-700 rounded-xl text-white hover:bg-slate-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Generate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
