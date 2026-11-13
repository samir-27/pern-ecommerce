import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/services/Axios';

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
      <div className="h-[60vh] flex items-center justify-center font-ui text-[#EDEDED]">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui text-[#EDEDED]">
      <div className="pb-4 border-b border-[#202028]">
        <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
          Platform Security
        </span>
        <h1 className="font-editorial text-3xl font-light text-white">Immutable Audit Trail</h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          Chronological record of administrative events, atelier verifications, and fulfillment logs.
        </p>
      </div>

      <div className="bg-[#121217] border border-[#202028] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#202028] bg-[#0E0E12] text-[#71717A] uppercase text-[10px] font-semibold tracking-fashion">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Operator Actor</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Payload Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E26]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#71717A] italic">
                    No security events recorded in the current session.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#16161D] transition-colors">
                    <td className="p-4 text-[#71717A] font-tabular whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 font-tabular font-semibold text-white">
                      {log.action}
                    </td>
                    <td className="p-4 text-[#A1A1AA] font-tabular">
                      {log.actor_email || log.user_email || 'System'}
                    </td>
                    <td className="p-4 text-white font-tabular">
                      {log.target_type} #{log.target_id}
                    </td>
                    <td className="p-4 text-[11px] text-[#71717A] font-tabular max-w-xs truncate">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || log.metadata || '—')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAuditPage;
