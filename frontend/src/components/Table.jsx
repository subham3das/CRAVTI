import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There is no data to show in this table.',
  onRowClick,
  className = '',
}) => {
  const safeData = Array.isArray(data) ? data : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  if (isLoading) {
    return <Skeleton.Table rows={5} cols={safeColumns.length || 5} className={className} />;
  }

  if (safeData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50/80">
            <tr>
              {safeColumns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {safeData.map((row, rowIdx) => (
              <tr
                key={row._id || row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'
                }`}
              >
                {safeColumns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-6 py-4 text-xs font-medium text-slate-700 whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {col.cell
                      ? col.cell(row)
                      : typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : row[col.accessor] ?? '--'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
