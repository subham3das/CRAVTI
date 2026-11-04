import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { FiBarChart2, FiCalendar, FiDownload } from 'react-icons/fi';

export const Analytics = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Operations Analytics"
        description="Comprehensive insights into revenue, order volumes, average ticket size, and top customers."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" leftIcon={FiCalendar}>
              Last 30 Days
            </Button>
            <Button size="sm" variant="secondary" leftIcon={FiDownload}>
              Download Report
            </Button>
          </div>
        }
      />

      <EmptyState
        icon={FiBarChart2}
        title="Analytics aggregating"
        description="Detailed analytics and charts will populate once order volume accumulates over consecutive days."
      />
    </div>
  );
};

