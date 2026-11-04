import { useState, useEffect } from 'react';
import {
  FiBell,
  FiPlus,
  FiSend,
  FiCalendar,
  FiUsers,
  FiFilter,
  FiCheckCircle,
  FiAlertTriangle,
  FiArchive,
} from 'react-icons/fi';
import { fetchAnnouncementsApi, createAnnouncementApi, updateAnnouncementStatusApi } from '../services/adminService';
import { formatDate, safeString } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'platform_update',
    targetAudience: 'everyone',
    targetPlan: 'all',
  });

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetchAnnouncementsApi();
      if (res.success && res.data) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
      toast.error('Could not load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    try {
      setCreating(true);
      const res = await createAnnouncementApi(form);
      if (res.success) {
        toast.success('Announcement broadcasted to all restaurants');
        setShowCreateModal(false);
        setForm({
          title: '',
          message: '',
          type: 'platform_update',
          targetAudience: 'everyone',
          targetPlan: 'all',
        });
        loadAnnouncements();
      }
    } catch {
      toast.error('Failed to broadcast announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (id) => {
    try {
      await updateAnnouncementStatusApi(id, 'archived');
      toast.success('Announcement archived');
      loadAnnouncements();
    } catch {
      toast.error('Could not archive announcement');
    }
  };

  const TYPE_BADGES = {
    platform_update: 'bg-blue-50 text-blue-700 border-blue-200',
    maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
    offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    feature_release: 'bg-purple-50 text-purple-700 border-purple-200',
    emergency: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Platform Announcements & Broadcast Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast platform upgrades, maintenance notifications, and emergency alerts across all tenants
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <FiPlus className="w-3.5 h-3.5" />
          New Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-[#0F172A] border-b border-slate-100 pb-3">
          Broadcast History
        </h2>

        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : announcements.length === 0 ? (
          <EmptyState title="No announcements" description="No platform announcements broadcasted yet." />
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${TYPE_BADGES[ann.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {ann.type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Audience: <strong className="text-slate-700 capitalize">{ann.targetAudience}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {formatDate(ann.publishedAt || ann.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">{ann.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{ann.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      ann.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {ann.status}
                  </span>
                  {ann.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => handleArchive(ann._id)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-[#0F172A]">Broadcast Platform Announcement</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Announcement Headline</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Scheduled Infrastructure Maintenance Window"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Announcement Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="platform_update">Platform Update</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="offer">Special Offer</option>
                    <option value="feature_release">Feature Release</option>
                    <option value="emergency">Emergency Notice</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Target Audience</label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="everyone">All Restaurants</option>
                    <option value="specific_plan">Specific SaaS Plan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Broadcast Message Content</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Enter full announcement details visible on all restaurant operator dashboards..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  {creating ? 'Broadcasting...' : 'Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

