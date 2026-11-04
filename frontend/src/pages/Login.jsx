import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { RESTAURANT_INFO } from '../constants/navigation';
import { MdQrCodeScanner } from 'react-icons/md';
import { FiMail, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const res = await login(data);
      toast.success('Welcome back to Craviti!');
      if (!res.restaurant && !res.user?.restaurantId) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#16A34A] text-white shadow-sm mb-4">
          <MdQrCodeScanner className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {RESTAURANT_INFO.logoText}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Restaurant Partner Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Staff / Owner Email"
              type="email"
              placeholder="e.g. manager@restaurant.com"
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

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Sign In to Panel
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New restaurant?{' '}
              <Link to="/signup" className="text-[#16A34A] font-semibold hover:underline">
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
