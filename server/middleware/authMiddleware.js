/**
 * Official Authentication Middleware
 * JWT-based auth for official dashboard access.
 * Victims never need accounts — this is officials-only.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT secret — in production, use process.env.JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'nhaa-official-portal-secret-key-2026';
const JWT_EXPIRY = '8h';

/**
 * Hash a password using SHA-256 (built-in, no bcrypt dependency).
 * Adequate for a demo/internal tool; use bcrypt/argon2 in production.
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * In-memory officials store.
 * In production, this would be a Firestore collection or database table.
 */
const officials = [
  {
    id: 'official-admin-001',
    email: 'admin@nhaa.gov.in',
    name: 'District Nodal Officer (Admin)',
    passwordHash: hashPassword('NhaaAdmin@2026'),
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'official-sup-002',
    email: 'supervisor@nhaa.gov.in',
    name: 'Zonal Supervisor Rao',
    passwordHash: hashPassword('Supervisor@2026'),
    role: 'supervisor',
    createdAt: new Date().toISOString()
  },
  {
    id: 'official-off-003',
    email: 'officer.rao@nhaa.gov.in',
    name: 'Inspector Rajeshwar Rao',
    passwordHash: hashPassword('Officer@2026'),
    role: 'officer',
    createdAt: new Date().toISOString()
  },
  {
    id: 'official-off-004',
    email: 'officer.kadam@nhaa.gov.in',
    name: 'Sub-Inspector Anjali Kadam',
    passwordHash: hashPassword('Officer@2026'),
    role: 'officer',
    createdAt: new Date().toISOString()
  }
];

/**
 * Validate credentials and return official record (without passwordHash).
 */
export function authenticateOfficial(email, password) {
  const official = officials.find(
    o => o.email.toLowerCase() === email.toLowerCase()
  );
  if (!official) return null;

  const inputHash = hashPassword(password);
  if (inputHash !== official.passwordHash) return null;

  // Return safe subset (no passwordHash)
  const { passwordHash, ...safeOfficial } = official;
  return safeOfficial;
}

/**
 * Generate a signed JWT for an authenticated official.
 */
export function generateToken(official) {
  return jwt.sign(
    {
      id: official.id,
      email: official.email,
      role: official.role || 'officer',
      name: official.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Check if an official role has supervisor or admin privileges
 */
export function isSupervisorOrAdmin(role) {
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'supervisor';
}

/**
 * Role-Based Access Control check for Complaint Audit Logs:
 * - Only Supervisor/Admin role can view audit logs across all officers
 * - Regular officers see only the log for cases they're currently assigned to
 */
export function canAccessAuditLog(official, complaint) {
  if (!official || !complaint) return false;
  const role = (official.role || '').toLowerCase();

  // Supervisor or Admin can view audit logs across all officers
  if (role === 'admin' || role === 'supervisor') {
    return true;
  }

  // Regular officers see only the log for cases they're currently assigned to
  if (complaint.assignedOfficerId && complaint.assignedOfficerId === official.id) {
    return true;
  }

  if (complaint.assignedOfficer && official.name) {
    // Check if officer name is part of assignedOfficer string (e.g. "Inspector Rajeshwar Rao (Atrocity Cell, Zone 4)")
    const assignedLower = complaint.assignedOfficer.toLowerCase();
    const nameLower = official.name.toLowerCase();
    if (assignedLower.includes(nameLower) || nameLower.includes(assignedLower)) {
      return true;
    }
  }

  return false;
}

/**
 * Express middleware: requireOfficialAuth
 * - Extracts Bearer token from Authorization header
 * - Verifies JWT signature and expiry
 * - Checks role is valid official role ('admin', 'supervisor', 'officer', 'official')
 * - Attaches req.official on success
 * - Returns 401/403 on failure
 */
export function requireOfficialAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid authorization token.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const allowedRoles = ['admin', 'supervisor', 'officer', 'official'];

    if (!decoded.role || !allowedRoles.includes(decoded.role.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Official authorization required.'
      });
    }

    // Attach official info to the request
    req.official = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.'
    });
  }
}

export { officials };

