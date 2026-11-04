import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { useSettings } from '../context/SettingsContext';
import { SettlementSettings } from '../components/SettlementSettings';
import { playOrderChime, setStoredNotificationVolume } from '../utils/soundNotification';
import { formatCurrency } from '../utils/formatters';
import { fetchGatewayStatusApi, testGatewayConnectionApi } from '../services/paymentService';
import {
  FiSettings,
  FiClock,
  FiActivity,
  FiPercent,
  FiCreditCard,
  FiFileText,
  FiBell,
  FiSave,
  FiAlertCircle,
  FiCheck,
  FiVolume2,
  FiInfo,
  FiCheckCircle,
  FiShield,
} from 'react-icons/fi';
import { MdOutlineStorefront } from 'react-icons/md';
import toast from 'react-hot-toast';

const SECTIONS = [
  { key: 'general', label: 'General', icon: MdOutlineStorefront },
  { key: 'settlement', label: 'Settlement & Bank Details', icon: FiShield },
  { key: 'business_hours', label: 'Business Hours', icon: FiClock },
  { key: 'operations', label: 'Operations & Rules', icon: FiActivity },
  { key: 'taxes', label: 'Taxes & Charges', icon: FiPercent },
  { key: 'payments', label: 'Payments', icon: FiCreditCard },
  { key: 'receipt', label: 'Receipt Snapshot', icon: FiFileText },
  { key: 'notifications', label: 'Notifications', icon: FiBell },
];

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, loading, updateSettings } = useSettings();
  const initialTab = searchParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // Form State
  const [formData, setFormData] = useState({
    // General
    restaurantProfile: {
      restaurantName: '',
      phone: '',
      email: '',
      address: { street: '', city: '', state: '', pincode: '', country: 'India' },
      gstNumber: '',
      fssaiNumber: '',
    },
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en',
    // Business Hours
    businessHours: DAYS_OF_WEEK.map((day) => ({
      day,
      isOpen: true,
      openTime: '09:00',
      closeTime: '22:00',
    })),
    // Operations
    restaurantStatus: 'open',
    acceptOrders: true,
    estimatedPreparationTime: 15,
    autoCompleteOrder: true,
    autoLockServedOrder: true,
    // Taxes & Charges
    gstEnabled: true,
    gstPercentage: 5,
    serviceChargeEnabled: false,
    serviceChargeType: 'percentage',
    serviceChargeValue: 0,
    // Payments
    payments: {
      cashEnabled: true,
      onlineEnabled: true,
      razorpay: {
        provider: 'razorpay',
        apiStatus: 'disabled',
        webhookStatus: 'disabled',
        keyId: '',
      },
    },
    // Receipt
    receiptPrefix: 'CRV',
    receiptFooter: 'Thank you for dining with us. Please visit again!',
    // Notifications
    notificationSound: true,
    desktopNotification: true,
    notificationVolume: 80,
  });

  // Keep track of unsaved changes
  const [isDirty, setIsDirty] = useState(false);

  // Gateway status & diagnostics state
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [testingGateway, setTestingGateway] = useState(false);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchGatewayStatusApi()
        .then((res) => {
          if (res?.data) setGatewayStatus(res.data);
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const handleTestGatewayConnection = async () => {
    try {
      setTestingGateway(true);
      const res = await testGatewayConnectionApi();
      if (res?.success) {
        toast.success(res.message || 'Razorpay Gateway is connected and operational!');
        if (res.data) setGatewayStatus(res.data);
      } else {
        toast.error(res?.message || 'Gateway connection test failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect to Razorpay');
    } finally {
      setTestingGateway(false);
    }
  };

  // Sync loaded settings into form
  useEffect(() => {
    if (settings) {
      setFormData({
        restaurantProfile: {
          restaurantName: settings.restaurantProfile?.restaurantName || '',
          phone: settings.restaurantProfile?.phone || '',
          email: settings.restaurantProfile?.email || '',
          address: {
            street: settings.restaurantProfile?.address?.street || '',
            city: settings.restaurantProfile?.address?.city || '',
            state: settings.restaurantProfile?.address?.state || '',
            pincode: settings.restaurantProfile?.address?.pincode || '',
            country: settings.restaurantProfile?.address?.country || 'India',
          },
          gstNumber: settings.restaurantProfile?.gstNumber || '',
          fssaiNumber: settings.restaurantProfile?.fssaiNumber || '',
        },
        currency: settings.currency || 'INR',
        timezone: settings.timezone || 'Asia/Kolkata',
        language: settings.language || 'en',
        businessHours:
          settings.businessHours && settings.businessHours.length
            ? settings.businessHours
            : DAYS_OF_WEEK.map((day) => ({
                day,
                isOpen: true,
                openTime: '09:00',
                closeTime: '22:00',
              })),
        restaurantStatus: settings.restaurantStatus || 'open',
        acceptOrders: settings.acceptOrders !== false,
        estimatedPreparationTime: settings.estimatedPreparationTime || 15,
        autoCompleteOrder: settings.autoCompleteOrder !== false,
        autoLockServedOrder: settings.autoLockServedOrder !== false,
        gstEnabled: settings.gstEnabled !== false,
        gstPercentage: settings.gstPercentage !== undefined ? settings.gstPercentage : 5,
        serviceChargeEnabled: Boolean(settings.serviceChargeEnabled),
        serviceChargeType: settings.serviceChargeType || 'percentage',
        serviceChargeValue: settings.serviceChargeValue || 0,
        payments: {
          cashEnabled: settings.payments?.cashEnabled !== false,
          onlineEnabled: settings.payments?.onlineEnabled !== false,
          razorpay: {
            provider: 'razorpay',
            apiStatus: settings.payments?.razorpay?.apiStatus || 'disabled',
            webhookStatus: settings.payments?.razorpay?.webhookStatus || 'disabled',
            keyId: settings.payments?.razorpay?.keyId || '',
          },
        },
        receiptPrefix: settings.receiptPrefix || 'CRV',
        receiptFooter: settings.receiptFooter || 'Thank you for dining with us. Please visit again!',
        notificationSound: settings.notificationSound !== false,
        desktopNotification: settings.desktopNotification !== false,
        notificationVolume: settings.notificationVolume !== undefined ? settings.notificationVolume : 80,
      });
      setIsDirty(false);
    }
  }, [settings]);

  // Handle generic field change
  const handleChange = (path, value) => {
    setIsDirty(true);
    setFormData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let target = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!target[parts[i]]) target[parts[i]] = {};
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  // Handle business hours schedule toggle/time update
  const handleScheduleChange = (index, field, value) => {
    setIsDirty(true);
    setFormData((prev) => {
      const copy = [...prev.businessHours];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, businessHours: copy };
    });
  };

  // Save Settings
  const handleSave = async () => {
    // Validation: GST
    const gstVal = Number(formData.gstPercentage);
    if (isNaN(gstVal) || gstVal < 0 || gstVal > 100) {
      toast.error('GST percentage must be between 0% and 100%');
      return;
    }

    // Validation: Service Charge
    if (formData.serviceChargeType === 'percentage' && Number(formData.serviceChargeValue) > 100) {
      toast.error('Service charge cannot exceed 100%');
      return;
    }

    // Validation: Receipt Prefix
    if (formData.receiptPrefix.length > 5) {
      toast.error('Receipt prefix cannot exceed 5 characters');
      return;
    }

    // Validation: Business Hours
    for (const item of formData.businessHours) {
      if (item.isOpen && item.openTime >= item.closeTime) {
        toast.error(`On ${item.day}, Opening time must be before closing time`);
        return;
      }
    }

    try {
      setSaving(true);
      await updateSettings(formData);
      setIsDirty(false);
    } catch {
      // Error handled by context toast
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="py-20 flex justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Top Page Header */}
      <PageHeader
        title="Restaurant Settings"
        description="Configure operational rules, business schedule, dynamic taxes, receipt snapshots, and payment options."
        actions={
          activeTab !== 'settlement' && (
            <div className="flex items-center gap-3">
              {isDirty && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full animate-pulse">
                  <FiAlertCircle className="w-3.5 h-3.5" />
                  Unsaved changes
                </span>
              )}
              <Button
                variant="primary"
                size="md"
                leftIcon={FiSave}
                onClick={handleSave}
                isLoading={saving}
              >
                Save Configuration
              </Button>
            </div>
          )
        }
      />

      {/* Unsaved Changes Sticky Notification on Mobile */}
      {isDirty && (
        <div className="sm:hidden bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-amber-800">
          <span className="flex items-center gap-1.5">
            <FiAlertCircle className="w-4 h-4 text-amber-600" />
            Unsaved changes
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 rounded-lg bg-[#16A34A] text-white font-bold text-xs"
          >
            {saving ? 'Saving...' : 'Save Now'}
          </button>
        </div>
      )}

      {/* Responsive Section Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-1 overflow-x-auto scrollbar-none shadow-2xs">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeTab === sec.key;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => handleTabChange(sec.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 0. SETTLEMENT & BANK DETAILS (PHASE 4.1) */}
      {/* ========================================================================= */}
      {activeTab === 'settlement' && <SettlementSettings />}

      {/* ========================================================================= */}
      {/* 1. GENERAL SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card
            title="General Restaurant Information"
            subtitle="Public store profile details displayed on customer menus and receipts"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Restaurant Legal Name
                </label>
                <input
                  type="text"
                  value={formData.restaurantProfile.restaurantName}
                  onChange={(e) => handleChange('restaurantProfile.restaurantName', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  placeholder="e.g. Spice Garden Bistro"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.restaurantProfile.phone}
                  onChange={(e) => handleChange('restaurantProfile.phone', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.restaurantProfile.email}
                  disabled
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Account login email</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  GSTIN / Tax ID
                </label>
                <input
                  type="text"
                  value={formData.restaurantProfile.gstNumber}
                  onChange={(e) => handleChange('restaurantProfile.gstNumber', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  placeholder="24AAAAA0000A1Z5"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.restaurantProfile.address?.street || ''}
                  onChange={(e) => handleChange('restaurantProfile.address.street', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  placeholder="Shop 12, Ground Floor, Central Mall, MG Road"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={formData.restaurantProfile.address?.city || ''}
                  onChange={(e) => handleChange('restaurantProfile.address.city', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  placeholder="Ahmedabad"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={formData.restaurantProfile.address?.state || ''}
                  onChange={(e) => handleChange('restaurantProfile.address.state', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  placeholder="Gujarat"
                />
              </div>
            </div>
          </Card>

          <Card title="Regional & Localization Preferences" subtitle="Currency and timezone configurations">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                >
                  <option value="en">English (Default)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="gu">Gujarati (ગુજરાતી)</option>
                </select>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BUSINESS HOURS & SCHEDULE */}
      {/* ========================================================================= */}
      {activeTab === 'business_hours' && (
        <Card
          title="Weekly Business Schedule"
          subtitle="Configure dining operational hours for each day of the week"
        >
          <div className="divide-y divide-slate-100">
            {(Array.isArray(formData?.businessHours) ? formData.businessHours : []).map((schedule, idx) => (
              <div
                key={schedule.day}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 w-40">
                  <input
                    type="checkbox"
                    id={`day-${schedule.day}`}
                    checked={schedule.isOpen}
                    onChange={(e) => handleScheduleChange(idx, 'isOpen', e.target.checked)}
                    className="w-4 h-4 text-[#16A34A] rounded focus:ring-[#16A34A]"
                  />
                  <label
                    htmlFor={`day-${schedule.day}`}
                    className="text-xs font-extrabold capitalize text-slate-900 cursor-pointer"
                  >
                    {schedule.day}
                  </label>
                </div>

                {schedule.isOpen ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">From:</span>
                    <input
                      type="time"
                      value={schedule.openTime}
                      onChange={(e) => handleScheduleChange(idx, 'openTime', e.target.value)}
                      className="text-xs p-2 rounded-lg border border-slate-200 font-bold text-slate-800"
                    />
                    <span className="text-xs text-slate-400 font-medium">To:</span>
                    <input
                      type="time"
                      value={schedule.closeTime}
                      onChange={(e) => handleScheduleChange(idx, 'closeTime', e.target.value)}
                      className="text-xs p-2 rounded-lg border border-slate-200 font-bold text-slate-800"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    Closed
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. OPERATIONS & ORDER RULES */}
      {/* ========================================================================= */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <Card
            title="Real-Time Operational Store Status"
            subtitle="Controls customer QR menu behavior and incoming table orders"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  key: 'open',
                  title: 'Open',
                  desc: 'Accept orders normally without delay alerts.',
                  color: 'border-emerald-500 bg-emerald-50/40 text-emerald-800',
                  badge: 'bg-emerald-500 text-white',
                },
                {
                  key: 'busy',
                  title: 'Busy (Rush Hour)',
                  desc: 'Accept orders but alerts customers of longer waiting times.',
                  color: 'border-amber-500 bg-amber-50/40 text-amber-800',
                  badge: 'bg-amber-500 text-white',
                },
                {
                  key: 'pause_orders',
                  title: 'Pause Orders',
                  desc: 'Temporarily stops new orders. Active dining orders continue.',
                  color: 'border-purple-500 bg-purple-50/40 text-purple-800',
                  badge: 'bg-purple-500 text-white',
                },
                {
                  key: 'closed',
                  title: 'Closed',
                  desc: 'Stop all orders. Customer QR shows Store Closed.',
                  color: 'border-rose-500 bg-rose-50/40 text-rose-800',
                  badge: 'bg-rose-500 text-white',
                },
              ].map((st) => (
                <div
                  key={st.key}
                  onClick={() => handleChange('restaurantStatus', st.key)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.restaurantStatus === st.key
                      ? st.color + ' shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-sm text-slate-900">{st.title}</span>
                    {formData.restaurantStatus === st.key && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}>
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-85">{st.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Dining Order Rules & Automation" subtitle="Core table order automation settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Estimated Preparation Time (Minutes)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Default kitchen preparation time shown to customers on QR menu
                  </p>
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={formData.estimatedPreparationTime}
                    onChange={(e) => handleChange('estimatedPreparationTime', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Auto-Complete Orders upon Online Payment
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Orders paid online automatically complete upon reaching "Served" stage
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoCompleteOrder}
                  onChange={(e) => handleChange('autoCompleteOrder', e.target.checked)}
                  className="w-5 h-5 text-[#16A34A] rounded focus:ring-[#16A34A]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Auto-Lock Order after "Served" (One Active Bill Rule)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Once served, the order locks permanently to prevent further item modifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoLockServedOrder}
                  onChange={(e) => handleChange('autoLockServedOrder', e.target.checked)}
                  className="w-5 h-5 text-[#16A34A] rounded focus:ring-[#16A34A]"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAXES & SERVICE CHARGES */}
      {/* ========================================================================= */}
      {activeTab === 'taxes' && (
        <div className="space-y-6">
          <Card
            title="GST (Goods & Services Tax) Configuration"
            subtitle="Do NOT hardcode GST. The backend recalculates taxes dynamically from these settings."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Enable GST Billing</h4>
                  <p className="text-[11px] text-slate-500">
                    Apply GST percentage on all dining food items
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.gstEnabled}
                  onChange={(e) => handleChange('gstEnabled', e.target.checked)}
                  className="w-5 h-5 text-[#16A34A] rounded focus:ring-[#16A34A]"
                />
              </div>

              {formData.gstEnabled && (
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      GST Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.gstPercentage}
                        onChange={(e) => handleChange('gstPercentage', e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Standard Indian Restaurant GST: 5% (without ITC)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-emerald-200/60 text-xs flex items-start gap-2.5">
                    <FiInfo className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Taxes are recalculated securely on the server prior to saving every order. Customer carts never determine tax values.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Service Charge Configuration"
            subtitle="Optional voluntary restaurant service charge added to table bills"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Enable Service Charge</h4>
                  <p className="text-[11px] text-slate-500">
                    Automatically calculate service charge on order subtotal
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.serviceChargeEnabled}
                  onChange={(e) => handleChange('serviceChargeEnabled', e.target.checked)}
                  className="w-5 h-5 text-[#16A34A] rounded focus:ring-[#16A34A]"
                />
              </div>

              {formData.serviceChargeEnabled && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Charge Type
                    </label>
                    <select
                      value={formData.serviceChargeType}
                      onChange={(e) => handleChange('serviceChargeType', e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white font-bold"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Charge Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.serviceChargeType === 'percentage' ? 100 : 10000}
                      value={formData.serviceChargeValue}
                      onChange={(e) => handleChange('serviceChargeValue', e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PAYMENTS CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <Card title="Accepted Payment Methods" subtitle="Configure which payment channels customers can use">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    💵
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Cash on Counter</h4>
                    <p className="text-[11px] text-slate-500">
                      Customer settles bill with restaurant cashier in cash
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.payments.cashEnabled}
                  onChange={(e) => handleChange('payments.cashEnabled', e.target.checked)}
                  className="w-5 h-5 text-[#16A34A] rounded focus:ring-[#16A34A]"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    💳
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Online Payments</h4>
                    <p className="text-[11px] text-slate-500">
                      Instant online checkout via UPI, Cards, and Net Banking
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.payments.onlineEnabled}
                  onChange={(e) => handleChange('payments.onlineEnabled', e.target.checked)}
                  className="w-5 h-5 text-[#16A34A] rounded focus:ring-[#16A34A]"
                />
              </div>
            </div>
          </Card>

          <Card title="Payment Gateway Diagnostics (Razorpay)" subtitle="Live payment gateway configuration and test connection">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Provider: Razorpay Standard</h4>
                  <p className="text-[11px] text-slate-500">UPI, Cards, NetBanking, Wallets</p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    gatewayStatus?.status === 'configured' || gatewayStatus?.status === 'connected'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {gatewayStatus?.status === 'configured' || gatewayStatus?.status === 'connected'
                    ? 'Connected'
                    : 'Setup Required'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Environment</span>
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    {gatewayStatus?.environment || 'Test Mode'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Merchant Key</span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {gatewayStatus?.keyIdMasked || 'rzp_test_••••••••'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Webhook Status</span>
                  <span className="text-xs font-bold text-emerald-600">Connected</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  Verify API secret HMAC signature and connection to Razorpay servers.
                </span>
                <button
                  type="button"
                  onClick={handleTestGatewayConnection}
                  disabled={testingGateway}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                >
                  {testingGateway ? 'Testing Connection...' : 'Test Connection'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. RECEIPT & IMMUTABLE SNAPSHOT CONFIG */}
      {/* ========================================================================= */}
      {activeTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="Receipt Format Configuration"
            subtitle="Configure sequential receipt numbering and custom footer note"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Receipt Prefix (Max 5 chars)
                </label>
                <input
                  type="text"
                  maxLength="5"
                  value={formData.receiptPrefix}
                  onChange={(e) => handleChange('receiptPrefix', e.target.value.toUpperCase())}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 font-mono font-bold uppercase"
                  placeholder="CRV"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Example receipt sequence: {formData.receiptPrefix || 'CRV'}-RCP-2027-000001
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Receipt Footer Message
                </label>
                <textarea
                  rows="3"
                  value={formData.receiptFooter}
                  onChange={(e) => handleChange('receiptFooter', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                  placeholder="Thank you for dining with us. Please visit again!"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 text-xs text-slate-700 space-y-1">
                <span className="font-extrabold text-[#16A34A] block">
                  ✓ Immutable Snapshot System Active
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  When an order reaches Completed status, a frozen Receipt Snapshot is automatically stored. Future menu edits, price adjustments, or GST changes will never alter old receipts.
                </p>
              </div>
            </div>
          </Card>

          {/* Sample Receipt Live Preview */}
          <Card title="Live Receipt Preview" subtitle="Sample print layout generated for customers">
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 font-mono text-xs max-w-sm mx-auto text-slate-800 shadow-inner">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-black text-sm text-slate-900 uppercase">
                  {formData.restaurantProfile.restaurantName || 'CRAVITI DINING'}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {formData.restaurantProfile.address?.city || 'Downtown Central'}
                </p>
                <p className="text-[10px] text-slate-500 font-bold">
                  Receipt: {formData.receiptPrefix || 'CRV'}-RCP-2027-000001
                </p>
                <p className="text-[10px] text-slate-400">Table 04 • Order #CRV-2027-000042</p>
              </div>

              <div className="py-3 space-y-1.5 border-b border-dashed border-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span>2x Paneer Tikka</span>
                  <span>₹480</span>
                </div>
                <div className="flex justify-between">
                  <span>1x Butter Naan</span>
                  <span>₹60</span>
                </div>
              </div>

              <div className="py-2.5 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹540.00</span>
                </div>
                {formData.gstEnabled && (
                  <div className="flex justify-between text-slate-500">
                    <span>GST ({formData.gstPercentage}%):</span>
                    <span>₹{((540 * (Number(formData.gstPercentage) || 0)) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>
                    ₹
                    {(
                      540 +
                      (formData.gstEnabled ? (540 * (Number(formData.gstPercentage) || 0)) / 100 : 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
                <p>{formData.receiptFooter || 'Thank you for dining with us!'}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. NOTIFICATIONS PREFERENCES */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <Card title="Notification Preferences" subtitle="Configure order alert sounds and desktop prompts">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Kitchen Audio Chime</h4>
                <p className="text-[11px] text-slate-500">
                  Play Web Audio API synthesizer chime whenever a new order arrives
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.notificationSound}
                onChange={(e) => handleChange('notificationSound', e.target.checked)}
                className="w-5 h-5 text-[#16A34A] rounded focus:ring-[#16A34A]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Desktop Push Notifications</h4>
                <p className="text-[11px] text-slate-500">
                  Trigger native OS desktop alert cards for background order monitoring
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.desktopNotification}
                onChange={(e) => handleChange('desktopNotification', e.target.checked)}
                className="w-5 h-5 text-[#16A34A] rounded focus:ring-[#16A34A]"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">Notification Volume</span>
                <span className="font-extrabold text-[#16A34A]">{formData.notificationVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.notificationVolume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  handleChange('notificationVolume', val);
                  setStoredNotificationVolume(val);
                }}
                className="w-full accent-[#16A34A] cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const vol = Number(formData.notificationVolume);
                  playOrderChime(vol);
                  if (vol === 0) {
                    toast('Notification volume is at 0% (Muted)', { icon: '🔇' });
                  } else {
                    toast.success(`Chime tested at ${vol}% volume!`);
                  }
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer active:scale-98 transition-all"
              >
                <FiVolume2 className="w-4 h-4 text-[#16A34A]" />
                <span>Test Audio Chime</span>
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
