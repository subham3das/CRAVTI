import mongoose from 'mongoose';
import env from '../config/env.js';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatUptime = (seconds) => {
  const sec = Math.floor(seconds || 0);
  const d = Math.floor(sec / (3600 * 24));
  const h = Math.floor((sec % (3600 * 24)) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

/**
 * 1. Root Endpoint - GET /
 */
export const getRoot = (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Craviti API',
    status: 'Healthy',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    documentation: '/api',
    health: '/health',
  });
};

/**
 * 2. Detailed Health Endpoint - GET /health
 */
export const getHealth = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const mem = process.memoryUsage();
  const uptimeSec = process.uptime();

  res.status(200).json({
    status: isDbConnected ? 'Healthy' : 'Degraded',
    uptime: formatUptime(uptimeSec),
    uptimeSeconds: Math.floor(uptimeSec),
    timestamp: new Date().toISOString(),
    currentServerTime: new Date().toLocaleString('en-IN', {
      timeZone: env.TZ,
    }),
    timezone: env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    database: isDbConnected ? 'Connected' : 'Disconnected',
    environment: env.NODE_ENV,
    pid: process.pid,
    node: process.version,
    platform: process.platform,
    version: '1.0.0',
    cpuUsage: process.cpuUsage(),
    memory: {
      rss: formatBytes(mem.rss),
      heapUsed: formatBytes(mem.heapUsed),
      heapTotal: formatBytes(mem.heapTotal),
      external: formatBytes(mem.external),
    },
  });
};

/**
 * 3. Readiness Endpoint - GET /ready
 */
export const getReadiness = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const isEnvLoaded = Boolean(env.NODE_ENV && env.PORT);

  if (isDbConnected && isEnvLoaded) {
    return res.status(200).json({
      ready: true,
      database: 'Connected',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    ready: false,
    database: isDbConnected ? 'Connected' : 'Disconnected',
    environmentLoaded: isEnvLoaded,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 4. Liveness Endpoint - GET /live
 */
export const getLiveness = (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

