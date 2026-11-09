import { Server } from 'socket.io';
import env from './env.js';

let ioInstance = null;

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  // Allow all localhost and 127.0.0.1 ports
  if (/^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin)) {
    return true;
  }
  // Allow ALL Craviti Vercel production & preview domains (*.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9\-_.]+\.vercel\.app$/.test(origin)) {
    return true;
  }
  // Allow configured origins
  const staticOrigins = [
    env.WEBSITE_URL,
    env.PUBLIC_WEBSITE_URL,
    env.CORS_ORIGIN,
    ...(env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : []),
  ]
    .filter(Boolean)
    .map((o) => o.trim().replace(/\/+$/, ''));

  if (staticOrigins.some((so) => origin.startsWith(so))) {
    return true;
  }

  // Permissive fallback in production for client ordering apps
  return true;
};

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    // 1. Join restaurant room (by restaurantId or restaurantSlug)
    const handleJoinRestaurant = (restaurantIdentifier) => {
      if (restaurantIdentifier) {
        const idStr = restaurantIdentifier.toString();
        socket.join(`restaurant:${idStr}`);
        socket.join(`restaurant_${idStr}`);
      }
    };
    socket.on('join_restaurant', handleJoinRestaurant);
    socket.on('join-restaurant', handleJoinRestaurant);

    // 2. Join order room
    const handleJoinOrder = (orderId) => {
      if (orderId) {
        const idStr = orderId.toString();
        socket.join(`order:${idStr}`);
        socket.join(`order_${idStr}`);
      }
    };
    socket.on('join_order', handleJoinOrder);
    socket.on('join-order', handleJoinOrder);

    // 3. Join table room
    const handleJoinTable = (tableId) => {
      if (tableId) {
        const idStr = tableId.toString();
        socket.join(`table:${idStr}`);
        socket.join(`table_${idStr}`);
      }
    };
    socket.on('join_table', handleJoinTable);
    socket.on('join-table', handleJoinTable);

    // 4. Join admin room (Phase 4.2 Unified Sync)
    const handleJoinAdmin = () => {
      socket.join('admin');
      socket.join('admin-room');
    };
    socket.on('join_admin', handleJoinAdmin);
    socket.on('join-admin', handleJoinAdmin);

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized!');
  }
  return ioInstance;
};

// Broadcast helpers
export const emitToRestaurant = (restaurantId, event, data) => {
  if (!ioInstance || !restaurantId) return;
  const idStr = restaurantId.toString();
  const altEvent = event.includes('.') ? event.replace(/\./g, '-') : event.replace(/-/g, '.');

  ioInstance.to(`restaurant:${idStr}`).to(`restaurant_${idStr}`).emit(event, data);
  if (altEvent !== event) {
    ioInstance.to(`restaurant:${idStr}`).to(`restaurant_${idStr}`).emit(altEvent, data);
  }
};

export const emitToOrder = (orderId, event, data) => {
  if (!ioInstance || !orderId) return;
  const idStr = orderId.toString();
  const altEvent = event.includes('.') ? event.replace(/\./g, '-') : event.replace(/-/g, '.');

  ioInstance.to(`order:${idStr}`).to(`order_${idStr}`).emit(event, data);
  if (altEvent !== event) {
    ioInstance.to(`order:${idStr}`).to(`order_${idStr}`).emit(altEvent, data);
  }
};

export const emitToTable = (tableId, event, data) => {
  if (!ioInstance || !tableId) return;
  const idStr = tableId.toString();
  const altEvent = event.includes('.') ? event.replace(/\./g, '-') : event.replace(/-/g, '.');

  ioInstance.to(`table:${idStr}`).to(`table_${idStr}`).emit(event, data);
  if (altEvent !== event) {
    ioInstance.to(`table:${idStr}`).to(`table_${idStr}`).emit(altEvent, data);
  }
};

export const emitToAdmin = (event, data) => {
  if (!ioInstance) return;
  const altEvent = event.includes('.') ? event.replace(/\./g, '-') : event.replace(/-/g, '.');

  ioInstance.to('admin').to('admin-room').emit(event, data);
  if (altEvent !== event) {
    ioInstance.to('admin').to('admin-room').emit(altEvent, data);
  }
};

export const emitToAll = (event, data) => {
  if (!ioInstance) return;
  const altEvent = event.includes('.') ? event.replace(/\./g, '-') : event.replace(/-/g, '.');

  ioInstance.emit(event, data);
  if (altEvent !== event) {
    ioInstance.emit(altEvent, data);
  }
};

export const emitSyncEvent = ({ event, restaurantId, data = {}, target = 'both' }) => {
  if (!ioInstance) return;
  const payload = {
    event,
    data,
    restaurantId: restaurantId ? restaurantId.toString() : null,
    timestamp: new Date().toISOString(),
  };

  if (target === 'restaurant' && restaurantId) {
    emitToRestaurant(restaurantId, event, payload);
  } else if (target === 'admin') {
    emitToAdmin(event, payload);
  } else if (target === 'all') {
    emitToAll(event, payload);
  } else {
    // default: both
    if (restaurantId) emitToRestaurant(restaurantId, event, payload);
    emitToAdmin(event, payload);
  }
};

export default {
  initSocket,
  getIO,
  emitToRestaurant,
  emitToOrder,
  emitToTable,
  emitToAdmin,
  emitToAll,
  emitSyncEvent,
};
