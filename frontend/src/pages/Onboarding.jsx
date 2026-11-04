import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { onboardRestaurantApi } from '../services/restaurantService';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { RESTAURANT_INFO } from '../constants/navigation';
import { MdQrCodeScanner } from 'react-icons/md';
import { FiUploadCloud, FiHome, FiUser, FiPhone, FiMapPin, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const Onboarding = () => {
  const { user, setRestaurant } = useAuth();
  const navigate = useNavigate();

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      restaurantName: '',
      ownerName: user?.name || '',
      ownerPhone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG, JPG, WEBP)');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('restaurantName', data.restaurantName);
      formData.append('ownerName', data.ownerName);
      formData.append('ownerPhone', data.ownerPhone);
      formData.append('address', data.address);
      formData.append('city', data.city);
      formData.append('state', data.state);
      formData.append('pincode', data.pincode);

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await onboardRestaurantApi(formData);
      if (res.success && res.data) {
        setRestaurant(res.data);
        toast.success('Restaurant setup complete! Welcome to your dashboard.');
        navigate('/', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Onboarding failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#16A34A] text-white shadow-sm mb-4">
            <MdQrCodeScanner className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome to {RESTAURANT_INFO.logoText}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Step 2: Let&apos;s set up your restaurant profile in under a minute
          </p>
        </div>

        {/* Onboarding Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Restaurant Brand Logo
              </label>
              <div className="flex items-center gap-6">
                {logoPreview ? (
                  <div className="relative w-20 h-20 rounded-xl border-2 border-emerald-500/20 overflow-hidden bg-slate-50 shrink-0">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#16A34A] flex flex-col items-center justify-center text-slate-400 hover:text-[#16A34A] cursor-pointer transition-colors shrink-0 bg-slate-50">
                    <FiUploadCloud className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="text-xs text-slate-500">
                  <p className="font-medium text-slate-700">PNG, JPG or WEBP up to 5MB</p>
                  <p className="mt-0.5">This logo appears on your digital QR table menus.</p>
                </div>
              </div>
            </div>

            {/* Restaurant Name */}
            <Input
              label="Restaurant Brand Name"
              placeholder="e.g. Spice Garden Bistro"
              leftIcon={FiHome}
              error={errors.restaurantName?.message}
              {...register('restaurantName', {
                required: 'Restaurant name is required',
              })}
            />

            {/* Owner Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Owner Full Name"
                placeholder="e.g. Rajesh Kumar"
                leftIcon={FiUser}
                error={errors.ownerName?.message}
                {...register('ownerName', {
                  required: 'Owner name is required',
                })}
              />

              <Input
                label="Owner Contact Phone"
                placeholder="+91 98765 43210"
                leftIcon={FiPhone}
                error={errors.ownerPhone?.message}
                {...register('ownerPhone', {
                  required: 'Owner phone is required',
                })}
              />
            </div>

            {/* Address */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <Input
                label="Restaurant Physical Address"
                placeholder="Street address, shop number, building"
                leftIcon={FiMapPin}
                error={errors.address?.message}
                {...register('address', {
                  required: 'Restaurant address is required',
                })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  placeholder="e.g. Mumbai"
                  error={errors.city?.message}
                  {...register('city', { required: 'City is required' })}
                />
                <Input
                  label="State"
                  placeholder="e.g. Maharashtra"
                  error={errors.state?.message}
                  {...register('state', { required: 'State is required' })}
                />
                <Input
                  label="Pincode"
                  placeholder="e.g. 400001"
                  error={errors.pincode?.message}
                  {...register('pincode', { required: 'Pincode is required' })}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              isLoading={isSubmitting}
            >
              Complete Onboarding &amp; Go to Dashboard
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

