import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { FiDownload, FiCopy, FiSearch } from 'react-icons/fi';
import { MdQrCode2 } from 'react-icons/md';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import QRPreviewModal from '../components/QRPreviewModal';
import { fetchTablesApi, exportQRZipApi } from '../services/tableService';
import { useAuth } from '../context/AuthContext';

export const QRCodes = () => {
  const { restaurant } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qrModal, setQrModal] = useState({ open: false, table: null });
  const [zipLoading, setZipLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTablesApi({ limit: 200, search });
      if (res.success) setTables(res.tables.filter(t => t.qrUrl));
    } catch {
      toast.error('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleCopy = (qrUrl) => {
    navigator.clipboard.writeText(qrUrl).then(() => toast.success('Copied!'));
  };

  const handleDownloadSingle = (table) => {
    const canvas = document.getElementById(`qr-${table._id}`);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    const label = table.tableName ? `${table.tableName}-T${table.tableNumber}` : `Table-${table.tableNumber}`;
    a.download = `${label}-QR.png`;
    a.click();
  };

  const handleQRRegenerated = (updated) => {
    setTables(prev => prev.map(t => t._id === updated._id ? updated : t));
    setQrModal(prev => ({ ...prev, table: updated }));
  };

  const handleDownloadZip = async () => {
    setZipLoading(true);
    try {
      await exportQRZipApi();
      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setZipLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Codes"
        description="View and download QR codes for all your tables."
        actions={
          <Button variant="primary" size="sm" onClick={handleDownloadZip} isLoading={zipLoading}>
            <FiDownload size={14} className="mr-1" /> Download All ZIP
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Search tables..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader /></div>
      ) : tables.length === 0 ? (
        <EmptyState
          title="No QR codes yet"
          description="Add tables first. QR codes are auto-generated for each table."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(Array.isArray(tables) ? tables : []).map(t => {
            const label = t.tableName ? `${t.tableName}` : `Table ${t.tableNumber}`;
            return (
              <div
                key={t._id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setQrModal({ open: true, table: t })}
              >
                {/* Hidden canvas for download */}
                <div className="hidden">
                  <QRCodeCanvas value={t.qrUrl} size={300} id={`qr-${t._id}`} />
                </div>
                {/* Visible QR */}
                <div className="p-2 border border-[#E2E8F0] rounded-lg">
                  <QRCodeCanvas value={t.qrUrl} size={100} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#0F172A] truncate max-w-[120px]">{label}</p>
                  <p className="text-xs text-slate-400">T{t.tableNumber} · {t.floor}</p>
                </div>
                <div className="flex gap-1 w-full" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleDownloadSingle(t)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border border-[#E2E8F0] text-slate-500 hover:border-[#16A34A] hover:text-[#16A34A] transition-colors"
                  >
                    <FiDownload size={12} />
                  </button>
                  <button
                    onClick={() => handleCopy(t.qrUrl)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border border-[#E2E8F0] text-slate-500 hover:border-[#16A34A] hover:text-[#16A34A] transition-colors"
                  >
                    <FiCopy size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {qrModal.open && qrModal.table && (
        <QRPreviewModal
          isOpen={qrModal.open}
          onClose={() => setQrModal({ open: false, table: null })}
          table={qrModal.table}
          restaurant={restaurant}
          onRegenerated={handleQRRegenerated}
        />
      )}
    </div>
  );
};

