'use client';

import { useState, useEffect, useCallback } from 'react';
import { PLAN_CONFIG, PlanType } from '@/lib/license';
import {
    CreditCard,
    Users,
    Activity,
    LogOut,
    Ghost,
    Search,
    Plus,
    Trash2,
    Edit2,
    RefreshCcw,
    Monitor,
    ShieldAlert,
    CheckCircle2,
    Globe,
    MoreHorizontal,
    Copy,
    LayoutDashboard
} from 'lucide-react';

interface License {
    id: string;
    license_key: string;
    email: string;
    plan: PlanType;
    device_limit: number;
    expires_at: string;
    is_active: boolean;
    created_at: string;
    sessions?: Session[];
}

interface Session {
    id: string;
    device_fingerprint: string;
    last_heartbeat: string;
    ip_address: string | null;
}

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [secret, setSecret] = useState('');
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingLicense, setEditingLicense] = useState<License | null>(null);
    const [formData, setFormData] = useState({ email: '', plan: 'PRO' as PlanType });
    const [processing, setProcessing] = useState(false);

    // Initial Fetch
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

    useEffect(() => {
        if (isAuthenticated) {
            fetchLicenses();
            const interval = setInterval(fetchLicenses, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchLicenses]);

    // Handlers
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) setIsAuthenticated(true);
            else setError(data.error);
        } catch {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const method = editingLicense ? 'PUT' : 'POST';
        const body = editingLicense
            ? { ...formData, id: editingLicense.id }
            : formData;

        try {
            const res = await fetch('/api/admin/licenses', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include'
            });

            if (res.ok) {
                setShowModal(false);
                setEditingLicense(null);
                setFormData({ email: '', plan: 'PRO' });
                fetchLicenses();
            } else {
                alert('Operation failed');
            }
        } catch {
            alert('Error connecting to server');
        } finally {
            setProcessing(false);
        }
    };

    const handleRevoke = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to REVOKE access for ${email}? User will be logged out immediately.`)) return;
        try {
            await fetch(`/api/admin/licenses?id=${id}`, { method: 'DELETE', credentials: 'include' });
            fetchLicenses();
        } catch { alert('Failed to revoke'); }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to DELETE user ${email}?\nThis action cannot be undone and will remove all history.`)) return;
        try {
            await fetch(`/api/admin/licenses?id=${id}&permanent=true`, { method: 'DELETE', credentials: 'include' });
            fetchLicenses();
        } catch { alert('Failed to delete'); }
    };

    const handleForceLogout = async (sessionId: string) => {
        if (!confirm('Force logout this session?')) return;
        try {
            await fetch(`/api/admin/sessions?id=${sessionId}`, { method: 'DELETE', credentials: 'include' });
            fetchLicenses();
        } catch { alert('Failed'); }
    };

    // Utils
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Can add toast here
    };

    const filteredLicenses = licenses.filter(l =>
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        l.license_key.includes(search)
    );

    const isExpired = (date: string) => new Date(date) < new Date();
    const activeCount = licenses.filter(l => l.is_active && !isExpired(l.expires_at)).length;
    const sessionCount = licenses.reduce((sum, l) => sum + (l.sessions?.length || 0), 0);

    // LOGIN SCREEN
    if (!isAuthenticated) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-900">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-slate-900 rounded-xl text-white">
                        <Ghost size={32} />
                    </div>
                </div>
                <h1 className="text-xl font-bold text-center mb-1">Admin Portal</h1>
                <p className="text-slate-500 text-center text-sm mb-6">Secure access only</p>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="password"
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        placeholder="Secret Key"
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition">
                        {loading ? 'Verifying...' : 'Enter Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );

    // DASHBOARD
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-slate-900 rounded-lg text-white">
                            <LayoutDashboard size={20} />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Leadify Admin</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            System Operational
                        </span>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                        <p className="text-slate-500 text-sm">Manage users, licenses, and active sessions.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search email..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 w-64 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setEditingLicense(null);
                                setFormData({ email: '', plan: 'PRO' });
                                setShowModal(true);
                            }}
                            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                        >
                            <Plus size={16} />
                            Add User
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard title="Total Licenses" value={licenses.length} icon={Users} trend="+12% this month" />
                    <KpiCard title="Active Users" value={activeCount} icon={CheckCircle2} color="text-emerald-600" bgIcon="bg-emerald-50" />
                    <KpiCard title="Live Sessions" value={sessionCount} icon={Activity} color="text-blue-600" bgIcon="bg-blue-50" />
                    <KpiCard title="Expiring Soon" value={licenses.filter(l => isExpired(l.expires_at)).length} icon={ShieldAlert} color="text-amber-500" bgIcon="bg-amber-50" />
                </div>

                {/* Main Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Current Plan</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Live Sessions</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLicenses.map(license => {
                                    const expired = isExpired(license.expires_at);
                                    const active = license.is_active && !expired;

                                    return (
                                        <tr key={license.id} className="group hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                        {license.email.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900 text-sm">{license.email}</div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <code className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {license.license_key.slice(0, 16)}...
                                                            </code>
                                                            <button onClick={() => copyToClipboard(license.license_key)} className="text-slate-300 hover:text-blue-500 transition">
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${license.plan === 'AGENCY' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    license.plan === 'PRO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {license.plan}
                                                </span>
                                                <div className="text-[10px] text-slate-400 mt-1">
                                                    Expires {new Date(license.expires_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {active ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit border border-emerald-100">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active
                                                    </div>
                                                ) : (
                                                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit border ${!license.is_active ? 'text-red-600 bg-red-50 border-red-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                                                        }`}>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                                        {!license.is_active ? 'Revoked' : 'Expired'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    {license.sessions?.map(session => (
                                                        <div key={session.id} className="flex items-center justify-between bg-white border border-slate-200 p-1.5 rounded-lg text-xs shadow-sm max-w-[180px]">
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <Monitor size={12} />
                                                                <span className="truncate max-w-[80px]" title={session.device_fingerprint}>
                                                                    {session.device_fingerprint.replace('DEV-', '')}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleForceLogout(session.id)}
                                                                className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition"
                                                                title="Kick Session"
                                                            >
                                                                <LogOut size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {!license.sessions?.length && <span className="text-slate-400 text-xs italic">Offline</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingLicense(license);
                                                            setFormData({ email: license.email, plan: license.plan });
                                                            setShowModal(true);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {active ? (
                                                        <button
                                                            onClick={() => handleRevoke(license.id, license.email)}
                                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                            title="Revoke Access (Soft Delete)"
                                                        >
                                                            <ShieldAlert size={16} />
                                                        </button>
                                                    ) : (
                                                        <div className="w-8"></div>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(license.id, license.email)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete Permanently"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredLicenses.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No users found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingLicense ? 'Edit Subscription' : 'New Subscription'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <Trash2 size={20} className="rotate-45" /> {/* Use X icon if imported, reusing trash for close visual fallback or implement X */}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Select Plan</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(PLAN_CONFIG).map(([key, config]) => (
                                        <div
                                            key={key}
                                            onClick={() => setFormData({ ...formData, plan: key as PlanType })}
                                            className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${formData.plan === key
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div>
                                                <div className={`font-semibold text-sm ${formData.plan === key ? 'text-blue-700' : 'text-slate-700'}`}>{config.name}</div>
                                                <div className="text-xs text-slate-500">{config.duration} Days • {config.deviceLimit} Device</div>
                                            </div>
                                            {formData.plan === key && <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><CheckCircle2 size={10} color="white" /></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition">
                                    Cancel
                                </button>
                                <button disabled={processing} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition disabled:opacity-50">
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, trend, color = 'text-slate-900', bgIcon = 'bg-slate-100' }: any) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
                {trend && <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                    <Activity size={12} /> {trend}
                </p>}
            </div>
            <div className={`p-3 rounded-xl ${bgIcon} text-slate-600`}>
                <Icon size={20} className={color.replace('text-', '') !== 'slate-900' ? color : 'text-slate-700'} />
            </div>
        </div>
    );
}
