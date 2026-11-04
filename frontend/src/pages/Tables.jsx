import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus, FiGrid, FiEdit2, FiTrash2, FiRefreshCw, FiDownload, FiSearch, FiCpu } from 'react-icons/fi';
import { MdQrCode2 } from 'react-icons/md';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Badge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Switch } from '../components/Switch';
import QRPreviewModal from '../components/QRPreviewModal';
import BulkTableModal from '../components/BulkTableModal';
import {
  fetchTablesApi,
  fetchTableStatsApi,
  createTableApi,
  bulkCreateTablesApi,
  updateTableApi,
  deleteTableApi,
  toggleTableActiveApi,
  exportQRZipApi,
} from '../services/tableService';
import { useAuth } from '../context/AuthContext';

const FLOORS = ['Ground Floor', 'First Floor', 'Second Floor', 'Rooftop', 'Basement'];
const STATUS_OPTIONS = ['', 'available', 'occupied', 'reserved', 'disabled'];

const EMPTY_FORM = { tableNumber: '', tableName: '', floor: 'Ground Floor', capacity: 4 };

export const Tables = () => {
  const { restaurant } = useAuth();
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, reserved: 0, qrGenerated: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [floor, setFloor] = useState('');
  const [status, setStatus] = useState('');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, table: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, tableId: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  const limit = 20;

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchTableStatsApi();
      if (res.success) setStats(res.stats);
    } catch { /* silent */ }
  }, []);

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTablesApi({ search, floor, status, page, limit });
      if (res.success) {
        setTables(res.tables);
        setTotal(res.total);
      }
    } catch {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [search, floor, status, page]);

  useEffect(() => { loadTables(); loadStats(); }, [loadTables, loadStats]);

  const openAdd = () => { setFormData(EMPTY_FORM); setFormMode('add'); setEditId(null); setShowForm(true); };
  const openEdit = (t) => {
    setFormData({ tableNumber: t.tableNumber, tableName: t.tableName, floor: t.floor, capacity: t.capacity });
    setFormMode('edit');
    setEditId(t._id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.tableNumber) return toast.error('Table number is required');
    setSaving(true);
    try {
      if (formMode === 'add') {
        await createTableApi(formData);
        toast.success('Table created!');
      } else {
        await updateTableApi(editId, formData);
        toast.success('Table updated!');
      }
      setShowForm(false);
      loadTables();
      loadStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleTableActiveApi(id);
      setTables(prev => prev.map(t => t._id === id ? res.table : t));
      loadStats();
      toast.success('Table status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteTableApi(deleteConfirm.tableId);
      toast.success('Table deleted');
      setDeleteConfirm({ open: false, tableId: null });
      loadTables();
      loadStats();
    } catch {
      toast.error('Failed to delete table');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkCreate = async (opts) => {
    setBulkLoading(true);
    try {
      const res = await bulkCreateTablesApi(opts);
      toast.success(`Created ${res.created} tables${res.skipped > 0 ? `, skipped ${res.skipped} existing` : ''}`);
      setShowBulk(false);
      loadTables();
      loadStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Bulk create failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    setZipLoading(true);
    try {
      await exportQRZipApi();
      toast.success('QR codes downloaded!');
    } catch {
      toast.error('Failed to download QR codes');
    } finally {
      setZipLoading(false);
    }
  };

  const handleQRRegenerated = (updated) => {
    setTables(prev => prev.map(t => t._id === updated._id ? updated : t));
    setQrModal(prev => ({ ...prev, table: updated }));
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tables & QR Management"
        description="Manage dining tables and generate QR codes for customer ordering."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowBulk(true)}>
              <FiCpu size={14} className="mr-1" /> Bulk Generate
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadZip} isLoading={zipLoading}>
              <FiDownload size={14} className="mr-1" /> Download All QRs
            </Button>
            <Button variant="primary" size="sm" onClick={openAdd}>
              <FiPlus size={14} className="mr-1" /> Add Table
            </Button>
          </div>
        }
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Tables', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'Available', value: stats.available, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Occupied', value: stats.occupied, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Reserved', value: stats.reserved, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'QR Generated', value: stats.qrGenerated, color: 'text-[#16A34A]', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-slate-100`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by table number or name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
            />
          </div>
          <select
            value={floor}
            onChange={e => { setFloor(e.target.value); setPage(1); }}
            className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 bg-white"
          >
            <option value="">All Floors</option>
            {FLOORS.map(f => <option key={f}>{f}</option>)}
          </select>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 bg-white"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table List */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Loader /></div>
        ) : tables.length === 0 ? (
          <EmptyState
            title="No tables found"
            description="Add your first table or use bulk generate."
            action={<Button variant="primary" onClick={openAdd}><FiPlus size={14} className="mr-1" /> Add Table</Button>}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {['Table #', 'Name', 'Floor', 'Capacity', 'Status', 'Active', 'QR', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4 first:pl-0 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {(Array.isArray(tables) ? tables : []).map(t => (
                    <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 pl-0 font-bold text-[#0F172A]">T{t.tableNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{t.tableName || <span className="text-slate-300">—</span>}</td>
                      <td className="py-3 px-4 text-slate-600">{t.floor}</td>
                      <td className="py-3 px-4 text-slate-600">{t.capacity} pax</td>
                      <td className="py-3 px-4"><StatusBadge status={t.status} size="sm" /></td>
                      <td className="py-3 px-4">
                        <Switch
                          checked={Boolean(t.isActive)}
                          onChange={() => handleToggle(t._id)}
                          size="sm"
                          aria-label={`Toggle table ${t.tableNumber} active state`}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setQrModal({ open: true, table: t })}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-[#16A34A] transition-colors"
                          title="View QR"
                        >
                          <MdQrCode2 size={18} />
                        </button>
                      </td>
                      <td className="py-3 px-4 pr-0">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><FiEdit2 size={14} /></button>
                          <button onClick={() => setDeleteConfirm({ open: true, tableId: t._id })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><FiTrash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {(Array.isArray(tables) ? tables : []).map(t => (
                <div key={t._id} className="border border-[#E2E8F0] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-[#16A34A]">T{t.tableNumber}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F172A] text-sm">{t.tableName || `Table ${t.tableNumber}`}</p>
                        <p className="text-xs text-slate-400">{t.floor} · {t.capacity} pax</p>
                      </div>
                    </div>
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E2E8F0]">
                    <button onClick={() => setQrModal({ open: true, table: t })} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-slate-600 hover:border-[#16A34A] hover:text-[#16A34A] transition-colors">
                      <MdQrCode2 size={14} /> QR Code
                    </button>
                    <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                      <FiEdit2 size={13} /> Edit
                    </button>
                    <button onClick={() => handleToggle(t._id)} className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${t.isActive ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-[#16A34A]'}`}>
                      {t.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => setDeleteConfirm({ open: true, tableId: t._id })} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0] mt-4">
                <p className="text-xs text-slate-500">Showing {tables.length} of {total} tables</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A]">{formMode === 'add' ? 'Add Table' : 'Edit Table'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Table Number *</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.tableNumber}
                    onChange={e => setFormData(p => ({ ...p, tableNumber: parseInt(e.target.value) || '' }))}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                    required
                    disabled={formMode === 'edit'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.capacity}
                    onChange={e => setFormData(p => ({ ...p, capacity: parseInt(e.target.value) || 4 }))}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Table Name (optional)</label>
                <input
                  type="text"
                  value={formData.tableName}
                  onChange={e => setFormData(p => ({ ...p, tableName: e.target.value }))}
                  placeholder="e.g. Window Seat"
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Floor</label>
                <select
                  value={formData.floor}
                  onChange={e => setFormData(p => ({ ...p, floor: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 bg-white"
                >
                  {FLOORS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={saving}>
                  {formMode === 'add' ? 'Create Table' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal.open && qrModal.table && (
        <QRPreviewModal
          isOpen={qrModal.open}
          onClose={() => setQrModal({ open: false, table: null })}
          table={qrModal.table}
          restaurant={restaurant}
          onRegenerated={handleQRRegenerated}
        />
      )}

      {/* Bulk Modal */}
      <BulkTableModal
        isOpen={showBulk}
        onClose={() => setShowBulk(false)}
        onConfirm={handleBulkCreate}
        loading={bulkLoading}
        existingCount={stats.total}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, tableId: null })}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        title="Delete Table"
        message="This will permanently delete the table and its QR code. Are you sure?"
        confirmText="Delete Table"
        isDangerous
      />
    </div>
  );
};
