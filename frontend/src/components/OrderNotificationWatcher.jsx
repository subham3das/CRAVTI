import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  playNewOrderSound,
  showBackgroundDesktopNotification,
  requestDesktopNotificationPermission,
  unlockAudio,
} from '../utils/soundNotification';
import env from '../config/env.js';

/**
 * Global Order Notification Watcher
 *
 * Persistently mounted at the DashboardLayout level.
 * Receives all real-time order notifications (QR, Online, Cash, Manual Billing)
 * across EVERY restaurant page (Dashboard, Orders, Menu, Tables, Analytics, Settings, etc.)
 * and even when the browser tab is inactive in the background.
 */
export const OrderNotificationWatcher = () => {
  const { restaurant } = useAuth();
  const { settings } = useSettings();
  const socketRef = useRef(null);

  // Set of recently notified order IDs to prevent duplicate sound/toast
  // when backend broadcasts both 'new-order' and 'order.created'
  const processedOrderIdsRef = useRef(new Set());

  // Proactively request desktop notification permission on first interaction
  useEffect(() => {
    requestDesktopNotificationPermission().catch(() => {});
  }, []);

  useEffect(() => {
    const restaurantId = restaurant?._id;
    if (!restaurantId) return;

    const socketUrl = env.SOCKET_URL;

    // Initialize dedicated persistent socket for restaurant notifications
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Join restaurant rooms on initial connection and upon reconnection
    const joinRooms = () => {
      socket.emit('join-restaurant', restaurantId);
    };

    socket.on('connect', joinRooms);
    socket.on('reconnect', joinRooms);
    joinRooms(); // Emit immediately if socket connects synchronously

    // Unified order event handler
    const handleIncomingOrder = (payload) => {
      if (!payload) return;

      // Extract order object from various payload formats
      const order = payload.order || payload;
      const orderId = order._id || order.id || order.orderNumber;

      if (!orderId) return;

      const orderKey = String(orderId);

      // Deduplication check: prevent multiple sounds for the same order within 30 seconds
      if (processedOrderIdsRef.current.has(orderKey)) {
        return;
      }

      processedOrderIdsRef.current.add(orderKey);
      setTimeout(() => {
        processedOrderIdsRef.current.delete(orderKey);
      }, 30000);

      // 1. Play Canonical Notification Sound
      const soundEnabled = settings?.notificationSound !== false;
      if (soundEnabled) {
        unlockAudio();
        playNewOrderSound();
      }

      // 2. Display Rich Toast Notification
      const orderNum = order.orderNumber ? `#${order.orderNumber}` : 'New Order';
      const tableInfo = order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway / POS';
      const grandTotal = order.grandTotal !== undefined ? ` • ₹${order.grandTotal}` : '';

      toast(
        (t) => (
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              toast.dismiss(t.id);
              if (typeof window !== 'undefined' && window.location.pathname !== '/orders') {
                window.location.href = '/orders';
              }
            }}
          >
            <span className="text-xl">🔔</span>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-sm">
                {orderNum} ({tableInfo})
              </span>
              <span className="text-xs text-slate-500">
                Incoming order received{grandTotal}. Click to view.
              </span>
            </div>
          </div>
        ),
        {
          duration: 6000,
          position: 'top-right',
          style: {
            borderLeft: '4px solid #16A34A',
            background: '#FFFFFF',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        }
      );

      // 3. Desktop Background Notification
      showBackgroundDesktopNotification({
        title: `CRAVITI: Order ${orderNum} (${tableInfo})`,
        body: `New incoming order received${grandTotal}. Open dashboard to accept.`,
      });

      // 4. Dispatch DOM custom event so in-page views (Orders, Dashboard) update state
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('craviti:new-order-received', { detail: order })
        );
      }
    };

    // Listen to all canonical new order events from backend
    socket.on('new-order', handleIncomingOrder);
    socket.on('order.created', handleIncomingOrder);
    socket.on('manual-order-created', handleIncomingOrder);

    return () => {
      socket.off('connect', joinRooms);
      socket.off('reconnect', joinRooms);
      socket.off('new-order', handleIncomingOrder);
      socket.off('order.created', handleIncomingOrder);
      socket.off('manual-order-created', handleIncomingOrder);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurant?._id, settings?.notificationSound]);

  return null; // Headless component
};

export default OrderNotificationWatcher;
