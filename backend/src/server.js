import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables reliably from backend/.env or root/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { validateEnv } from './config/validateEnv.js';
validateEnv();

import env from './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { seedDefaultAdmin } from './services/adminService.js';

const DEFAULT_PORT = env.PORT;

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Seed Default Admin if needed
    await seedDefaultAdmin();

    // 2. Create HTTP server & Socket.io
    const server = http.createServer(app);
    initSocket(server);

    const tryListen = (port) => {
      server.listen(port, () => {
        const envName = env.NODE_ENV;
        console.log(`
==========================================
        CRAVITI API SERVER
==========================================
Environment : ${envName}
Port        : ${port}
Database    : Connected
Status      : Healthy
Version     : 1.0.0
==========================================`);
      });

      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`⚠️ Port ${port} is currently in use. Attempting port ${port + 1}...`);
          tryListen(port + 1);
        } else {
          console.error(`❌ Server error: ${err.message}`);
          process.exit(1);
        }
      });
    };

    tryListen(DEFAULT_PORT);

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      console.error(`💥 Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`❌ Server Initialization Failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
