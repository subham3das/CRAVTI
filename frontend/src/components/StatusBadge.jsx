import { Badge } from './Badge';

const statusMap = {
  // Orders (Simplified Flow)
  placed: { label: 'Placed', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'blue' },
  served: { label: 'Served', variant: 'primary' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },

  // Payments
  pending: { label: 'Pending', variant: 'warning' },
  paid_online: { label: 'Paid Online', variant: 'success' },
  paid_cash: { label: 'Paid Cash', variant: 'success' },
  refunded: { label: 'Refunded', variant: 'danger' },

  // Tables
  available: { label: 'Available', variant: 'success' },
  occupied: { label: 'Occupied', variant: 'danger' },
  reserved: { label: 'Reserved', variant: 'warning' },
  disabled: { label: 'Disabled', variant: 'neutral' },

  // Generic
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'neutral' },
};

export const StatusBadge = ({ status, size = 'md' }) => {
  const normalized = (status || '').toLowerCase();
  const config = statusMap[normalized] || { label: status || 'Unknown', variant: 'neutral' };

  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};
