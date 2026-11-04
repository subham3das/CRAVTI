import { useState, useEffect } from 'react';
import {
  FiHelpCircle,
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiCheckCircle,
  FiSend,
  FiUser,
  FiClock,
  FiAlertTriangle,
  FiFilter,
  FiX,
} from 'react-icons/fi';
import {
  fetchSupportTicketsApi,
  replySupportTicketApi,
  updateSupportTicketStatusApi,
} from '../services/adminService';
import { formatDate, formatDateTime, safeString } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

export const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetchSupportTicketsApi({ status: statusFilter });
      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
        if (selectedTicket) {
          const updated = res.data.tickets.find((t) => t._id === selectedTicket._id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
      toast.error('Could not load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setSendingReply(true);
      const res = await replySupportTicketApi(selectedTicket._id, { message: replyText });
      if (res.success && res.data) {
        toast.success('Reply submitted to restaurant');
        setReplyText('');
        loadTickets();
      }
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;
    try {
      const res = await updateSupportTicketStatusApi(selectedTicket._id, { status });
      if (res.success) {
        toast.success(`Ticket marked as ${status}`);
        loadTickets();
      }
    } catch {
      toast.error('Failed to update ticket status');
    }
  };

  const PRIORITY_BADGES = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const STATUS_BADGES = {
    open: 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Support Ticket Escalation Center
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review restaurant partner bug reports, QR assistance, billing disputes, and technical tickets
        </p>
      </div>

      {/* Ticket List and Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3 flex flex-col h-[650px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
              Tickets ({tickets.length})
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <TableSkeleton rows={4} cols={1} />
            ) : tickets.length === 0 ? (
              <EmptyState title="No tickets" description="No support tickets found." />
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?._id === t._id;
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold text-blue-600">{t.ticketNumber}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${PRIORITY_BADGES[t.priority] || ''}`}>
                        {t.priority}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{t.subject}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.restaurantId?.restaurantName || 'Tenant'}</p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="capitalize">{t.category}</span>
                      <span className={`px-1.5 py-0.2 rounded-full border font-bold uppercase ${STATUS_BADGES[t.status] || ''}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col h-[650px]">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Ticket Top Header */}
              <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{selectedTicket.ticketNumber}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${STATUS_BADGES[selectedTicket.status] || ''}`}>
                      {selectedTicket.status}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${PRIORITY_BADGES[selectedTicket.priority] || ''}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-[#0F172A] mt-1">{selectedTicket.subject}</h3>
                  <span className="text-xs text-slate-400">
                    Raised by <strong>{selectedTicket.restaurantId?.restaurantName}</strong> ({selectedTicket.restaurantId?.ownerName})
                  </span>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-1.5">
                  {selectedTicket.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('resolved')}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all"
                    >
                      Resolve Ticket
                    </button>
                  )}
                  {selectedTicket.status !== 'closed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('closed')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Close Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {Array.isArray(selectedTicket.messages) &&
                  selectedTicket.messages.map((msg, i) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div
                        key={i}
                        className={`p-3.5 rounded-2xl max-w-lg text-xs space-y-1 ${
                          isAdmin
                            ? 'ml-auto bg-blue-600 text-white rounded-br-none shadow-xs'
                            : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-80">
                          <span className="font-bold">{msg.senderName || (isAdmin ? 'Craviti Support' : 'Tenant')}</span>
                          <span>{formatTimeSafe(msg.createdAt)}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    );
                  })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an official administrative reply to restaurant..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  Reply
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <FiHelpCircle className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold">Select a ticket from the left panel to inspect and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatTimeSafe(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
