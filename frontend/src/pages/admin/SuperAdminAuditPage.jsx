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
      <div className="h-[60vh] flex items-center justify-center font-ui text-[#121212]">
        <Loader2 className="animate-spin text-[#121212]" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui text-[#121212]">
      <div className="pb-4 border-b border-[#E8E8E4]">
        <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
          Platform Security
        </span>
        <h1 className="font-editorial text-3xl font-light text-[#121212]">Immutable Audit Trail</h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          Chronological record of administrative events, atelier verifications, and fulfillment logs.
        </p>
      </div>

      <div className="bg-white border border-[#E8E8E4] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8E8E4] bg-[#F4F4F2] text-[#71717A] uppercase text-[10px] font-semibold tracking-loose-caps">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Operator Actor</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Payload Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E4]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#71717A] italic">
                    No security events recorded in the current session.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FBFBFA] transition-colors">
                    <td className="p-4 text-[#71717A] font-tabular whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 font-tabular font-semibold text-[#121212]">
                      {log.action}
                    </td>
                    <td className="p-4 text-[#71717A] font-tabular">
                      {log.actor_email || log.user_email || 'System'}
                    </td>
                    <td className="p-4 text-[#121212] font-tabular">
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
