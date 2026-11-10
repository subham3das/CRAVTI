import http from 'http';
import crypto from 'crypto';
import app from '../src/app.js';
import env from '../src/config/env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';
import { Payment } from '../src/models/Payment.js';
import { Order } from '../src/models/Order.js';

const TEST_SECRET = 'whsec_test_craviti_super_secret_key_123';
process.env.RAZORPAY_WEBHOOK_SECRET = TEST_SECRET;

const runTests = async () => {
  console.log('🚀 Starting Razorpay Webhook Verification Suite...\n');

  try {
    await connectDB();
    console.log('✅ Connected to Test Database.');
  } catch (err) {
    console.warn(`⚠️ DB connection warning: ${err.message}. Proceeding with app routing tests...`);
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Test Server listening on port ${port}\n`);

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  // Helper function for HTTP requests
  const request = async ({ method, path, headers = {}, body = null }) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const reqHeaders = { ...headers };
      let payload = body;

      if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
        payload = JSON.stringify(body);
      }
      if (!reqHeaders['Content-Type']) {
        reqHeaders['Content-Type'] = 'application/json';
      }

      if (payload) {
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(
        url,
        {
          method,
          headers: reqHeaders,
        },
        (res) => {
          let resData = '';
          res.on('data', (chunk) => (resData += chunk));
          res.on('end', () => {
            let json = null;
            try {
              json = JSON.parse(resData);
            } catch (_) {}
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: json || resData,
              raw: resData,
            });
          });
        }
      );

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  };

  const generateSignature = (payload, secret = TEST_SECRET) => {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(raw).digest('hex');
  };

  console.log('--- TEST 1: Public Accessibility & Non-POST Method Guard ---');
  // GET /api/payments/webhook should return 405 Method Not Allowed (NOT 401 Unauthorized!)
  const getRes = await request({ method: 'GET', path: '/api/payments/webhook' });
  assert(
    getRes.statusCode === 405,
    'GET /api/payments/webhook returns 405 Method Not Allowed without JWT token',
    `got status ${getRes.statusCode}`
  );
  assert(
    getRes.statusCode !== 401,
    'GET /api/payments/webhook is NOT protected by JWT authentication (does not return 401)',
    `got status ${getRes.statusCode}`
  );

  console.log('\n--- TEST 2: POST /api/payments/webhook without JWT (No Signature) ---');
  const noSigPayload = { event: 'payment.captured' };
  const noSigRes = await request({
    method: 'POST',
    path: '/api/payments/webhook',
    body: noSigPayload,
  });
  assert(
    noSigRes.statusCode === 400,
    'POST without signature returns HTTP 400 Bad Request',
    `got status ${noSigRes.statusCode}`
  );
  assert(
    noSigRes.statusCode !== 401,
    'POST without JWT token is NOT blocked by 401 Unauthorized',
    `got status ${noSigRes.statusCode}`
  );

  console.log('\n--- TEST 3: POST with Invalid Signature ---');
  const invalidSigPayload = { event: 'payment.captured' };
  const invalidSigRes = await request({
    method: 'POST',
    path: '/api/payments/webhook',
    headers: {
      'x-razorpay-signature': 'invalid_cryptographic_signature_value',
    },
    body: invalidSigPayload,
  });
  assert(
    invalidSigRes.statusCode === 400,
    'POST with invalid signature returns HTTP 400 Bad Request',
    `got status ${invalidSigRes.statusCode}`
  );

  console.log('\n--- TEST 4: POST with Valid Signature for payment.captured ---');
  const eventId1 = `evt_test_cap_${Date.now()}`;
  const rzpOrderId1 = `order_test_${Date.now()}`;
  const rzpPaymentId1 = `pay_test_${Date.now()}`;

  const capturedPayload = {
    entity: 'event',
    account_id: 'acc_test123',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: rzpPaymentId1,
          entity: 'payment',
          amount: 250000,
          currency: 'INR',
          status: 'captured',
          order_id: rzpOrderId1,
          method: 'upi',
          bank: 'HDFC',
          fee: 590,
          tax: 90,
          captured_at: Math.floor(Date.now() / 1000),
          notes: {
            restaurantId: new mongoose.Types.ObjectId().toString(),
            orderId: new mongoose.Types.ObjectId().toString(),
            tableId: new mongoose.Types.ObjectId().toString(),
            guestSessionId: 'sess_test_123',
          },
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const capturedRaw = JSON.stringify(capturedPayload);
  const capturedSig = generateSignature(capturedRaw);

  const captureRes = await request({
    method: 'POST',
    path: '/api/payments/webhook',
    headers: {
      'x-razorpay-signature': capturedSig,
      'x-razorpay-event-id': eventId1,
    },
    body: capturedRaw,
  });

  assert(
    captureRes.statusCode === 200,
    'POST with valid signature for payment.captured returns HTTP 200 OK',
    `got status ${captureRes.statusCode}: ${JSON.stringify(captureRes.body)}`
  );
  assert(
    captureRes.body?.status === 'ok',
    'Response payload returns status: "ok"',
    `got ${JSON.stringify(captureRes.body)}`
  );

  console.log('\n--- TEST 5: Idempotency (Duplicate Event ID) ---');
  const duplicateRes = await request({
    method: 'POST',
    path: '/api/payments/webhook',
    headers: {
      'x-razorpay-signature': capturedSig,
      'x-razorpay-event-id': eventId1,
    },
    body: capturedRaw,
  });

  assert(
    duplicateRes.statusCode === 200,
    'Duplicate event returns HTTP 200 OK within 5s',
    `got status ${duplicateRes.statusCode}`
  );
  assert(
    duplicateRes.body?.duplicate === true,
    'Duplicate event correctly flagged as duplicate: true',
    `got ${JSON.stringify(duplicateRes.body)}`
  );

  console.log('\n--- TEST 6: POST for payment.failed ---');
  const eventIdFailed = `evt_test_fail_${Date.now()}`;
  const failedPayload = {
    entity: 'event',
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: `pay_fail_${Date.now()}`,
          order_id: rzpOrderId1,
          amount: 250000,
          currency: 'INR',
          status: 'failed',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment failed due to insufficient funds',
        },
      },
    },
  };
  const failedRaw = JSON.stringify(failedPayload);
  const failedSig = generateSignature(failedRaw);

  const failedRes = await request({
    method: 'POST',
    path: '/api/payments/webhook',
    headers: {
      'x-razorpay-signature': failedSig,
      'x-razorpay-event-id': eventIdFailed,
    },
    body: failedRaw,
  });
  assert(
    failedRes.statusCode === 200,
    'POST for payment.failed returns HTTP 200 OK',
    `got status ${failedRes.statusCode}`
  );

  console.log('\n--- TEST 7: POST for refund.processed ---');
  const eventIdRefund = `evt_test_rfnd_${Date.now()}`;
  const refundPayload = {
    entity: 'event',
    event: 'refund.processed',
    payload: {
      refund: {
        entity: {
          id: `rfnd_${Date.now()}`,
          payment_id: rzpPaymentId1,
          amount: 250000,
          status: 'processed',
          created_at: Math.floor(Date.now() / 1000),
          notes: { reason: 'Customer requested refund' },
        },
      },
    },
  };
  const refundRaw = JSON.stringify(refundPayload);
  const refundSig = generateSignature(refundRaw);

  const refundRes = await request({
    method: 'POST',
    path: '/api/payments/webhook',
    headers: {
      'x-razorpay-signature': refundSig,
      'x-razorpay-event-id': eventIdRefund,
    },
    body: refundRaw,
  });
  assert(
    refundRes.statusCode === 200,
    'POST for refund.processed returns HTTP 200 OK',
    `got status ${refundRes.statusCode}`
  );

  console.log('\n--- TEST 8: Unknown / Unhandled Events Ignored Safely ---');
  const eventIdDummy = `evt_test_dummy_${Date.now()}`;
  const dummyPayload = {
    entity: 'event',
    event: 'subscription.activated',
    payload: {},
  };
  const dummyRaw = JSON.stringify(dummyPayload);
  const dummySig = generateSignature(dummyRaw);

  const dummyRes = await request({
    method: 'POST',
    path: '/api/payments/webhook',
    headers: {
      'x-razorpay-signature': dummySig,
      'x-razorpay-event-id': eventIdDummy,
    },
    body: dummyRaw,
  });
  assert(
    dummyRes.statusCode === 200,
    'POST for unknown event safely returns HTTP 200 OK',
    `got status ${dummyRes.statusCode}`
  );

  console.log('\n--- TEST 9: Authenticated Payment Routes Still Require Auth ---');
  const statusRes = await request({
    method: 'GET',
    path: '/api/payments/gateway-status',
  });
  assert(
    statusRes.statusCode === 401,
    'GET /api/payments/gateway-status correctly requires JWT authentication (returns 401)',
    `got status ${statusRes.statusCode}`
  );

  const singlePaymentRes = await request({
    method: 'GET',
    path: `/api/payments/${new mongoose.Types.ObjectId()}`,
  });
  assert(
    singlePaymentRes.statusCode === 401,
    'GET /api/payments/:paymentId correctly requires JWT authentication (returns 401)',
    `got status ${singlePaymentRes.statusCode}`
  );

  console.log('\n--- TEST 10: /api/payment/webhook alias route ---');
  const aliasRes = await request({
    method: 'POST',
    path: '/api/payment/webhook',
    headers: {
      'x-razorpay-signature': capturedSig,
      'x-razorpay-event-id': `evt_alias_${Date.now()}`,
    },
    body: capturedRaw,
  });
  assert(
    aliasRes.statusCode === 200,
    'POST /api/payment/webhook alias works identically and returns HTTP 200 OK',
    `got status ${aliasRes.statusCode}`
  );

  console.log('\n======================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  server.close();
  await mongoose.connection.close();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
