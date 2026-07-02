import crypto from 'crypto';

const SIGNING_SALT = process.env.API_SIGNING_SALT || 'SUTRAOS_SIGNING_SALT_PROTECTED_888';
const TIMEOUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes tolerance window for replay attacks

/**
 * Middleware validating X-SutraOS-Signature header for critical operations.
 * Prevents client-side manipulation of payload variables (such as grades or options).
 */
export function verifyPayloadSignature(req, res, next) {
  const signature = req.headers['x-sutraos-signature'];
  const timestampHeader = req.headers['x-sutraos-timestamp'];

  if (!signature || !timestampHeader) {
    return res.status(400).json({ 
      error: 'Security Failure: Missing cryptographic signature headers.' 
    });
  }

  // 1. Check for replay attack window
  const timestamp = parseInt(timestampHeader, 10);
  const currentTime = Date.now();
  if (isNaN(timestamp) || Math.abs(currentTime - timestamp) > TIMEOUT_WINDOW_MS) {
    return res.status(403).json({ 
      error: 'Security Failure: Timestamp out of sync or expired. Check system time.' 
    });
  }

  // 2. Extract payload body representation
  const payloadStr = JSON.stringify(req.body);
  const userId = req.user ? req.user.user_id : 'PUBLIC';

  // 3. Compute expected signature hash: sha256(body + timestamp + user_id, salt)
  const computedHash = crypto
    .createHmac('sha256', SIGNING_SALT)
    .update(payloadStr + timestampHeader + userId)
    .digest('hex');

  // 4. Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex');
  const computedBuffer = Buffer.from(computedHash, 'hex');

  if (signatureBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, computedBuffer)) {
    return res.status(403).json({ 
      error: 'Security Failure: Invalid payload signature. Transaction modified in transit.' 
    });
  }

  next();
}
