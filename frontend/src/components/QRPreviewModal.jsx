import { useState, useCallback } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { FiX, FiDownload, FiCopy, FiRefreshCw, FiPrinter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { Button } from './Button';
import { regenerateQRApi } from '../services/tableService';

export default function QRPreviewModal({ isOpen, onClose, table, restaurant, onRegenerated }) {
  const [loading, setLoading] = useState(false);

  const qrUrl = table?.qrUrl || '';
  const label = table?.tableName
    ? `${table.tableName} (T${table.tableNumber})`
    : `Table ${table?.tableNumber}`;

  const handleCopy = useCallback(() => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl).then(() => toast.success('QR link copied!'));
  }, [qrUrl]);

  const handleDownloadPNG = useCallback(() => {
    const canvas = document.getElementById('qr-canvas-download');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.replace(/\s+/g, '-')}-QR.png`;
    a.click();
  }, [label]);

  const handleDownloadSVG = useCallback(() => {
    const svg = document.getElementById('qr-svg-download');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.replace(/\s+/g, '-')}-QR.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [label]);

  const handleRegenerate = useCallback(async () => {
    if (!table?._id) return;
    setLoading(true);
    try {
      const res = await regenerateQRApi(table._id);
      toast.success('QR code regenerated successfully!');
      onRegenerated?.(res.table);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to regenerate QR');
    } finally {
      setLoading(false);
    }
  }, [table, onRegenerated]);

  const handlePrint = useCallback(() => {
    const win = window.open('', '_blank');
    const canvas = document.getElementById('qr-canvas-download');
    const imgData = canvas ? canvas.toDataURL('image/png') : '';
    win.document.write(`
      <html><head><title>QR - ${label}</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { text-align: center; padding: 32px; border: 2px solid #E2E8F0; border-radius: 16px; max-width: 320px; }
        img { width: 240px; height: 240px; }
        h2 { margin: 16px 0 4px; color: #0F172A; font-size: 18px; }
        p { color: #64748B; font-size: 13px; margin: 0; }
        .brand { color: #16A34A; font-weight: 700; font-size: 14px; margin-top: 12px; }
      </style></head><body>
      <div class="card">
        <img src="${imgData}" alt="QR Code"/>
        <h2>${label}</h2>
        <p>${restaurant?.restaurantName || ''}</p>
        <p class="brand">CRAVITI</p>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  }, [label, restaurant]);

  if (!isOpen || !table) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div>
            <h3 className="font-semibold text-[#0F172A]">{label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{restaurant?.restaurantName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <FiX size={18} className="text-slate-500" />
          </button>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center py-6 px-5 gap-4">
          {qrUrl ? (
            <>
              {/* Visible QR */}
              <div className="p-4 border-2 border-[#E2E8F0] rounded-xl">
                <QRCodeCanvas value={qrUrl} size={200} id="qr-canvas-download" />
              </div>
              {/* Hidden SVG for SVG download */}
              <div className="hidden">
                <QRCodeSVG value={qrUrl} size={300} id="qr-svg-download" />
              </div>
              <p className="text-xs text-slate-400 text-center break-all max-w-xs">{qrUrl}</p>
            </>
          ) : (
            <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 text-sm">
              No QR generated
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button size="sm" variant="outline" onClick={handleDownloadPNG} disabled={!qrUrl}>
              <FiDownload size={14} className="mr-1" /> PNG
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadSVG} disabled={!qrUrl}>
              <FiDownload size={14} className="mr-1" /> SVG
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopy} disabled={!qrUrl}>
              <FiCopy size={14} className="mr-1" /> Copy Link
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint} disabled={!qrUrl}>
              <FiPrinter size={14} className="mr-1" /> Print
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={handleRegenerate}
            isLoading={loading}
            disabled={!qrUrl}
          >
            <FiRefreshCw size={14} className="mr-1" /> Regenerate QR
          </Button>
        </div>
      </div>
    </div>
  );
}
