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
const officials = [];

// Seed default official account
const defaultOfficial = {
  id: 'official-001',
  email: 'admin@nhaa.gov.in',
  name: 'District Nodal Officer',
  passwordHash: hashPassword('NhaaAdmin@2026'),
  role: 'official',
  createdAt: new Date().toISOString()
};
officials.push(defaultOfficial);

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
      role: 'official',
      name: official.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Express middleware: requireOfficialAuth
 * - Extracts Bearer token from Authorization header
 * - Verifies JWT signature and expiry
 * - Checks role === 'official'
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

    if (decoded.role !== 'official') {
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
