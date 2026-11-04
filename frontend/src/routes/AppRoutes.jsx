import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Loader } from '../components/Loader';

// Lazy-loaded route components for high performance (Standard 18)
const Dashboard = lazy(() => import('../pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Orders = lazy(() => import('../pages/Orders').then((m) => ({ default: m.Orders })));
const Menu = lazy(() => import('../pages/Menu').then((m) => ({ default: m.Menu })));
const Categories = lazy(() => import('../pages/Categories').then((m) => ({ default: m.Categories })));
const Tables = lazy(() => import('../pages/Tables').then((m) => ({ default: m.Tables })));
const QRCodes = lazy(() => import('../pages/QRCodes').then((m) => ({ default: m.QRCodes })));
const Payments = lazy(() => import('../pages/Payments').then((m) => ({ default: m.Payments })));
const Analytics = lazy(() => import('../pages/Analytics').then((m) => ({ default: m.Analytics })));
const RestaurantProfile = lazy(() =>
  import('../pages/RestaurantProfile').then((m) => ({ default: m.RestaurantProfile }))
);
const Settings = lazy(() => import('../pages/Settings').then((m) => ({ default: m.Settings })));
const Login = lazy(() => import('../pages/Login').then((m) => ({ default: m.Login })));
const Signup = lazy(() => import('../pages/Signup').then((m) => ({ default: m.Signup })));
const Onboarding = lazy(() => import('../pages/Onboarding').then((m) => ({ default: m.Onboarding })));
const CustomerMenu = lazy(() => import('../pages/CustomerMenu').then((m) => ({ default: m.CustomerMenu })));
const CustomerOrderTrack = lazy(() =>
  import('../pages/CustomerOrderTrack').then((m) => ({ default: m.CustomerOrderTrack }))
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader fullScreen message="Loading page..." />}>
      <Routes>
        {/* Public Customer Mobile Ordering Routes (No Login Required) */}
        <Route path="/order/:restaurantSlug/:tableNumber" element={<CustomerMenu />} />
        <Route path="/order/:restaurantSlug/:tableNumber/:qrToken" element={<CustomerMenu />} />
        <Route path="/order/:restaurantSlug" element={<CustomerMenu />} />
        <Route path="/order/track/:orderId" element={<CustomerOrderTrack />} />

        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireRestaurant={false}>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected Restaurant Panel Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute requireRestaurant={true}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="menu" element={<Menu />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tables" element={<Tables />} />
          <Route path="qr-codes" element={<QRCodes />} />
          <Route path="payments" element={<Payments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<RestaurantProfile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
