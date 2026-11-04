import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    logout();
    setLogoutModalOpen(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

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
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

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

