/**
 * Test Setup - Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./data/test.db';
process.env.SESSION_SECRET = 'test-secret-must-be-at-least-32-characters-long-for-hmac';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
process.env.ALLOWED_ORIGIN = 'http://localhost:3000';

console.log('[Test Setup] Environment configured for testing');
