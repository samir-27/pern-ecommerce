import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, User, Search, Loader2 } from 'lucide-react';
import api from '@api';

const SuperAdminAuditPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const res = await api.get('/admin/audit-logs');
                setLogs(res.data || []);
            } catch (err) {
                console.error('Error fetching audit logs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white">Platform Security Audit Trail</h1>
                <p className="text-slate-400 text-sm mt-1">
                    Immutable chronological record of administrative actions, brand registrations, and fulfillment events.
                </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Action Event</th>
                                <th className="p-4">Actor</th>
                                <th className="p-4">Target</th>
                                <th className="p-4">Payload Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-800/30">
                                    <td className="p-4 text-slate-400 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono font-bold text-indigo-400">
                                        {log.action}
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {log.user_email || 'System'}
                                    </td>
                                    <td className="p-4 text-slate-400">
                                        {log.target_type} #{log.target_id || 'N/A'}
                                    </td>
                                    <td className="p-4 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminAuditPage;
