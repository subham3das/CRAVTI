import { FiInbox } from 'react-icons/fi';

export const EmptyState = ({
  icon: Icon = FiInbox,
  title = 'No records found',
  description = 'Try adjusting your search filters or check back later.',
  action = null,
}) => {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-[#0F172A]">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

