import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { ADMIN_STATUS, ADMIN_ROLES, DEFAULT_ROLE_PERMISSIONS } from '../constants/adminConstants.js';
import env from '../config/env.js';

export const adminProtect = async (req, res, next) => {
  // Always permit CORS preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Admin authorization required. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Strict token isolation: Token MUST have type === 'admin'
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Restaurant user tokens cannot access the Admin panel.',
      });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin || admin.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found or has been revoked.',
      });
    }

    if (admin.status !== ADMIN_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: `Admin account is currently ${admin.status}. Please contact the Super Admin.`,
      });
    }

    req.admin = admin;
    req.adminId = admin._id;
    req.adminRole = admin.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Admin token verification failed or expired.',
      error: error.message,
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware for Admins
 */
export const requireAdminRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization required.',
      });
    }

    if (!allowedRoles.includes(req.admin.role) && req.admin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role ${req.admin.role} lacks permission for this action.`,
      });
    }

    next();
  };
};

/**
 * Permission-based Access Control Middleware (Module 4)
 * Does not rely merely on role names; evaluates granular permission tokens.
 */
export const requirePermission = (permissionCode) => {
  return (req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization required.',
      });
    }

    // Super Admin & Admin retain universal permission bypass for operational routes
    const role = String(req.admin.role || '').toUpperCase();
    if (role === ADMIN_ROLES.SUPER_ADMIN || role === 'SUPER_ADMIN' || role === ADMIN_ROLES.ADMIN || role === 'ADMIN') {
      return next();
    }

    const adminCustomPerms = Array.isArray(req.admin.permissions) ? req.admin.permissions : [];
    const roleDefaultPerms = DEFAULT_ROLE_PERMISSIONS[req.admin.role] || [];
    const effectivePermissions = new Set([...roleDefaultPerms, ...adminCustomPerms]);

    if (!effectivePermissions.has(permissionCode)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Administrator lacks required permission "${permissionCode}".`,
      });
    }

    next();
  };
};


