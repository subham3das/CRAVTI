import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPrinter, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { generateReceiptPdf, RECEIPT_TEMPLATES } from '../../utils/receiptGenerator';
import toast from 'react-hot-toast';

export const ThermalReceiptModal = ({ isOpen, onClose, receiptData }) => {
  const [template, setTemplate] = useState(RECEIPT_TEMPLATES.THERMAL_80MM);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !receiptData) return null;

  const rest = receiptData.restaurantSnapshot || {};
  const items = Array.isArray(receiptData.itemsSnapshot) ? receiptData.itemsSnapshot : [];
  const pricing = receiptData.pricingSnapshot || {};

  const handleDownload = () => {
    try {
      setIsGenerating(true);
      generateReceiptPdf(receiptData, { template });
      toast.success('Receipt PDF downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate receipt PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBrowserPrint = () => {
    try {
      setIsGenerating(true);
      const { doc } = generateReceiptPdf(receiptData, { template, autoDownload: false });
      const blobUrl = doc.output('bloburl');
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      } else {
        // Fallback to direct download if popup blocked
        generateReceiptPdf(receiptData, { template });
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not open print preview');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Receipt Preview</h3>
              <p className="text-xs text-slate-500">
                Bill #{receiptData.orderNumber || receiptData.receiptNumber}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTemplate(RECEIPT_TEMPLATES.THERMAL_80MM)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    template === RECEIPT_TEMPLATES.THERMAL_80MM
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80mm Thermal
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate(RECEIPT_TEMPLATES.A4_INVOICE)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    template === RECEIPT_TEMPLATES.A4_INVOICE
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 Standard
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Receipt Body - Thermal Paper Simulation */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 flex justify-center">
            <div className="bg-white w-full max-w-[320px] shadow-md border border-slate-200/80 p-5 rounded-sm font-mono text-[11px] leading-relaxed text-slate-800">
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <div className="text-sm font-extrabold text-slate-900 tracking-wider">
                  {rest.restaurantName || 'RESTAURANT'}
                </div>
                {rest.address?.city && (
                  <div className="text-[10px] text-slate-500">
                    {rest.address.street ? `${rest.address.street}, ` : ''}{rest.address.city}
                  </div>
                )}
                {rest.phone && (
                  <div className="text-[10px] text-slate-500">Ph: {rest.phone}</div>
                )}
                {rest.gstin && (
                  <div className="text-[10px] font-bold text-slate-600 mt-0.5">GSTIN: {rest.gstin}</div>
                )}
              </div>

              {/* Bill Details */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Bill No:</span>
                  <span className="font-bold">#{receiptData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{formatDateTime(receiptData.createdAt || new Date())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type / Table:</span>
                  <span className="font-bold uppercase">
                    {receiptData.tableSnapshot?.tableNumber
                      ? `Table ${receiptData.tableSnapshot.tableNumber}`
                      : 'Walk-in'}
                  </span>
                </div>
                {receiptData.guestSnapshot?.name && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{receiptData.guestSnapshot.name}</span>
                  </div>
                )}
                {receiptData.guestSnapshot?.phone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{receiptData.guestSnapshot.phone}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-2.5 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold pb-1 text-[10px] border-b border-slate-200">
                  <span className="w-1/2">ITEM</span>
                  <span className="w-1/6 text-center">QTY</span>
                  <span className="w-1/3 text-right">AMT</span>
                </div>
                <div className="divide-y divide-slate-100 mt-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-[10px]">
                      <span className="w-1/2 truncate font-medium">{item.itemName || item.name}</span>
                      <span className="w-1/6 text-center">{item.quantity}</span>
                      <span className="w-1/3 text-right font-semibold">
                        {formatCurrency((item.sellingPrice || item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(pricing.subtotal || 0)}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(pricing.discount)}</span>
                  </div>
                )}
                {pricing.gst > 0 && (
                  <div className="flex justify-between">
                    <span>GST (CGST+SGST):</span>
                    <span>{formatCurrency(pricing.gst)}</span>
                  </div>
                )}
                {pricing.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge:</span>
                    <span>{formatCurrency(pricing.serviceCharge)}</span>
                  </div>
                )}
                {pricing.packagingCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Packaging:</span>
                    <span>{formatCurrency(pricing.packagingCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black pt-1.5 border-t border-slate-200 text-slate-900">
                  <span>GRAND TOTAL:</span>
                  <span>{formatCurrency(pricing.grandTotal || 0)}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="py-2 border-b border-dashed border-slate-300 text-[10px] flex justify-between items-center">
                <span>Payment Mode:</span>
                <span className="font-extrabold uppercase bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[9px]">
                  {receiptData.paymentSnapshot?.paymentMethod || receiptData.paymentMethod || 'CASH'}
                </span>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 text-[9px] text-slate-400 space-y-0.5">
                <div>Thank you for dining with us!</div>
                <div>Powered by Craviti POS</div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FiDownload className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button
              type="button"
              onClick={handleBrowserPrint}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <FiPrinter className="w-3.5 h-3.5" /> Print Receipt
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ThermalReceiptModal;
