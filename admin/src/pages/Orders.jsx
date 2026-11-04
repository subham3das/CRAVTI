import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiShoppingBag, FiClock, FiEye, FiX } from 'react-icons/fi';
import { fetchAdminOrdersApi } from '../services/adminService';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminOrdersApi({
        search,
        status: statusFilter,
        page,
        limit: 15,
      });
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Platform Orders Explorer
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time and historical orders across all tenant dining tables ({pagination.total} total).
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order #, customer phone, table..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer w-full md:w-auto"
        >
          <option value="all">All Stages</option>
          <option value="placed">Placed</option>
          <option value="accepted">Accepted</option>
          <option value="served">Served</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState title="No orders match your search criteria" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Restaurant</th>
                  <th className="px-5 py-3.5">Table</th>
                  <th className="px-5 py-3.5">Grand Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created Time</th>
                  <th className="px-5 py-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900">
                      #{o.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 font-semibold">
                      {o.restaurantId?.restaurantName || 'Unknown Restaurant'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">Table {o.tableNumber}</td>
                    <td className="px-5 py-3.5 font-black text-slate-900">
                      {formatCurrency(o.grandTotal)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200 capitalize">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        title="View Details"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-bold"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] font-mono">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedOrder.restaurantId?.restaurantName} • Table {selectedOrder.tableNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">
                      {item.itemName || item.name} × {item.quantity}
                    </span>
                    {item.specialInstructions && (
                      <p className="text-[10px] text-amber-600 italic">"{item.specialInstructions}"</p>
                    )}
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatCurrency((item.sellingPrice || item.price || 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 mt-4 space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>- {formatCurrency(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (GST):</span>
                <span>{formatCurrency(selectedOrder.tax)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-[#0F172A] pt-1 border-t border-slate-100">
                <span>Grand Total:</span>
                <span className="text-blue-600">{formatCurrency(selectedOrder.grandTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

