import { Server } from 'socket.io';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    // 1. Join restaurant room
    const handleJoinRestaurant = (restaurantId) => {
      if (restaurantId) {
        socket.join(`restaurant:${restaurantId}`);
        socket.join(`restaurant_${restaurantId}`);
      }
    };
    socket.on('join_restaurant', handleJoinRestaurant);
    socket.on('join-restaurant', handleJoinRestaurant);

    // 2. Join order room
    const handleJoinOrder = (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        socket.join(`order_${orderId}`);
      }
    };
    socket.on('join_order', handleJoinOrder);
    socket.on('join-order', handleJoinOrder);

    // 3. Join table room
    const handleJoinTable = (tableId) => {
      if (tableId) {
        socket.join(`table:${tableId}`);
        socket.join(`table_${tableId}`);
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
  ioInstance.to(`restaurant:${idStr}`).to(`restaurant_${idStr}`).emit(event, data);
};

export const emitToAdmin = (event, data) => {
  if (!ioInstance) return;
  ioInstance.to('admin').to('admin-room').emit(event, data);
};

export const emitToAll = (event, data) => {
  if (!ioInstance) return;
  ioInstance.emit(event, data);
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

export const emitToOrder = (orderId, event, data) => {
  if (!ioInstance || !orderId) return;
  const idStr = orderId.toString();
  ioInstance.to(`order:${idStr}`).to(`order_${idStr}`).emit(event, data);
};

export const emitToTable = (tableId, event, data) => {
  if (!ioInstance || !tableId) return;
  const idStr = tableId.toString();
  ioInstance.to(`table:${idStr}`).to(`table_${idStr}`).emit(event, data);
};
