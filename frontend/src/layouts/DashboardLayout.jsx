import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FiClock, FiArrowRight } from 'react-icons/fi';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { OrderNotificationWatcher } from '../components/OrderNotificationWatcher';
import { useAuth } from '../context/AuthContext';
import { initAudioUnlock } from '../utils/soundNotification';
import toast from 'react-hot-toast';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { logout, restaurant } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    initAudioUnlock();
  }, []);

  const handleConfirmLogout = () => {
    logout();
    setLogoutModalOpen(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const sub = restaurant?.subscription;
  const isTrial = sub?.status === 'trial';
  const daysRemaining = sub?.trialDaysRemaining ?? 0;
  const showTrialBanner = isTrial && daysRemaining > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogoutClick={() => setLogoutModalOpen(true)}
      />

      {/* Main Wrapper with desktop sidebar offset */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <OrderNotificationWatcher />
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Top Free Trial Banner */}
        {showTrialBanner && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white px-4 py-2.5 sm:px-6 shadow-xs flex items-center justify-between gap-3 text-xs sm:text-sm font-medium z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1 rounded-md bg-white/20 shrink-0">
                <FiClock className="w-3.5 h-3.5" />
              </span>
              <p className="truncate">
                You have <strong className="font-bold underline">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</strong> in your free trial.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/subscription')}
              className="shrink-0 px-3 py-1 bg-white text-amber-900 rounded-lg font-bold text-xs hover:bg-amber-50 transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Upgrade Now</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out"
        message="Are you sure you want to log out of your restaurant panel?"
        confirmText="Logout"
        isDangerous
      />
    </div>
  );
};

