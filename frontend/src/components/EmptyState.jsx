import {
  FiInbox,
  FiShoppingBag,
  FiBookOpen,
  FiSquare,
  FiBarChart2,
  FiBellOff,
} from 'react-icons/fi';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = FiInbox,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionText,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button size="sm" variant="primary" onClick={onAction} leftIcon={actionIcon}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

// Preset Empty States (Standard 15)
EmptyState.NoOrders = ({ onAction, actionText, isLive = true }) => (
  <EmptyState
    icon={FiShoppingBag}
    title={isLive ? 'No Active Orders' : 'No Order History'}
    description={
      isLive
        ? 'There are currently no active orders on the floor. Orders placed via QR scans appear here in real time.'
        : 'No orders recorded in this date range or filter.'
    }
    actionText={actionText}
    onAction={onAction}
  />
);

EmptyState.NoMenu = ({ onAction, actionText = 'Add Dish' }) => (
  <EmptyState
    icon={FiBookOpen}
    title="No Menu Items Found"
    description="Your menu is currently empty or no items match your search filter. Create your first dish to start serving."
    actionText={actionText}
    onAction={onAction}
  />
);

EmptyState.NoTables = ({ onAction, actionText = 'Add Tables' }) => (
  <EmptyState
    icon={FiSquare}
    title="No Tables Configured"
    description="Set up your restaurant tables to auto-generate dining QR codes for your customers."
    actionText={actionText}
    onAction={onAction}
  />
);

EmptyState.NoAnalytics = () => (
  <EmptyState
    icon={FiBarChart2}
    title="No Analytics Data Yet"
    description="Sales and operational metrics will calculate automatically as orders are fulfilled and settled."
  />
);

EmptyState.NoNotifications = () => (
  <EmptyState
    icon={FiBellOff}
    title="No Unread Notifications"
    description="You are completely caught up! New kitchen alerts and order pings will appear here."
  />
);

export default EmptyState;
