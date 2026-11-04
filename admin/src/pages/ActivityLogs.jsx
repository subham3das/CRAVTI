import { useState, useEffect, useCallback } from 'react';
import { FiActivity, FiFilter, FiUserCheck, FiShield, FiRadio, FiList } from 'react-icons/fi';
import { fetchActivityLogsApi, fetchActivityFeedApi } from '../services/adminService';
import { formatDateTime, formatDate } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

export const ActivityLogs = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [feed, setFeed] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const res = await fetchActivityFeedApi();
      if (res.success && res.data) {
        setFeed(res.data.feed || []);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchActivityLogsApi({
        action: actionFilter,
        page,
        limit: 20,
      });
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    if (activeTab === 'feed') {
      loadFeed();
    } else {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Platform Activity & Live Audit Feed
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time event stream across merchant dining rooms alongside administrative audit logs
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'feed' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FiRadio className="w-3.5 h-3.5" />
            Live Platform Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FiShield className="w-3.5 h-3.5" />
            Admin Audit Logs
          </button>
        </div>
      </div>

      {/* Tab 1: Live Platform Feed */}
      {activeTab === 'feed' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-[#0F172A] border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Platform Stream (Orders, Onboardings, Tickets)
          </h2>

          {loading ? (
            <TableSkeleton rows={6} cols={3} />
          ) : feed.length === 0 ? (
            <EmptyState title="No events recorded" description="No platform activity detected yet." />
          ) : (
            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {feed.map((item, idx) => (
                <div key={idx} className="relative group text-xs">
                  <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{item.title}</span>
                      <p className="text-slate-600 font-medium mt-0.5">{item.description}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">Actor: {item.actor}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {formatDateTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Admin Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F172A]">Administrative Mutations & Access Log</h2>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Logins</option>
              <option value="VERIFY_RESTAURANT">Verifications</option>
              <option value="APPROVE_BANK">Bank Approvals</option>
              <option value="TOGGLE_RESTAURANT_STATUS">Suspensions</option>
            </select>
          </div>

          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState title="No audit logs" description="No audit events matched your filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Admin Email</th>
                    <th className="px-5 py-3.5">Action Code</th>
                    <th className="px-5 py-3.5">Target Entity</th>
                    <th className="px-5 py-3.5">Reason / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-700">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{log.adminEmail}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{log.targetType || 'System'}</td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">{log.reason || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
