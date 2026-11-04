import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import {
  createTableService,
  generateTableQRService,
  bulkGenerateQRCodesService,
  regenerateQRService,
  getTablesService,
} from '../services/tableService.js';
import { getCustomerMenuService } from '../services/orderService.js';
import { Table } from '../models/Table.js';
import { QRCodeModel } from '../models/QRCode.js';
import { Restaurant } from '../models/Restaurant.js';
import { migrateDatabaseIndexes } from '../config/migrateIndexes.js';

async function runTests() {
  console.log('====================================================');
  console.log('       CRAVITI QR GENERATION SUITE VERIFICATION');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGO_URI, { dbName: 'craviti' });
  console.log(' Connected to MongoDB Atlas [DB: craviti]');

  // Step 0: Run index migration
  console.log('\n--- Step 0: Ensure Production Database Indexes ---');
  await migrateDatabaseIndexes();

  // Test Restaurant A & Restaurant B
  const restA = await Restaurant.findOne({ slug: 'spice-garden-bistro-z1hj4' });
  const restB = await Restaurant.findOne({ slug: 'test-htkdk' });

  if (!restA || !restB) {
    throw new Error('Required test restaurants not found in database');
  }

  const restAId = restA._id.toString();
  const restBId = restB._id.toString();

  // Clean test tables for high table numbers >= 900
  await Table.deleteMany({
    restaurantId: { $in: [restA._id, restB._id] },
    tableNumber: { $gte: 900 },
  });
  await QRCodeModel.deleteMany({
    restaurantId: { $in: [restA._id, restB._id] },
    tableNumber: { $gte: 900 },
  });

  console.log(`\nTest Restaurant A: ${restA.restaurantName} (${restAId})`);
  console.log(`Test Restaurant B: ${restB.restaurantName} (${restBId})`);

  // =========================================================================
  // TEST 1: Generate QR for the first table
  // =========================================================================
  console.log('\n--- TEST 1: Generate QR for first table (T901) ---');
  const table1 = await createTableService(restAId, {
    tableNumber: 901,
    tableName: 'Test Table 901',
    floor: 'Ground Floor',
    capacity: 2,
  });
  console.log(`✅ Table 901 created: ID = ${table1._id}, TableNumber = ${table1.tableNumber}`);
  console.log(`   QR URL = ${table1.qrUrl}`);
  console.log(`   Has QR Image Base64 = ${Boolean(table1.qrCode && table1.qrCode.startsWith('data:image/png;base64,'))}`);
  const qr1Doc = await QRCodeModel.findOne({ tableId: table1._id, isDeleted: false });
  console.log(`   QRCode Record ID = ${qr1Doc?._id}, Token = ${qr1Doc?.qrToken}`);
  if (!qr1Doc) throw new Error('TEST 1 FAILED: QRCodeModel document missing');

  // =========================================================================
  // TEST 2: Generate QR for second table in the same restaurant
  // (Previously failed with Duplicate restaurantId error!)
  // =========================================================================
  console.log('\n--- TEST 2: Generate QR for second table (T902) in SAME restaurant ---');
  const table2 = await createTableService(restAId, {
    tableNumber: 902,
    tableName: 'Test Table 902',
    floor: 'Ground Floor',
    capacity: 4,
  });
  console.log(`✅ Table 902 created successfully: ID = ${table2._id}, TableNumber = ${table2.tableNumber}`);
  console.log(`   QR URL = ${table2.qrUrl}`);
  const qr2Doc = await QRCodeModel.findOne({ tableId: table2._id, isDeleted: false });
  console.log(`   QRCode Record ID = ${qr2Doc?._id}, Token = ${qr2Doc?.qrToken}`);
  if (!qr2Doc) throw new Error('TEST 2 FAILED: Second QRCodeModel document missing');
  console.log('✅ TEST 2 PASSED: Multiple QR codes in same restaurant created without duplicate key error!');

  // =========================================================================
  // TEST 3: Generate QR for five tables in the same restaurant
  // =========================================================================
  console.log('\n--- TEST 3: Generate QR for five tables in same restaurant (T903-T907) ---');
  const fiveTables = [];
  for (let n = 903; n <= 907; n++) {
    const t = await createTableService(restAId, {
      tableNumber: n,
      tableName: `Batch Table ${n}`,
      floor: 'First Floor',
      capacity: 4,
    });
    fiveTables.push(t);
  }
  console.log(`✅ Successfully created ${fiveTables.length} tables (T903-T907) with individual QR codes!`);
  const qrCountRestA = await QRCodeModel.countDocuments({
    restaurantId: restA._id,
    tableNumber: { $gte: 901, $lte: 907 },
    isDeleted: false,
  });
  console.log(`   Active QRCode documents for Rest A (901-907): ${qrCountRestA}`);
  if (qrCountRestA !== 7) throw new Error(`TEST 3 FAILED: Expected 7 QR codes, found ${qrCountRestA}`);
  console.log('✅ TEST 3 PASSED');

  // =========================================================================
  // TEST 4: Run bulk generation twice (Idempotency verification)
  // =========================================================================
  console.log('\n--- TEST 4: Run bulk generation twice (Idempotency) ---');
  // First run: all tables currently have QRs
  const bulkRes1 = await bulkGenerateQRCodesService(restAId);
  console.log('   Bulk Run 1 Result:', {
    totalTables: bulkRes1.totalTables,
    existingQRCodes: bulkRes1.existingQRCodes,
    newlyGenerated: bulkRes1.newlyGenerated,
    failed: bulkRes1.failed,
  });
  if (bulkRes1.newlyGenerated !== 0) {
    throw new Error(`TEST 4 FAILED: Expected 0 newly generated, got ${bulkRes1.newlyGenerated}`);
  }

  // Clear QR on table 901 to simulate missing QR
  await Table.findByIdAndUpdate(table1._id, { qrUrl: '', qrCode: '' });
  await QRCodeModel.deleteMany({ tableId: table1._id });

  // Run bulk generation again: should detect 1 missing and generate it
  const bulkRes2 = await bulkGenerateQRCodesService(restAId);
  console.log('   Bulk Run 2 (after clearing 1 QR):', {
    totalTables: bulkRes2.totalTables,
    existingQRCodes: bulkRes2.existingQRCodes,
    newlyGenerated: bulkRes2.newlyGenerated,
    failed: bulkRes2.failed,
  });
  if (bulkRes2.newlyGenerated !== 1) {
    throw new Error(`TEST 4 FAILED: Expected 1 newly generated QR, got ${bulkRes2.newlyGenerated}`);
  }

  // Run bulk generation a third time: should have 0 new, all preserved
  const bulkRes3 = await bulkGenerateQRCodesService(restAId);
  console.log('   Bulk Run 3 (immediate repeat):', {
    totalTables: bulkRes3.totalTables,
    existingQRCodes: bulkRes3.existingQRCodes,
    newlyGenerated: bulkRes3.newlyGenerated,
    failed: bulkRes3.failed,
  });
  if (bulkRes3.newlyGenerated !== 0) {
    throw new Error(`TEST 4 FAILED: Repeated bulk generation was not idempotent!`);
  }
  console.log('✅ TEST 4 PASSED: Bulk generation is 100% idempotent and returns accurate counts.');

  // =========================================================================
  // TEST 5: Generate QR for a newly added table
  // =========================================================================
  console.log('\n--- TEST 5: Generate QR for newly added table (T908) ---');
  const tableNew = await createTableService(restAId, {
    tableNumber: 908,
    tableName: 'New Table 908',
    floor: 'Rooftop',
    capacity: 6,
  });
  console.log(`✅ Table 908 created: ID = ${tableNew._id}, QR URL = ${tableNew.qrUrl}`);
  const qrNewDoc = await QRCodeModel.findOne({ tableId: tableNew._id, isDeleted: false });
  if (!qrNewDoc || !qrNewDoc.qrToken) {
    throw new Error('TEST 5 FAILED: QR code not generated for newly added table');
  }
  console.log('✅ TEST 5 PASSED');

  // =========================================================================
  // TEST 6: Attempt to access or modify another restaurant's QR (Tenant Isolation)
  // =========================================================================
  console.log('\n--- TEST 6: Tenant Isolation Check ---');
  let isolationCaught = false;
  try {
    // Restaurant B attempts to regenerate QR for Restaurant A's Table 901
    await regenerateQRService(restBId, table1._id.toString());
  } catch (err) {
    isolationCaught = true;
    console.log(`✅ Expected isolation block caught: ${err.message} (status: ${err.statusCode})`);
  }
  if (!isolationCaught) {
    throw new Error('TEST 6 FAILED: Tenant isolation was breached!');
  }
  console.log('✅ TEST 6 PASSED: Restaurant B cannot access or modify Restaurant A table/QR.');

  // =========================================================================
  // TEST 7: Regenerate an existing QR
  // =========================================================================
  console.log('\n--- TEST 7: Regenerate an existing QR (T901) ---');
  const beforeRegen = await QRCodeModel.findOne({ tableId: table1._id, isDeleted: false });
  const oldToken = beforeRegen.qrToken;
  const oldQrCode = beforeRegen.qrCode;

  const regeneratedTable = await regenerateQRService(restAId, table1._id.toString());
  const afterRegen = await QRCodeModel.findOne({ tableId: table1._id, isDeleted: false });

  console.log(`   Old QR Token: ${oldToken}`);
  console.log(`   New QR Token: ${afterRegen.qrToken}`);
  if (oldToken === afterRegen.qrToken) {
    throw new Error('TEST 7 FAILED: QR Token did not refresh upon explicit regeneration');
  }
  if (regeneratedTable.qrUrl !== afterRegen.qrUrl) {
    throw new Error('TEST 7 FAILED: Table qrUrl out of sync with QRCodeModel');
  }
  console.log('✅ TEST 7 PASSED: Regenerate refreshed token and updated QR code safely.');

  // =========================================================================
  // TEST 8: Verify QR scanning resolves correct restaurant and table
  // =========================================================================
  console.log('\n--- TEST 8: Verify QR scanning customer resolution ---');
  // Customer scans table 901 QR URL (/order/spice-garden-bistro-z1hj4/901)
  const menuData = await getCustomerMenuService(restA.slug, '901', 'guest-test-123', 'dev-123');
  console.log(`   Customer Menu Resolution:`);
  console.log(`   Restaurant Name: ${menuData.restaurant.restaurantName}`);
  console.log(`   Resolved Table Number: ${menuData.table.tableNumber}`);
  console.log(`   Resolved Table ID: ${menuData.table.tableId}`);
  if (menuData.restaurant.restaurantName !== restA.restaurantName) {
    throw new Error('TEST 8 FAILED: Incorrect restaurant resolved');
  }
  if (menuData.table.tableNumber !== 901) {
    throw new Error('TEST 8 FAILED: Incorrect table number resolved');
  }
  console.log('✅ TEST 8 PASSED: QR scan URL resolves correct restaurant and table.');

  // Clean up test tables 901-908
  await Table.deleteMany({
    restaurantId: restA._id,
    tableNumber: { $gte: 900 },
  });
  await QRCodeModel.deleteMany({
    restaurantId: restA._id,
    tableNumber: { $gte: 900 },
  });
  console.log('\n🧹 Cleaned up temporary test tables.');

  console.log('\n====================================================');
  console.log('     🎉 ALL 8 TEST SUITE CHECKS PASSED (100%)');
  console.log('====================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});

