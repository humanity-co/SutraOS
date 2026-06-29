import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SUTRAOS_SUPER_SECURE_JWT_SECRET_KEY_999';

/**
 * Main authentication middleware to verify JWT and bind claims to request context.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: Missing authentication token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Access Denied: Invalid or expired token.' });
    }

    // Attach decoded user data (tenant_id, role, scopes, etc.) to request
    req.user = decodedUser;
    next();
  });
}

/**
 * Scope enforcement authorization middleware (RBAC check).
 * Verifies if the authenticated user holds the required API permissions.
 * 
 * @param {string} requiredScope - Scope permission string (e.g. 'sutraos:exams:write')
 */
export function requireScope(requiredScope) {
  return (req, res, next) => {
    if (!req.user || !req.user.scopes) {
      return res.status(403).json({ error: 'Access Denied: No permissions allocated.' });
    }

    // Admins bypass normal scope restrictions
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const hasScope = req.user.scopes.includes(requiredScope);

    if (!hasScope) {
      return res.status(403).json({ 
        error: `Access Denied: Insufficient permissions. Required: ${requiredScope}` 
      });
    }

    next();
  };
}
