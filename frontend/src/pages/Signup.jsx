import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { RESTAURANT_INFO } from '../constants/navigation';
import { MdQrCodeScanner } from 'react-icons/md';
import { FiMail, FiPhone, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    try {
      await signup(data);
      toast.success('Account created! Please set up your restaurant.');
      navigate('/onboarding', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#16A34A] text-white shadow-sm mb-4">
          <MdQrCodeScanner className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Restaurant Account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Join {RESTAURANT_INFO.logoText} QR dining network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Business Email"
              type="email"
              placeholder="owner@restaurant.com"
              leftIcon={FiMail}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Enter a valid email address',
                },
              })}
            />

            <Input
              label="Mobile Number"
              type="tel"
              placeholder="+91 98765 43210"
              leftIcon={FiPhone}
              error={errors.phone?.message}
              {...register('phone', {
                required: 'Mobile number is required',
                pattern: {
                  value: /^[0-9+\s-]{8,15}$/,
                  message: 'Enter a valid phone number',
                },
              })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={FiLock}
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              leftIcon={FiLock}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === passwordValue || 'Passwords do not match',
              })}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Continue to Onboarding
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#16A34A] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

