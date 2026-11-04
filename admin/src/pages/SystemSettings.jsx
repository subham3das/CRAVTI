import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiSliders, FiShield, FiAlertTriangle, FiMail, FiCreditCard, FiCloud, FiServer } from 'react-icons/fi';
import { fetchSystemSettingsApi, updateSystemSettingsApi } from '../services/adminService';
import { Skeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await fetchSystemSettingsApi();
        if (isMounted && res.success && res.data?.settings) {
          reset(res.data.settings);
        }
      } catch (err) {
        console.error('Failed to load system settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [reset]);

  const onSubmit = async (formData) => {
    try {
      setSaving(true);
      const res = await updateSystemSettingsApi(formData);
      if (res.success) {
        toast.success('Platform system configuration updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Platform Governance & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Global defaults, operational currency, legal policies, gateway API keys, and maintenance controls
        </p>
      </div>

      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* General Platform Branding */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-3">
              General Identity & Localization
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  {...register('platformName', { required: true })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Currency</label>
                <input
                  type="text"
                  {...register('defaultCurrency')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Timezone</label>
                <input
                  type="text"
                  {...register('timezone')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Global GST Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('defaultGst')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Support Email</label>
                <input
                  type="email"
                  {...register('supportEmail')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Support Hotline Phone</label>
                <input
                  type="text"
                  {...register('supportPhone')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Global Thermal Receipt Footer</label>
              <input
                type="text"
                {...register('receiptFooter')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Third Party API Integrations */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-3">
              API Gateways & Notification Keys
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">SMTP Host (SendGrid / Postmark)</label>
                <input
                  type="text"
                  {...register('smtpHost')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">SMS Gateway Provider</label>
                <input
                  type="text"
                  {...register('smsProvider')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cloudinary Cloud Identifier</label>
                <input
                  type="text"
                  {...register('cloudinaryCloudName')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Razorpay Live Key ID</label>
                <input
                  type="text"
                  {...register('razorpayKeyId')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* Legal Policies */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider border-b border-slate-100 pb-3">
              Platform Terms & Privacy Disclaimers
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Privacy Policy Summary</label>
                <textarea
                  {...register('privacyPolicy')}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Merchant Terms & Conditions</label>
                <textarea
                  {...register('terms')}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Maintenance Mode Emergency Switch */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-900 block">Emergency Maintenance Mode</span>
              <p className="text-[11px] text-amber-700">
                When enabled, restaurant dashboard and QR dining will display a platform update screen.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register('maintenanceMode')} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Platform Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
