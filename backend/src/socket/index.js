import { getIO } from '../config/socket.js';

export const emitOrderUpdate = (restaurantId, order) => {
  try {
    const io = getIO();
    io.to(`restaurant_${restaurantId}`).emit('order_updated', order);
  } catch (error) {
    console.error(`Socket emit error: ${error.message}`);
  }
};

