import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminProtectedRoute } from '../components/AdminProtectedRoute';
import { PageLoader } from '../components/PageLoader';

// Lazy-loaded Admin Pages
const Dashboard = lazy(() => import('../pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Revenue = lazy(() => import('../pages/Revenue').then((m) => ({ default: m.Revenue })));
const Payments = lazy(() => import('../pages/Payments').then((m) => ({ default: m.Payments })));
const Restaurants = lazy(() => import('../pages/Restaurants').then((m) => ({ default: m.Restaurants })));
const RestaurantDetails = lazy(() => import('../pages/RestaurantDetails').then((m) => ({ default: m.RestaurantDetails })));
const RestaurantVerification = lazy(() => import('../pages/RestaurantVerification').then((m) => ({ default: m.RestaurantVerification })));
const Subscriptions = lazy(() => import('../pages/Subscriptions').then((m) => ({ default: m.Subscriptions })));
const Billing = lazy(() => import('../pages/Billing').then((m) => ({ default: m.Billing })));
const Orders = lazy(() => import('../pages/Orders').then((m) => ({ default: m.Orders })));
const Analytics = lazy(() => import('../pages/Analytics').then((m) => ({ default: m.Analytics })));
const Support = lazy(() => import('../pages/Support').then((m) => ({ default: m.Support })));
const Announcements = lazy(() => import('../pages/Announcements').then((m) => ({ default: m.Announcements })));
const ExportCenter = lazy(() => import('../pages/ExportCenter').then((m) => ({ default: m.ExportCenter })));
const FeatureFlags = lazy(() => import('../pages/FeatureFlags').then((m) => ({ default: m.FeatureFlags })));
const SecurityCenter = lazy(() => import('../pages/SecurityCenter').then((m) => ({ default: m.SecurityCenter })));
const SystemHealth = lazy(() => import('../pages/SystemHealth').then((m) => ({ default: m.SystemHealth })));
const BackupRestore = lazy(() => import('../pages/BackupRestore').then((m) => ({ default: m.BackupRestore })));
const ActivityLogs = lazy(() => import('../pages/ActivityLogs').then((m) => ({ default: m.ActivityLogs })));
const SystemSettings = lazy(() => import('../pages/SystemSettings').then((m) => ({ default: m.SystemSettings })));
const Admins = lazy(() => import('../pages/Admins').then((m) => ({ default: m.Admins })));
const Profile = lazy(() => import('../pages/Profile').then((m) => ({ default: m.Profile })));
const Login = lazy(() => import('../pages/Login').then((m) => ({ default: m.Login })));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader message="Loading admin view..." />}>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Console Routes */}
        <Route
          path="/"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="payments" element={<Payments />} />
          <Route path="restaurants" element={<Restaurants />} />
          <Route path="restaurants/:restaurantId" element={<RestaurantDetails />} />
          <Route path="verification" element={<RestaurantVerification />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="billing" element={<Billing />} />
          <Route path="orders" element={<Orders />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="support" element={<Support />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="export" element={<ExportCenter />} />
          <Route path="feature-flags" element={<FeatureFlags />} />
          <Route path="security" element={<SecurityCenter />} />
          <Route path="health" element={<SystemHealth />} />
          <Route path="backup" element={<BackupRestore />} />
          <Route path="activity-logs" element={<ActivityLogs />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="admins" element={<Admins />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
