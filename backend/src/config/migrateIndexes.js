import mongoose from 'mongoose';
import crypto from 'crypto';
import { QRCodeModel } from '../models/QRCode.js';
import { Table } from '../models/Table.js';

/**
 * Production-Safe Database Index Migration
 * Ensures compound indexes are properly configured and soft-deleted records do not block operations.
 */
export const migrateDatabaseIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // =========================================================================
    // 1. TABLES COLLECTION INDEX MIGRATION
    // =========================================================================
    const tableIndexes = await db.collection('tables').indexes().catch(() => []);
    const tableIdxMap = new Map(tableIndexes.map((i) => [i.name, i]));

    // Check if tableNumber compound index lacks partialFilterExpression
    const oldTableNumIdx = tableIdxMap.get('restaurantId_1_tableNumber_1');
    const needsTableNumIdxUpdate =
      !oldTableNumIdx ||
      !oldTableNumIdx.partialFilterExpression ||
      oldTableNumIdx.partialFilterExpression.isDeleted !== false;

    if (oldTableNumIdx && needsTableNumIdxUpdate) {
      console.log('🔄 Migrating tables collection index: dropping legacy restaurantId_1_tableNumber_1...');
      await db.collection('tables').dropIndex('restaurantId_1_tableNumber_1');
    }

    if (needsTableNumIdxUpdate) {
      console.log('✅ Creating modern partial index on tables { restaurantId: 1, tableNumber: 1 } (isDeleted: false)...');
      await db.collection('tables').createIndex(
        { restaurantId: 1, tableNumber: 1 },
        {
          name: 'restaurantId_1_tableNumber_1',
          unique: true,
          partialFilterExpression: { isDeleted: false },
        }
      );
    }

    // Check if restaurantId has an accidental unique constraint on tables
    const restIdIdx = tableIdxMap.get('restaurantId_1');
    if (restIdIdx && restIdIdx.unique) {
      console.log('⚠️ Found incorrect unique index on tables.restaurantId. Dropping...');
      await db.collection('tables').dropIndex('restaurantId_1');
      await db.collection('tables').createIndex({ restaurantId: 1 }, { name: 'restaurantId_1' });
      console.log('✅ Recreated non-unique index on tables.restaurantId');
    }

    // =========================================================================
    // 2. QRCODES COLLECTION INDEX MIGRATION
    // =========================================================================
    const collections = await db.listCollections().toArray();
    const hasQRCodes = collections.some((c) => c.name === 'qrcodes');

    if (hasQRCodes) {
      const qrIndexes = await db.collection('qrcodes').indexes().catch(() => []);
      for (const idx of qrIndexes) {
        // Drop any rogue single-field unique index on restaurantId
        if (idx.name === 'restaurantId_1' && idx.unique) {
          console.log('⚠️ Found incorrect unique index on qrcodes.restaurantId. Dropping...');
          await db.collection('qrcodes').dropIndex('restaurantId_1');
          await db.collection('qrcodes').createIndex({ restaurantId: 1 }, { name: 'restaurantId_1' });
          console.log('✅ Recreated non-unique index on qrcodes.restaurantId');
        }
      }
    }

    // Trigger Mongoose Schema Index Sync for QRCodeModel
    await QRCodeModel.syncIndexes();
    await Table.syncIndexes();

    // =========================================================================
    // 3. BACKFILL ACTIVE TABLES TO QRCODES COLLECTION
    // =========================================================================
    const activeTables = await Table.find({
      isDeleted: false,
      qrUrl: { $exists: true, $ne: '' },
    }).lean();

    for (const table of activeTables) {
      const existingQR = await QRCodeModel.findOne({
        tableId: table._id,
        isDeleted: false,
      });

      if (!existingQR) {
        const qrToken = crypto.randomBytes(16).toString('hex');
        const newQR = await QRCodeModel.create({
          restaurantId: table.restaurantId,
          tableId: table._id,
          tableNumber: table.tableNumber,
          qrToken,
          qrUrl: table.qrUrl,
          qrCode: table.qrCode || '',
          isActive: table.isActive !== false,
        });

        await Table.findByIdAndUpdate(table._id, { qrId: newQR._id });
      }
    }

    console.log('✅ Production Database indexes & QR synchronization verified.');
  } catch (err) {
    console.error('⚠️ Index migration error (non-fatal):', err.message);
  }
};

export default migrateDatabaseIndexes;

