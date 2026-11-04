import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  FiCheckCircle,
  FiClock,
  FiShoppingBag,
  FiArrowLeft,
  FiAlertCircle,
  FiRotateCcw,
  FiDownload,
  FiCreditCard,
} from 'react-icons/fi';
import { MdDoneAll, MdOutlineDinnerDining } from 'react-icons/md';
import { fetchCustomerOrderTrackApi, fetchOrderReceiptApi } from '../services/orderService';
import { createPaymentOrderApi, verifyPaymentApi } from '../services/paymentService';
import { openRazorpayModal } from '../utils/razorpay';
import { generateReceiptPdf, RECEIPT_TEMPLATES } from '../utils/receiptGenerator';
import { CustomerVegBadge } from '../components/customer/CustomerVegBadge';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

// Simplified 4-stage Live Timeline
const STAGES = [
  { key: 'placed', label: 'Order Placed', desc: 'Received by kitchen', icon: FiShoppingBag },
  { key: 'accepted', label: 'Accepted', desc: 'Staff confirmed your order', icon: FiCheckCircle },
  { key: 'served', label: 'Served', desc: 'Food served hot at table', icon: MdOutlineDinnerDining },
  { key: 'completed', label: 'Completed', desc: 'Dining session completed', icon: MdDoneAll },
];

const STAGE_ORDER = ['placed', 'accepted', 'served', 'completed'];

export const CustomerOrderTrack = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Online Payment Flow via Razorpay
  const handlePayOnline = async () => {
    if (isProcessingPayment || !order?._id) return;
    try {
      setIsProcessingPayment(true);
      const payRes = await createPaymentOrderApi({
        orderId: order._id,
        customerEmail: order.customerEmail || '',
        customerPhone: order.customerPhone || '',
      });

      if (payRes.success && payRes.data) {
        await openRazorpayModal({
          orderData: payRes.data,
          onSuccess: async (verifyPayload) => {
            try {
              const vRes = await verifyPaymentApi({
                orderId: order._id,
                ...verifyPayload,
              });
              if (vRes.success) {
                toast.success('Payment verified! Your order is completed and receipt ready.');
                if (vRes.data?.order) {
                  setOrder(vRes.data.order);
                } else {
                  const refreshed = await fetchCustomerOrderTrackApi(order._id);
                  if (refreshed.success && refreshed.order) setOrder(refreshed.order);
                }
              }
            } catch (vErr) {
              toast.error(vErr.response?.data?.message || 'Payment verification failed.');
            }
          },
          onDismiss: () => {
            toast('Payment window closed. You can retry anytime.', { icon: 'ℹ️' });
          },
          onError: (err) => {
            toast.error(err.message || 'Payment error.');
          },
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Unable to initiate online payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Deterministic Receipt Download from immutable Receipt collection snapshot
  const handleDownloadReceipt = async () => {
    if (isDownloadingReceipt || !order?._id) return;
    try {
      setIsDownloadingReceipt(true);
      const res = await fetchOrderReceiptApi(order._id);
      if (res.success && res.receipt) {
        generateReceiptPdf(res.receipt, { template: RECEIPT_TEMPLATES.THERMAL_80MM });
        toast.success('Receipt downloaded successfully!');
      } else {
        toast.error(res.message || 'Unable to download receipt snapshot');
      }
    } catch (err) {
      console.error('Failed to download receipt snapshot:', err);
      toast.error(err.response?.data?.message || 'Error generating receipt PDF');
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  // 1. Fetch initial order data
  useEffect(() => {
    let isMounted = true;
    const loadOrder = async () => {
      try {
        setLoading(true);
        const res = await fetchCustomerOrderTrackApi(orderId);
        if (isMounted && res.success && res.order) {
          setOrder(res.order);
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Order not found');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (orderId) loadOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // 2. Real-time Socket.IO live updates (Zero polling!)
  useEffect(() => {
    if (!orderId) return;

    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join-order', orderId);
    });

    const handleUpdate = (updatedOrder) => {
      if (updatedOrder) {
        setOrder((prev) => (prev ? { ...prev, ...updatedOrder } : updatedOrder));
      }
    };

    socket.on('order-updated', handleUpdate);
    socket.on('status-updated', handleUpdate);
    socket.on('payment-updated', handleUpdate);
    socket.on('order:status_updated', (data) => {
      if (data?.status) {
        setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-3 border-emerald-200 border-t-[#16A34A] animate-spin mb-4" />
        <h3 className="font-bold text-slate-800 text-sm">Tracking Live Order...</h3>
        <p className="text-xs text-slate-400 mt-1">Connecting to kitchen telemetry</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
          <FiAlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">Order Not Found</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">{error || 'Please scan table QR again.'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs"
        >
          Return Home
        </button>
      </div>
    );
  }

  const currentStatusIndex = STAGE_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const restaurant = order.restaurantId;
  const isPaid = order.paymentStatus === 'paid_online' || order.paymentStatus === 'paid_cash';

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] flex flex-col pb-10">
      {/* Top Header */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          {restaurant?.slug && (
            <button
              onClick={() => navigate(`/order/${restaurant.slug}/${order.tableNumber}`)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              title="Back to Menu"
            >
              <FiArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 leading-tight">
              {restaurant?.restaurantName || 'Restaurant Order'}
            </h2>
            <p className="text-[11px] text-slate-400">
              Table {order.tableNumber} • {order.orderNumber}
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
          <span>LIVE</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Hero Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm text-center">
          {isCancelled ? (
            <div className="text-rose-500">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-2">
                <FiAlertCircle className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">Order Cancelled</h3>
              <p className="text-xs text-slate-500 mt-1">Please speak with restaurant staff.</p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Order Status
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5 capitalize">
                {order.status === 'served'
                  ? 'Served 🎉'
                  : order.status === 'completed'
                  ? 'Completed ✨'
                  : order.status}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5">
                <FiClock className="w-3.5 h-3.5 text-amber-500" />
                Est. Prep Time: <strong>~{order.estimatedPrepTime || 15} mins</strong>
              </p>
            </div>
          )}
        </div>

        {/* Simplified Live Timeline: Placed -> Accepted -> Served -> Completed */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">
              Live Timeline
            </h4>

            <div className="relative pl-6 space-y-6">
              <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-100" />

              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isPassed = currentStatusIndex > idx;
                const isCurrent = currentStatusIndex === idx;

                let circleClass = 'bg-slate-100 text-slate-400 border-2 border-white';
                if (isPassed) {
                  circleClass = 'bg-[#16A34A] text-white shadow-sm';
                } else if (isCurrent) {
                  circleClass = 'bg-[#16A34A] text-white ring-4 ring-emerald-100';
                }

                return (
                  <div key={stage.key} className="relative flex items-start gap-3.5">
                    <div
                      className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${circleClass}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="pt-0.5">
                      <p
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-[#16A34A] text-sm'
                            : isPassed
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {stage.label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items Breakdown Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Ordered Items ({(order?.items || []).length})
            </h4>
            <span className="text-xs font-bold text-slate-900 font-mono">
              #{order?.orderNumber}
            </span>
          </div>

          <div className="space-y-2.5">
            {(order?.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="flex items-start gap-2">
                  <CustomerVegBadge type={item.foodType} className="mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">
                      {item.itemName || item.name} × {item.quantity}
                    </span>
                    {item.specialInstructions && (
                      <p className="text-[10px] text-amber-700 italic">
                        "{item.specialInstructions}"
                      </p>
                    )}
                  </div>
                </div>

                <span className="font-bold text-slate-900 shrink-0">
                  {formatCurrency((item.sellingPrice || item.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing & Payment Breakdown */}
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span>- {formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax (5% GST)</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-100">
              <span>Total Amount</span>
              <span className="text-[#16A34A]">{formatCurrency(order.grandTotal)}</span>
            </div>

            {/* Payment Method & Status */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
              <span className="font-semibold text-slate-500">Payment:</span>
              <span className="font-bold">
                {order.paymentMethod === 'online' ? 'Online' : 'Cash on Counter'} •{' '}
                <span className={isPaid ? 'text-emerald-600' : 'text-amber-600'}>
                  {order.paymentStatus === 'paid_online'
                    ? 'Paid Online'
                    : order.paymentStatus === 'paid_cash'
                    ? 'Paid Cash'
                    : 'Pending Payment'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Pay Online Now Button (When order is not yet paid) */}
        {!isPaid && !isCancelled && (
          <button
            type="button"
            onClick={handlePayOnline}
            disabled={isProcessingPayment}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isProcessingPayment ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Launching Payment Gateway...</span>
              </>
            ) : (
              <>
                <FiCreditCard className="w-4 h-4" />
                <span>Pay Online Now ({formatCurrency(order.grandTotal)})</span>
              </>
            )}
          </button>
        )}

        {/* Customer Receipt Download Button (Deterministic Receipt Snapshot, Only when COMPLETED) */}
        {order.status === 'completed' && (
          <button
            type="button"
            onClick={handleDownloadReceipt}
            disabled={isDownloadingReceipt}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isDownloadingReceipt ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Preparing Receipt...</span>
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4" />
                <span>Download Receipt</span>
              </>
            )}
          </button>
        )}

        {/* Back To Menu Button */}
        {restaurant?.slug && (
          <button
            type="button"
            onClick={() => navigate(`/order/${restaurant.slug}/${order.tableNumber}`)}
            className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
            <span>Back to Menu / Order More</span>
          </button>
        )}
      </div>
    </div>
  );
};
