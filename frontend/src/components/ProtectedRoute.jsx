import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

export const ProtectedRoute = ({ children, requireRestaurant = true }) => {
  const { isAuthenticated, hasRestaurant, loading, restaurant } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is logged in but hasn't onboarded their restaurant yet
  if (requireRestaurant && !hasRestaurant) {
    return <Navigate to="/onboarding" replace />;
  }

  // Subscription verification
  // If subscription has expired, lock dashboard/operations and redirect to /subscription
  const sub = restaurant?.subscription;
  if (sub && sub.status) {
    const isLocked =
      sub.status === 'expired' ||
      sub.status === 'cancelled' ||
      sub.status === 'halted' ||
      sub.status === 'suspended' ||
      sub.canAccessFeatures === false;

    if (isLocked && location.pathname !== '/subscription') {
      return <Navigate to="/subscription" replace />;
    }
  }

  return children;
};
