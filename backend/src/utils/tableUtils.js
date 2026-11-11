import mongoose from 'mongoose';
import { Table } from '../models/Table.js';

/**
 * Robust, defensive restaurant table resolver
 * Prevents:
 * 1. Treating 24-character hexadecimal MongoDB ObjectIds as table numbers (e.g. parseInt('6720abc...', 10) === 6720)
 * 2. Unhandled null, undefined, or empty string table identifiers
 * 3. Failing when only tableNumber or only tableId is passed
 */
export const resolveRestaurantTable = async (restaurantId, rawIdentifier) => {
  if (!restaurantId || !rawIdentifier) return null;

  const idStr = String(rawIdentifier).trim();
  if (!idStr || idStr === 'undefined' || idStr === 'null') return null;

  const restId = mongoose.Types.ObjectId.isValid(restaurantId)
    ? new mongoose.Types.ObjectId(restaurantId)
    : restaurantId;

  // 1. Strict 24-character hex ObjectId lookup
  if (mongoose.Types.ObjectId.isValid(idStr) && idStr.length === 24) {
    const tableById = await Table.findOne({
      _id: new mongoose.Types.ObjectId(idStr),
      restaurantId: restId,
      isDeleted: { $ne: true },
    });
    if (tableById) return tableById;
  }

  // 2. Strict integer numeric tableNumber lookup (ONLY if string contains strictly digits)
  if (/^\d+$/.test(idStr)) {
    const num = parseInt(idStr, 10);
    const tableByNum = await Table.findOne({
      tableNumber: num,
      restaurantId: restId,
      isDeleted: { $ne: true },
    });
    if (tableByNum) return tableByNum;
  }

  // 3. Fallback: Lookup by tableName (e.g. "Table 1", "T-1", "Outdoor 2") or qrToken
  const tableByFallback = await Table.findOne({
    restaurantId: restId,
    isDeleted: { $ne: true },
    $or: [
      { tableName: idStr },
      { qrToken: idStr },
    ],
  });

  return tableByFallback;
};

export default {
  resolveRestaurantTable,
};

