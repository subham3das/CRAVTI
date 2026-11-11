import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Loader } from './Loader';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiUploadCloud,
  FiFileText,
  FiTrash2,
  FiEye,
  FiDownload,
  FiShield,
  FiLock,
  FiRefreshCw,
  FiCheck,
  FiXCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  fetchBankDetailsApi,
  saveBankDetailsDraftApi,
  submitBankDetailsApi,
  uploadBankDocApi,
} from '../services/bankDetailsService';

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const SettlementSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const [bankData, setBankData] = useState({
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    maskedAccountNumber: '',
    ifscCode: '',
    accountType: 'Current',
    upiId: '',
    canceledCheque: null,
    passbook: null,
    panCard: null,
    businessProof: null,
    status: 'draft',
    isEditable: true,
    version: 1,
    rejectionReason: '',
    changeRequestReason: '',
    approvedByName: '',
    approvedAt: null,
    submittedAt: null,
  });

  const [uploadingDoc, setUploadingDoc] = useState({
    canceledCheque: false,
    passbook: false,
    panCard: false,
    businessProof: false,
  });

  const [uploadProgress, setUploadProgress] = useState({
    canceledCheque: 0,
    passbook: 0,
    panCard: 0,
    businessProof: 0,
  });

  const loadBankDetails = async () => {
    try {
      setLoading(true);
      const res = await fetchBankDetailsApi();
      if (res.success && res.data) {
        const d = res.data;
        setBankData({
          accountHolderName: d.accountHolderName || '',
          bankName: d.bankName || '',
          branchName: d.branchName || '',
          accountNumber: '',
          confirmAccountNumber: '',
          maskedAccountNumber: d.maskedAccountNumber || '',
          ifscCode: d.ifscCode || '',
          accountType: d.accountType || 'Current',
          upiId: d.upiId || '',
          canceledCheque: d.canceledCheque?.url ? d.canceledCheque : null,
          passbook: d.passbook?.url ? d.passbook : null,
          panCard: d.panCard?.url ? d.panCard : null,
          businessProof: d.businessProof?.url ? d.businessProof : null,
          status: d.status || 'draft',
          isEditable: Boolean(d.isEditable),
          version: d.version || 1,
          rejectionReason: d.rejectionReason || '',
          changeRequestReason: d.changeRequestReason || '',
          approvedByName: d.approvedByName || '',
          approvedAt: d.approvedAt || null,
          submittedAt: d.submittedAt || null,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bank settlement details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankDetails();
  }, []);

  const handleInputChange = (field, value) => {
    if (!bankData.isEditable) return;
    setBankData((prev) => ({
      ...prev,
      [field]: field === 'ifscCode' ? value.toUpperCase() : value,
    }));
  };

  const handleFileUpload = async (key, file) => {
    if (!bankData.isEditable) return;
    if (!file) return;

    // Check size max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, WEBP and PDF documents are allowed');
      return;
    }

    try {
      setUploadingDoc((prev) => ({ ...prev, [key]: true }));
      setUploadProgress((prev) => ({ ...prev, [key]: 10 }));

      const res = await uploadBankDocApi(file, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress((prev) => ({ ...prev, [key]: percent }));
      });

      if (res.success && res.data) {
        setBankData((prev) => ({
          ...prev,
          [key]: res.data,
        }));
        toast.success(`Document uploaded successfully`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc((prev) => ({ ...prev, [key]: false }));
      setUploadProgress((prev) => ({ ...prev, [key]: 0 }));
    }
  };

  const handleRemoveDoc = (key) => {
    if (!bankData.isEditable) return;
    setBankData((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const handleSaveDraft = async () => {
    if (!bankData.isEditable) return;
    try {
      setSaving(true);
      const payload = {
        accountHolderName: bankData.accountHolderName,
        bankName: bankData.bankName,
        branchName: bankData.branchName,
        ifscCode: bankData.ifscCode,
        accountType: bankData.accountType,
        upiId: bankData.upiId,
        canceledCheque: bankData.canceledCheque,
        passbook: bankData.passbook,
        panCard: bankData.panCard,
        businessProof: bankData.businessProof,
      };

      if (bankData.accountNumber) {
        payload.accountNumber = bankData.accountNumber;
      }

      const res = await saveBankDetailsDraftApi(payload);
      if (res.success) {
        toast.success('Draft saved successfully');
        loadBankDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!bankData.isEditable) return;

    // Frontend validations
    if (!(bankData.accountHolderName ?? '').toString().trim()) {
      toast.error('Account holder name is required');
      return;
    }
    if (!(bankData.bankName ?? '').toString().trim()) {
      toast.error('Bank name is required');
      return;
    }
    if (!bankData.maskedAccountNumber && !bankData.accountNumber) {
      toast.error('Account number is required');
      return;
    }
    if (bankData.accountNumber && bankData.accountNumber !== bankData.confirmAccountNumber) {
      toast.error('Account numbers do not match');
      return;
    }
    if (!bankData.ifscCode || !IFSC_REGEX.test(bankData.ifscCode)) {
      toast.error('Please enter a valid 11-digit IFSC code (e.g. SBIN0001248)');
      return;
    }
    if (!bankData.canceledCheque && !bankData.passbook) {
      toast.error('Please upload either a Cancelled Cheque or Bank Passbook copy');
      return;
    }
    if (!bankData.panCard && !bankData.businessProof) {
      toast.error('Please upload either a PAN Card or Business Registration Proof');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        accountHolderName: bankData.accountHolderName,
        bankName: bankData.bankName,
        branchName: bankData.branchName,
        accountNumber: bankData.accountNumber,
        confirmAccountNumber: bankData.confirmAccountNumber,
        ifscCode: bankData.ifscCode,
        accountType: bankData.accountType,
        upiId: bankData.upiId,
        canceledCheque: bankData.canceledCheque,
        passbook: bankData.passbook,
        panCard: bankData.panCard,
        businessProof: bankData.businessProof,
      };

      const res = await submitBankDetailsApi(payload);
      if (res.success) {
        toast.success('Bank details submitted for verification!');
        loadBankDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit bank verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card title="Settlement & Bank Details">
        <div className="py-12 flex justify-center">
          <Loader />
        </div>
      </Card>
    );
  }

  const isLocked = !bankData.isEditable;
  const isApproved = bankData.status === 'approved';
  const isSubmitted = bankData.status === 'submitted' || bankData.status === 'under_review';
  const isChangesRequested = bankData.status === 'changes_requested';
  const isRejected = bankData.status === 'rejected';

  return (
    <div className="space-y-6">
      {/* Status Alert Banner */}
      {isApproved && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Settlement Account Verified & Active</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Your registered bank account is actively verified. Daily online order payouts are settled automatically to{' '}
              <strong className="font-mono">{bankData.maskedAccountNumber || 'registered account'}</strong>.
            </p>
            {bankData.approvedByName && (
              <p className="text-[11px] text-emerald-600 mt-1">
                Verified by {bankData.approvedByName} on{' '}
                {bankData.approvedAt ? new Date(bankData.approvedAt).toLocaleDateString() : 'recent'}
              </p>
            )}
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <FiClock className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">Verification Under Review (v{bankData.version})</h4>
            <p className="text-xs text-blue-700 mt-0.5">
              Your bank details and legal documents have been submitted to the Craviti Compliance Team. All fields are
              temporarily locked until review completes.
            </p>
            {bankData.submittedAt && (
              <p className="text-[11px] text-blue-600 mt-1">
                Submitted on {new Date(bankData.submittedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {isChangesRequested && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">Revision Required by Compliance</h4>
            <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
              <strong>Admin Note:</strong> {bankData.changeRequestReason || 'Please review your uploaded documents and IFSC code.'}
            </div>
            <p className="text-xs text-amber-700">
              Please correct the fields below and click <strong>Resubmit Bank Details</strong> to resume verification.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <FiXCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900">Bank Verification Rejected</h4>
            <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-xs text-rose-900 font-medium">
              <strong>Reason:</strong> {bankData.rejectionReason || 'Documents or bank information did not meet compliance criteria.'}
            </div>
            <p className="text-xs text-rose-700">
              Please update your account credentials or upload clearer legal proofs before resubmitting.
            </p>
          </div>
        </div>
      )}

      {/* Main Bank Details Card */}
      <Card
        title="Settlement & Bank Details"
        subtitle="Manage your primary business bank account for daily automated payouts"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Holder Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Holder Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bankData.accountHolderName}
                onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                placeholder="Full name as printed on bank passbook"
                disabled={isLocked}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#16A34A] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bankData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                placeholder="e.g. State Bank of India, HDFC Bank"
                disabled={isLocked}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#16A34A] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {/* Branch Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
              <input
                type="text"
                value={bankData.branchName}
                onChange={(e) => handleInputChange('branchName', e.target.value)}
                placeholder="e.g. MG Road Branch"
                disabled={isLocked}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#16A34A] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={bankData.accountType}
                onChange={(e) => handleInputChange('accountType', e.target.value)}
                disabled={isLocked}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#16A34A] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="Current">Current Account (Recommended for Business)</option>
                <option value="Savings">Savings Account</option>
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Number <span className="text-rose-500">*</span>
              </label>
              {isLocked ? (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-700">
                  {bankData.maskedAccountNumber || '•••• •••• ••••'}
                </div>
              ) : (
                <input
                  type="password"
                  value={bankData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder={bankData.maskedAccountNumber ? `Leave blank to keep (${bankData.maskedAccountNumber})` : 'Enter account number'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-[#16A34A] focus:border-transparent"
                />
              )}
            </div>

            {/* Confirm Account Number */}
            {!isLocked && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankData.confirmAccountNumber}
                  onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value)}
                  placeholder="Re-enter bank account number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-[#16A34A] focus:border-transparent"
                />
              </div>
            )}

            {/* IFSC Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                IFSC Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={11}
                value={bankData.ifscCode}
                onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                placeholder="e.g. SBIN0001248"
                disabled={isLocked}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#16A34A] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 uppercase"
              />
            </div>

            {/* UPI ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business UPI ID <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={bankData.upiId}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                placeholder="e.g. restaurant@upi"
                disabled={isLocked}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-[#16A34A] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 lowercase"
              />
            </div>
          </div>

          {/* Verification Documents Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verification Documents
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload clear image or PDF copies (Max 10MB each). At least one bank proof and one entity proof are mandatory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocUploader
                label="Cancelled Cheque"
                docKey="canceledCheque"
                doc={bankData.canceledCheque}
                uploading={uploadingDoc.canceledCheque}
                progress={uploadProgress.canceledCheque}
                onUpload={(f) => handleFileUpload('canceledCheque', f)}
                onRemove={() => handleRemoveDoc('canceledCheque')}
                onPreview={() => setPreviewDoc(bankData.canceledCheque)}
                isEditable={bankData.isEditable}
                required
              />

              <DocUploader
                label="Bank Passbook / Bank Statement"
                docKey="passbook"
                doc={bankData.passbook}
                uploading={uploadingDoc.passbook}
                progress={uploadProgress.passbook}
                onUpload={(f) => handleFileUpload('passbook', f)}
                onRemove={() => handleRemoveDoc('passbook')}
                onPreview={() => setPreviewDoc(bankData.passbook)}
                isEditable={bankData.isEditable}
              />

              <DocUploader
                label="PAN Card (Entity / Proprietor)"
                docKey="panCard"
                doc={bankData.panCard}
                uploading={uploadingDoc.panCard}
                progress={uploadProgress.panCard}
                onUpload={(f) => handleFileUpload('panCard', f)}
                onRemove={() => handleRemoveDoc('panCard')}
                onPreview={() => setPreviewDoc(bankData.panCard)}
                isEditable={bankData.isEditable}
                required
              />

              <DocUploader
                label="Business Registration Proof (GST / FSSAI)"
                docKey="businessProof"
                doc={bankData.businessProof}
                uploading={uploadingDoc.businessProof}
                progress={uploadProgress.businessProof}
                onUpload={(f) => handleFileUpload('businessProof', f)}
                onRemove={() => handleRemoveDoc('businessProof')}
                onPreview={() => setPreviewDoc(bankData.businessProof)}
                isEditable={bankData.isEditable}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isLocked ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <FiLock className="w-3.5 h-3.5" />
                  <span>Editing locked while application is under verification</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving || submitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                >
                  {saving ? 'Saving Draft...' : 'Save Draft'}
                </button>
              )}
            </div>

            {bankData.isEditable && (
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white"
              >
                <FiShield className="w-4 h-4 mr-1.5" />
                <span>
                  {isChangesRequested || isRejected ? 'Resubmit Bank Details' : 'Submit for Verification'}
                </span>
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{previewDoc.fileName || 'Document Preview'}</h4>
                <p className="text-[10px] text-slate-400">
                  {previewDoc.fileSize ? `${Math.round(previewDoc.fileSize / 1024)} KB` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 text-xs flex items-center gap-1 font-bold"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Open Full</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-50">
              {previewDoc.fileType === 'application/pdf' || previewDoc.url?.endsWith('.pdf') ? (
                <div className="text-center p-8 space-y-3">
                  <FiFileText className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">PDF Document</p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    <FiEye className="w-4 h-4" />
                    <span>View PDF in New Tab</span>
                  </a>
                </div>
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.fileName || 'Preview'}
                  className="max-h-[70vh] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DocUploader = ({
  label,
  docKey,
  doc,
  uploading,
  progress,
  onUpload,
  onRemove,
  onPreview,
  isEditable,
  required,
}) => {
  const fileInputRef = React.useRef(null);

  return (
    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {doc?.url && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <FiCheck className="w-3 h-3" /> Attached
          </span>
        )}
      </div>

      {doc?.url ? (
        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
              <FiFileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{doc.fileName || label}</p>
              <p className="text-[10px] text-slate-400">
                {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Uploaded Document'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onPreview}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              title="Preview Document"
            >
              <FiEye className="w-4 h-4" />
            </button>
            {isEditable && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                title="Remove Document"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => onUpload(e.target.files?.[0])}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            disabled={!isEditable || uploading}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isEditable || uploading}
            className={`w-full py-5 px-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors ${
              isEditable
                ? 'border-slate-300 hover:border-[#16A34A] hover:bg-emerald-50/20 cursor-pointer'
                : 'border-slate-200 bg-slate-100/50 cursor-not-allowed opacity-60'
            }`}
          >
            {uploading ? (
              <div className="space-y-1 text-center">
                <FiRefreshCw className="w-5 h-5 text-[#16A34A] animate-spin mx-auto" />
                <span className="text-xs font-bold text-slate-600">Uploading {progress}%...</span>
              </div>
            ) : (
              <>
                <FiUploadCloud className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Click to upload document</span>
                <span className="text-[10px] text-slate-400">PDF, JPG, PNG or WEBP (Max 10MB)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SettlementSettings;

