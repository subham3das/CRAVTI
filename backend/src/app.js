import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import routes from './routes/index.js';
import healthRoutes from './routes/healthRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { mongoSanitize } from './middleware/mongoSanitize.js';
import env from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Middlewares (Standard 20)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const staticOrigins = [
  env.CLIENT_URL,
  env.ADMIN_CLIENT_URL,
  env.FRONTEND_URL,
  env.ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (staticOrigins.includes(origin)) return true;
  // Allow all localhost and 127.0.0.1 ports (for dev & admin panels)
  if (/^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/.test(origin)) return true;
  // Allow all Craviti Vercel production & preview domains
  if (/^https:\/\/(cravti|craviti)[a-zA-Z0-9\-_.]*\.vercel\.app$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Global Centralized Request Logger (Standard 7)
app.use(requestLogger);

// Rate Limiting & NoSQL Sanitization (Standard 20)
app.use('/api', apiLimiter);
app.use(mongoSanitize);

// Compression & Body Parsers with size limits
app.use(compression());
app.use(morgan(env.IS_PRODUCTION ? 'combined' : 'dev'));
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve local static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Production Root & Health Monitoring Endpoints (Render Health Checks)
app.use('/', healthRoutes);

// Mount API routes
app.use('/api', routes);

// Error Middlewares (Standard 8)
app.use(notFound);
app.use(errorHandler);

export default app;
