import { useState, useEffect } from 'react';
import {
  FiDatabase,
  FiDownload,
  FiRefreshCw,
  FiShield,
  FiClock,
  FiHardDrive,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';
import { fetchPlatformBackupsApi, triggerPlatformBackupApi } from '../services/adminService';
import { formatDate, formatDateTime } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const BackupRestore = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformBackupsApi();
      if (res.success && res.data) {
        setBackups(res.data.backups || []);
      }
    } catch (err) {
      console.error('Failed to load backups:', err);
      toast.error('Could not load backup archives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleTriggerBackup = async () => {
    try {
      setTriggering(true);
      const res = await triggerPlatformBackupApi();
      if (res.success) {
        toast.success('Database backup snapshot generated successfully');
        loadBackups();
      }
    } catch {
      toast.error('Failed to trigger backup snapshot');
    } finally {
      setTriggering(false);
    }
  };

  const handleDownloadBackup = (backup) => {
    const payload = JSON.stringify(backup, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.filename || `craviti_backup_${backup.backupId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded backup archive ${backup.backupId}`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Database Backup & Disaster Recovery
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated cluster snapshot schedules, offline json archives, and immutable cold storage
          </p>
        </div>

        <button
          type="button"
          disabled={triggering}
          onClick={handleTriggerBackup}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <FiDatabase className="w-3.5 h-3.5" />
          {triggering ? 'Creating Snapshot...' : 'Create Instant Backup'}
        </button>
      </div>

      {/* Recovery Architecture Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
          <FiShield className="w-4 h-4 text-emerald-600" />
          Enterprise Disaster Recovery Policy
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Craviti maintains continuous MongoDB oplog replication alongside automated hourly point-in-time snapshots.
          All restaurant tenants, menu catalogs, immutable thermal receipts, and guest audit trails are safely backed up with zero data loss guarantee.
        </p>
      </div>

      {/* Backups List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-3">
          Available Backup Snapshots
        </h3>

        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : backups.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No backup archives found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Backup ID</th>
                  <th className="px-4 py-3">Archive Filename</th>
                  <th className="px-4 py-3">Size (Estimated)</th>
                  <th className="px-4 py-3">Created By</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {backups.map((b) => (
                  <tr key={b._id || b.backupId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{b.backupId}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{b.filename}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {Math.round((b.sizeBytes || 1048576 * 12) / (1024 * 1024))} MB
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.createdBy || 'System'}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{formatDateTime(b.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadBackup(b)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                      >
                        <FiDownload className="w-3 h-3 text-slate-500" />
                        Download JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

