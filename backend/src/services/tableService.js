import QRCode from 'qrcode';
import crypto from 'crypto';
import { ZipArchive } from 'archiver';
import { Table } from '../models/Table.js';
import { QRCodeModel } from '../models/QRCode.js';
import { Restaurant } from '../models/Restaurant.js';
import env from '../config/env.js';

const getFrontendBaseUrl = () => {
  if (process.env.QR_FRONTEND_URL) {
    return process.env.QR_FRONTEND_URL.replace(/\/+$/, '');
  }
  const clientUrl = env.CLIENT_URL || process.env.CLIENT_URL;
  if (clientUrl && !clientUrl.includes('localhost') && !clientUrl.includes('127.0.0.1')) {
    return clientUrl.replace(/\/+$/, '');
  }
  return 'https://cravti.vercel.app';
};

async function getSlug(restaurantId) {
  const r = await Restaurant.findById(restaurantId).select('slug restaurantName');
  if (!r) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }
  // Fallback if record has no slug
  if (!r.slug) {
    const baseSlug = r.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${suffix}`;
    await Restaurant.findByIdAndUpdate(restaurantId, { slug });
    return slug;
  }
  return r.slug;
}

async function buildQR(slug, tableNumber, existingToken = null) {
  const qrToken = existingToken || crypto.randomBytes(16).toString('hex');
  const baseUrl = getFrontendBaseUrl();
  const qrUrl = `${baseUrl}/order/${slug}/${tableNumber}`;
  const qrCode = await QRCode.toDataURL(qrUrl, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
  return { qrUrl, qrCode, qrToken };
}

/**
 * 1. Fetch Paginated Tables with QR status
 */
export const getTablesService = async (restaurantId, query) => {
  const { search = '', floor = '', status = '', sort = 'newest', page = 1, limit = 20 } = query;
  const filter = { restaurantId, isDeleted: { $ne: true } };

  if (search) {
    const n = parseInt(search, 10);
    filter.$or = [
      { tableName: { $regex: search, $options: 'i' } },
      ...(isNaN(n) ? [] : [{ tableNumber: n }]),
    ];
  }
  if (floor) filter.floor = { $regex: floor, $options: 'i' };
  if (status) filter.status = status;

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    number: { tableNumber: 1 },
  };
  const sortOpt = sortMap[sort] || { tableNumber: 1 };

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [tables, total] = await Promise.all([
    Table.find(filter)
      .populate('qrId', 'qrToken scansCount lastScannedAt')
      .sort(sortOpt)
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Table.countDocuments(filter),
  ]);

  return {
    tables,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  };
};

/**
 * 2. Fetch Aggregated Table & QR Statistics
 */
export const getTableStatsService = async (restaurantId) => {
  const [total, available, occupied, reserved, qrGenerated] = await Promise.all([
    Table.countDocuments({ restaurantId, isDeleted: { $ne: true } }),
    Table.countDocuments({ restaurantId, status: 'available', isActive: true, isDeleted: { $ne: true } }),
    Table.countDocuments({ restaurantId, status: 'occupied', isDeleted: { $ne: true } }),
    Table.countDocuments({ restaurantId, status: 'reserved', isDeleted: { $ne: true } }),
    Table.countDocuments({ restaurantId, qrUrl: { $ne: '' }, isDeleted: { $ne: true } }),
  ]);
  return { total, available, occupied, reserved, qrGenerated };
};

/**
 * 3. Create a Single Table (Idempotent revival of soft-deleted numbers)
 */
export const createTableService = async (restaurantId, data) => {
  const { tableNumber, tableName = '', floor = 'Ground Floor', capacity = 4 } = data;
  const num = parseInt(tableNumber, 10);

  if (isNaN(num) || num < 1) {
    const error = new Error('Valid positive table number is required.');
    error.statusCode = 400;
    throw error;
  }

  // Check if active non-deleted table already exists
  const existingActive = await Table.findOne({
    restaurantId,
    tableNumber: num,
    isDeleted: false,
  });

  if (existingActive) {
    const error = new Error(`Table #${num} already exists in your restaurant.`);
    error.statusCode = 409;
    throw error;
  }

  const slug = await getSlug(restaurantId);
  const { qrUrl, qrCode, qrToken } = await buildQR(slug, num);

  // Check if a soft-deleted table with this tableNumber exists — revive it safely!
  const deletedTable = await Table.findOne({
    restaurantId,
    tableNumber: num,
    isDeleted: true,
  });

  let table;
  if (deletedTable) {
    deletedTable.isDeleted = false;
    deletedTable.deletedAt = null;
    deletedTable.deletedBy = null;
    deletedTable.tableName = tableName || deletedTable.tableName;
    deletedTable.floor = floor || deletedTable.floor;
    deletedTable.capacity = capacity || deletedTable.capacity;
    deletedTable.status = 'available';
    deletedTable.isActive = true;
    deletedTable.qrUrl = qrUrl;
    deletedTable.qrCode = qrCode;

    // Create or update QRCodeModel
    let qrDoc = await QRCodeModel.findOne({ tableId: deletedTable._id, restaurantId });
    if (!qrDoc) {
      qrDoc = await QRCodeModel.create({
        restaurantId,
        tableId: deletedTable._id,
        tableNumber: num,
        qrToken,
        qrUrl,
        qrCode,
        isActive: true,
        isDeleted: false,
      });
    } else {
      qrDoc.isDeleted = false;
      qrDoc.deletedAt = null;
      qrDoc.qrUrl = qrUrl;
      qrDoc.qrCode = qrCode;
      qrDoc.tableNumber = num;
      await qrDoc.save();
    }

    deletedTable.qrId = qrDoc._id;
    await deletedTable.save();
    table = deletedTable;
  } else {
    // Brand new table creation
    table = await Table.create({
      restaurantId,
      tableNumber: num,
      tableName,
      floor,
      capacity,
      qrUrl,
      qrCode,
      isActive: true,
      status: 'available',
    });

    const qrDoc = await QRCodeModel.create({
      restaurantId,
      tableId: table._id,
      tableNumber: num,
      qrToken,
      qrUrl,
      qrCode,
      isActive: true,
    });

    table.qrId = qrDoc._id;
    await table.save();
  }

  return table;
};

/**
 * 4. Bulk Create Tables
 */
export const bulkCreateTablesService = async (restaurantId, { count, floor = 'Ground Floor', capacity = 4 }) => {
  const targetCount = parseInt(count, 10);
  if (isNaN(targetCount) || targetCount < 1) {
    const error = new Error('Valid table count is required.');
    error.statusCode = 400;
    throw error;
  }

  const slug = await getSlug(restaurantId);

  // Find non-deleted tables to discover allocated numbers
  const existingActive = await Table.find({ restaurantId, isDeleted: false })
    .select('tableNumber')
    .lean();
  const activeNums = new Set(existingActive.map((t) => t.tableNumber));

  // Find soft-deleted tables for potential revival
  const existingDeleted = await Table.find({ restaurantId, isDeleted: true }).lean();
  const deletedMap = new Map(existingDeleted.map((t) => [t.tableNumber, t]));

  let createdCount = 0;
  let candidateNum = 1;

  while (createdCount < targetCount && candidateNum <= 500) {
    if (activeNums.has(candidateNum)) {
      candidateNum++;
      continue;
    }

    const { qrUrl, qrCode, qrToken } = await buildQR(slug, candidateNum);

    if (deletedMap.has(candidateNum)) {
      const delDoc = deletedMap.get(candidateNum);
      await Table.findByIdAndUpdate(delDoc._id, {
        isDeleted: false,
        deletedAt: null,
        floor,
        capacity,
        status: 'available',
        isActive: true,
        qrUrl,
        qrCode,
      });

      await QRCodeModel.findOneAndUpdate(
        { tableId: delDoc._id, restaurantId },
        {
          restaurantId,
          tableId: delDoc._id,
          tableNumber: candidateNum,
          qrToken,
          qrUrl,
          qrCode,
          isActive: true,
          isDeleted: false,
          deletedAt: null,
        },
        { upsert: true, new: true }
      );
    } else {
      const newTable = await Table.create({
        restaurantId,
        tableNumber: candidateNum,
        tableName: '',
        floor,
        capacity,
        qrUrl,
        qrCode,
        isActive: true,
        status: 'available',
      });

      const qrDoc = await QRCodeModel.create({
        restaurantId,
        tableId: newTable._id,
        tableNumber: candidateNum,
        qrToken,
        qrUrl,
        qrCode,
        isActive: true,
      });

      await Table.findByIdAndUpdate(newTable._id, { qrId: qrDoc._id });
    }

    activeNums.add(candidateNum);
    createdCount++;
    candidateNum++;
  }

  return { created: createdCount, totalActive: activeNums.size };
};

/**
 * 5. Generate / Idempotent Fetch QR for a Single Table
 */
export const generateTableQRService = async (restaurantId, tableId, { force = false } = {}) => {
  const table = await Table.findOne({ _id: tableId, restaurantId, isDeleted: false });
  if (!table) {
    const error = new Error('Table not found or has been deleted.');
    error.statusCode = 404;
    throw error;
  }

  // Idempotency: If table already has an active QR code and force is false, return it!
  if (!force && table.qrUrl && table.qrCode) {
    const existingQR = await QRCodeModel.findOne({ tableId, restaurantId, isDeleted: false });
    if (existingQR) {
      return { table, qrCode: existingQR, reused: true };
    }
  }

  const slug = await getSlug(restaurantId);
  const { qrUrl, qrCode, qrToken } = await buildQR(slug, table.tableNumber);

  table.qrUrl = qrUrl;
  table.qrCode = qrCode;

  const qrDoc = await QRCodeModel.findOneAndUpdate(
    { tableId: table._id, restaurantId },
    {
      restaurantId,
      tableId: table._id,
      tableNumber: table.tableNumber,
      qrToken,
      qrUrl,
      qrCode,
      isActive: table.isActive !== false,
      isDeleted: false,
      deletedAt: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  table.qrId = qrDoc._id;
  await table.save();

  return { table, qrCode: qrDoc, reused: false };
};

/**
 * 6. Explicit QR Regeneration
 */
export const regenerateQRService = async (restaurantId, tableId) => {
  const result = await generateTableQRService(restaurantId, tableId, { force: true });
  return result.table;
};

/**
 * 7. Bulk QR Code Generation
 * Generates QR codes ONLY for tables missing them.
 * Preserves all existing active QR codes.
 * Returns precise metrics: totalTables, existingQRCodes, newlyGenerated, failed.
 */
export const bulkGenerateQRCodesService = async (restaurantId) => {
  const tables = await Table.find({ restaurantId, isDeleted: false }).sort({ tableNumber: 1 });
  const totalTables = tables.length;

  if (totalTables === 0) {
    return {
      totalTables: 0,
      existingQRCodes: 0,
      newlyGenerated: 0,
      failed: 0,
      tables: [],
    };
  }

  const slug = await getSlug(restaurantId);
  let existingQRCodes = 0;
  let newlyGenerated = 0;
  let failed = 0;
  const updatedTables = [];

  for (const table of tables) {
    try {
      const hasValidQR = Boolean(table.qrUrl && table.qrCode);
      const existingDoc = hasValidQR
        ? await QRCodeModel.findOne({ tableId: table._id, restaurantId, isDeleted: false })
        : null;

      if (hasValidQR && existingDoc) {
        existingQRCodes++;
        updatedTables.push(table);
      } else {
        // Generate missing QR code
        const { qrUrl, qrCode, qrToken } = await buildQR(slug, table.tableNumber);
        table.qrUrl = qrUrl;
        table.qrCode = qrCode;

        const qrDoc = await QRCodeModel.findOneAndUpdate(
          { tableId: table._id, restaurantId },
          {
            restaurantId,
            tableId: table._id,
            tableNumber: table.tableNumber,
            qrToken,
            qrUrl,
            qrCode,
            isActive: table.isActive !== false,
            isDeleted: false,
            deletedAt: null,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        table.qrId = qrDoc._id;
        await table.save();
        newlyGenerated++;
        updatedTables.push(table);
      }
    } catch (err) {
      console.error(`Failed to generate QR for Table #${table.tableNumber}:`, err.message);
      failed++;
    }
  }

  return {
    totalTables,
    existingQRCodes,
    newlyGenerated,
    failed,
    tables: updatedTables,
  };
};

/**
 * 8. Update Table Metadata
 */
export const updateTableService = async (restaurantId, tableId, data) => {
  const table = await Table.findOne({ _id: tableId, restaurantId, isDeleted: false });
  if (!table) {
    const error = new Error('Table not found');
    error.statusCode = 404;
    throw error;
  }

  // If tableNumber changed, check uniqueness
  if (data.tableNumber && parseInt(data.tableNumber, 10) !== table.tableNumber) {
    const newNum = parseInt(data.tableNumber, 10);
    const conflict = await Table.findOne({
      restaurantId,
      tableNumber: newNum,
      isDeleted: false,
      _id: { $ne: tableId },
    });
    if (conflict) {
      const error = new Error(`Table #${newNum} already exists in your restaurant.`);
      error.statusCode = 409;
      throw error;
    }
    table.tableNumber = newNum;

    // Update QR url for new tableNumber
    const slug = await getSlug(restaurantId);
    const { qrUrl, qrCode, qrToken } = await buildQR(slug, newNum);
    table.qrUrl = qrUrl;
    table.qrCode = qrCode;

    await QRCodeModel.findOneAndUpdate(
      { tableId: table._id, restaurantId },
      { tableNumber: newNum, qrUrl, qrCode, qrToken },
      { upsert: true }
    );
  }

  const allowed = ['tableName', 'floor', 'capacity', 'status', 'isActive'];
  allowed.forEach((f) => {
    if (data[f] !== undefined) table[f] = data[f];
  });

  await table.save();
  return table;
};

/**
 * 9. Soft Delete Table and Associated QR
 */
export const deleteTableService = async (restaurantId, tableId) => {
  const table = await Table.findOne({ _id: tableId, restaurantId, isDeleted: false });
  if (!table) {
    const error = new Error('Table not found');
    error.statusCode = 404;
    throw error;
  }

  table.isDeleted = true;
  table.deletedAt = new Date();
  await table.save();

  // Soft delete corresponding QRCode record
  await QRCodeModel.updateMany(
    { tableId, restaurantId },
    { isDeleted: true, deletedAt: new Date() }
  );

  return { success: true, tableId };
};

/**
 * 10. Toggle Table Active Status
 */
export const toggleTableActiveService = async (restaurantId, tableId) => {
  const table = await Table.findOne({ _id: tableId, restaurantId, isDeleted: false });
  if (!table) {
    const error = new Error('Table not found');
    error.statusCode = 404;
    throw error;
  }

  table.isActive = !table.isActive;
  if (!table.isActive) table.status = 'disabled';
  else if (table.status === 'disabled') table.status = 'available';

  await table.save();

  // Sync active status with QRCodeModel
  await QRCodeModel.updateMany(
    { tableId, restaurantId },
    { isActive: table.isActive }
  );

  return table;
};

/**
 * 11. Export All Active QR Codes as Zip Archive
 */
export const exportAllQRZipService = async (restaurantId, res) => {
  const tables = await Table.find({
    restaurantId,
    isActive: true,
    isDeleted: false,
  }).sort({ tableNumber: 1 });

  if (!tables.length) {
    const error = new Error('No active tables found to export.');
    error.statusCode = 404;
    throw error;
  }

  const slug = await getSlug(restaurantId);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="craviti-qr-codes.zip"');

  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.pipe(res);

  for (const table of tables) {
    let url = table.qrUrl;
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
      url = `${getFrontendBaseUrl()}/order/${slug}/${table.tableNumber}`;
    }
    const buffer = await QRCode.toBuffer(url, { width: 400, margin: 2 });
    const label = table.tableName
      ? `${table.tableName.replace(/[^a-zA-Z0-9_-]/g, '_')}-T${table.tableNumber}`
      : `Table-${table.tableNumber}`;
    archive.append(buffer, { name: `${label}.png` });
  }

  await archive.finalize();
};
