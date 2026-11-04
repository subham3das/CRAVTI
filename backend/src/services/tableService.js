import QRCode from 'qrcode';
import { ZipArchive } from 'archiver';
import { Table } from '../models/Table.js';
import { Restaurant } from '../models/Restaurant.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function getSlug(restaurantId) {
  const r = await Restaurant.findById(restaurantId).select('slug restaurantName');
  if (!r) throw Object.assign(new Error('Restaurant not found'), { statusCode: 404 });
  // Fallback if old record has no slug
  if (!r.slug) {
    const baseSlug = r.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${suffix}`;
    await Restaurant.findByIdAndUpdate(restaurantId, { slug });
    return slug;
  }
  return r.slug;
}

async function buildQR(slug, tableNumber) {
  const qrUrl = `${CLIENT_URL}/order/${slug}/${tableNumber}`;
  const qrCode = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });
  return { qrUrl, qrCode };
}

export const getTablesService = async (restaurantId, query) => {
  const { search = '', floor = '', status = '', sort = 'newest', page = 1, limit = 20 } = query;
  const filter = { restaurantId, isDeleted: { $ne: true } };
  if (search) {
    const n = parseInt(search);
    filter.$or = [
      { tableName: { $regex: search, $options: 'i' } },
      ...(isNaN(n) ? [] : [{ tableNumber: n }]),
    ];
  }
  if (floor) filter.floor = { $regex: floor, $options: 'i' };
  if (status) filter.status = status;

  const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, number: { tableNumber: 1 } };
  const sortOpt = sortMap[sort] || { tableNumber: 1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [tables, total] = await Promise.all([
    Table.find(filter).sort(sortOpt).skip(skip).limit(parseInt(limit)),
    Table.countDocuments(filter),
  ]);
  return { tables, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) };
};

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

export const createTableService = async (restaurantId, data) => {
  const { tableNumber, tableName = '', floor = 'Ground Floor', capacity = 4 } = data;
  const slug = await getSlug(restaurantId);
  const { qrUrl, qrCode } = await buildQR(slug, tableNumber);
  const table = await Table.create({ restaurantId, tableNumber, tableName, floor, capacity, qrUrl, qrCode });
  return table;
};

export const bulkCreateTablesService = async (restaurantId, { count, floor = 'Ground Floor', capacity = 4 }) => {
  const slug = await getSlug(restaurantId);
  const existing = await Table.find({ restaurantId }).select('tableNumber').lean();
  const existingNums = new Set(existing.map(t => t.tableNumber));
  const toCreate = [];
  for (let i = 1; i <= count; i++) {
    if (!existingNums.has(i)) toCreate.push(i);
  }
  const tables = await Promise.all(
    toCreate.map(async (n) => {
      const { qrUrl, qrCode } = await buildQR(slug, n);
      return { restaurantId, tableNumber: n, tableName: '', floor, capacity, qrUrl, qrCode };
    })
  );
  if (!tables.length) return { created: 0, skipped: count };
  const created = await Table.insertMany(tables);
  return { created: created.length, skipped: count - created.length };
};

export const updateTableService = async (restaurantId, tableId, data) => {
  const table = await Table.findOne({ _id: tableId, restaurantId });
  if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
  const allowed = ['tableName', 'floor', 'capacity', 'status', 'isActive'];
  allowed.forEach(f => { if (data[f] !== undefined) table[f] = data[f]; });
  await table.save();
  return table;
};

export const deleteTableService = async (restaurantId, tableId) => {
  const table = await Table.findOne({ _id: tableId, restaurantId, isDeleted: { $ne: true } });
  if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
  table.isDeleted = true;
  table.deletedAt = new Date();
  await table.save();
  return table;
};

export const toggleTableActiveService = async (restaurantId, tableId) => {
  const table = await Table.findOne({ _id: tableId, restaurantId });
  if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
  table.isActive = !table.isActive;
  if (!table.isActive) table.status = 'disabled';
  else if (table.status === 'disabled') table.status = 'available';
  await table.save();
  return table;
};

export const regenerateQRService = async (restaurantId, tableId) => {
  const table = await Table.findOne({ _id: tableId, restaurantId });
  if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
  const slug = await getSlug(restaurantId);
  const { qrUrl, qrCode } = await buildQR(slug, table.tableNumber);
  table.qrUrl = qrUrl;
  table.qrCode = qrCode;
  await table.save();
  return table;
};

export const exportAllQRZipService = async (restaurantId, res) => {
  const tables = await Table.find({ restaurantId, isActive: true }).sort({ tableNumber: 1 });
  if (!tables.length) throw Object.assign(new Error('No active tables'), { statusCode: 404 });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="craviti-qr-codes.zip"');

  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.pipe(res);

  for (const table of tables) {
    if (!table.qrUrl) continue;
    const buffer = await QRCode.toBuffer(table.qrUrl, { width: 400, margin: 2 });
    const label = table.tableName ? `${table.tableName}-T${table.tableNumber}` : `Table-${table.tableNumber}`;
    archive.append(buffer, { name: `${label}.png` });
  }

  await archive.finalize();
};
