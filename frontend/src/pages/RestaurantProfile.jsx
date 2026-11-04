import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { getProfileApi, updateProfileApi } from '../services/restaurantService';
import {
  FiSave,
  FiUploadCloud,
  FiShield,
  FiClock,
  FiCreditCard,
  FiMapPin,
  FiInfo,
  FiX,
  FiCheckCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export const RestaurantProfile = () => {
  const { restaurant, setRestaurant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfileApi();
        if (res.success && res.data) {
          const r = res.data;
          setRestaurant(r);
          reset({
            restaurantName: r.restaurantName || '',
            description: r.description || '',
            ownerName: r.ownerName || '',
            ownerPhone: r.ownerPhone || '',
            street: r.address?.street || '',
            city: r.address?.city || '',
            state: r.address?.state || '',
            pincode: r.address?.pincode || '',
            openingTime: r.timing?.openingTime || '10:00 AM',
            closingTime: r.timing?.closingTime || '11:00 PM',
            gstNumber: r.taxInfo?.gstNumber || '',
            fssaiNumber: r.taxInfo?.fssaiNumber || '',
            holderName: r.bankDetails?.holderName || '',
            bankName: r.bankDetails?.bankName || '',
            accountNumber: r.bankDetails?.accountNumber || '',
            ifscCode: r.bankDetails?.ifscCode || '',
            upiId: r.bankDetails?.upiId || '',
          });
          if (r.coverImage?.url) {
            setCoverPreview(r.coverImage.url);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [reset, setRestaurant]);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('restaurantName', data.restaurantName);
      formData.append('description', data.description);
      formData.append('ownerName', data.ownerName);
      formData.append('ownerPhone', data.ownerPhone);

      formData.append(
        'address',
        JSON.stringify({
          street: data.street,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        })
      );

      formData.append(
        'timing',
        JSON.stringify({
          openingTime: data.openingTime,
          closingTime: data.closingTime,
        })
      );

      formData.append(
        'taxInfo',
        JSON.stringify({
          gstNumber: data.gstNumber,
          fssaiNumber: data.fssaiNumber,
        })
      );

      formData.append(
        'bankDetails',
        JSON.stringify({
          holderName: data.holderName,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          upiId: data.upiId,
        })
      );

      if (coverFile) {
        formData.append('coverImage', coverFile);
      }

      const res = await updateProfileApi(formData);
      if (res.success && res.data) {
        setRestaurant(res.data);
        toast.success('Restaurant profile updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Update failed');
    }
  };

  if (loading) {
    return <Loader size="lg" message="Loading restaurant profile..." />;
  }

  const completionPercentage = restaurant?.profileCompletionPercentage || 40;
  const isBankSubmitted =
    restaurant?.bankDetails?.status === 'submitted' ||
    restaurant?.verificationStatus === 'submitted';
  const isPaymentEnabled = restaurant?.paymentEnabled === true;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Restaurant Profile & Settings"
        description="Manage your store profile, operating hours, business registrations, and banking details."
        actions={
          <Button
            size="md"
            variant="primary"
            leftIcon={FiSave}
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          >
            Save All Changes
          </Button>
        }
      />

      {/* Completion & Payment Status Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold text-slate-800">
              Profile Completion: {completionPercentage}%
            </span>
            {completionPercentage === 100 && (
              <Badge variant="success" size="sm" dot>
                Complete
              </Badge>
            )}
          </div>
          <div className="w-full max-w-md bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#16A34A] h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Payment Gateway Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              {isPaymentEnabled ? (
                <Badge variant="success" size="md" dot>
                  Payments Active
                </Badge>
              ) : isBankSubmitted ? (
                <Badge variant="warning" size="md" dot>
                  Bank Details Submitted
                </Badge>
              ) : (
                <Badge variant="neutral" size="md" dot>
                  Verification Pending
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cover Image & Branding */}
        <Card title="Storefront Branding" subtitle="Header visuals for customer menus">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Restaurant Cover Image
              </label>
              {coverPreview ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <ImageWithFallback
                    src={coverPreview}
                    alt="Cover preview"
                    type="cover"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#16A34A] flex flex-col items-center justify-center text-slate-400 hover:text-[#16A34A] cursor-pointer transition-colors bg-slate-50/50">
                  <FiUploadCloud className="w-8 h-8 mb-2" />
                  <span className="text-xs font-medium text-slate-700">Upload Header Cover Image</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Recommended ratio 16:9, max 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Restaurant Name"
                placeholder="Restaurant name"
                {...register('restaurantName')}
              />
              <Input
                label="Owner Name"
                placeholder="Owner name"
                {...register('ownerName')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Restaurant Description
              </label>
              <textarea
                rows={3}
                placeholder="Tell guests about your cuisine, specialties, and dining ambiance..."
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20"
                {...register('description')}
              />
            </div>
          </div>
        </Card>

        {/* Location & Timings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Location & Address" subtitle="Dine-in location details">
            <div className="space-y-4">
              <Input
                label="Street Address"
                placeholder="Street name, landmark"
                leftIcon={FiMapPin}
                {...register('street')}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input label="City" placeholder="City" {...register('city')} />
                <Input label="State" placeholder="State" {...register('state')} />
                <Input label="Pincode" placeholder="Pincode" {...register('pincode')} />
              </div>
            </div>
          </Card>

          <Card title="Operating Timings" subtitle="Daily opening and closing hours">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Opening Time"
                  placeholder="e.g. 10:00 AM"
                  leftIcon={FiClock}
                  {...register('openingTime')}
                />
                <Input
                  label="Closing Time"
                  placeholder="e.g. 11:00 PM"
                  leftIcon={FiClock}
                  {...register('closingTime')}
                />
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-2">
                <FiInfo className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                These hours inform customers whether online QR ordering is open.
              </p>
            </div>
          </Card>
        </div>

        {/* Legal & Registrations */}
        <Card title="Tax & Business Registrations" subtitle="Government certifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="GSTIN Number (Optional)"
              placeholder="e.g. 22AAAAA0000A1Z5"
              leftIcon={FiShield}
              {...register('gstNumber')}
            />
            <Input
              label="FSSAI License Number"
              placeholder="14-digit FSSAI number"
              leftIcon={FiShield}
              {...register('fssaiNumber')}
            />
          </div>
        </Card>

        {/* Bank & Settlement Details */}
        <Card
          title="Bank Details & Settlements"
          subtitle="Required to activate online UPI & Card payments"
          action={
            isPaymentEnabled ? (
              <Badge variant="success" size="sm" dot>
                Verified
              </Badge>
            ) : isBankSubmitted ? (
              <Badge variant="warning" size="sm" dot>
                Bank Details Submitted
              </Badge>
            ) : null
          }
        >
          <div className="space-y-4">
            {isBankSubmitted && !isPaymentEnabled && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <FiInfo className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Status: Bank Details Submitted.</strong> Admin verification is required before online payments are activated on your account.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account Holder Name"
                placeholder="Full name as in passbook"
                leftIcon={FiCreditCard}
                {...register('holderName')}
              />
              <Input
                label="Bank Name"
                placeholder="e.g. HDFC Bank, ICICI Bank"
                {...register('bankName')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Bank Account Number"
                placeholder="Account number"
                {...register('accountNumber')}
              />
              <Input
                label="IFSC Code"
                placeholder="e.g. HDFC0001234"
                {...register('ifscCode')}
              />
              <Input
                label="Business UPI ID"
                placeholder="e.g. restaurant@okhdfcbank"
                {...register('upiId')}
              />
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

