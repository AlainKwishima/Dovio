import crypto from 'crypto';

export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function generateOTP(length = 6) {
  const code = Math.floor(Math.random() * 10 ** length)
    .toString()
    .padStart(length, '0');
  return code;
}


