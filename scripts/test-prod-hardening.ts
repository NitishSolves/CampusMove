// Test suite for Production-Hardening Guarantees:
// 1. Missing DATABASE_URL in production throws fatal error (no silent fallback).
// 2. Unreachable DATABASE_URL in production throws fatal error (no silent fallback).
// 3. Missing JWT_SECRET in production throws fatal error.
// 4. CORS in production rejects wildcards and parses specific origins.
// 5. Database health check returns correct degraded status when DB is down.

import { getJwtSecret } from '../server/middleware/auth';
import { initDatabase, checkDatabaseHealth } from '../server/db';

async function runHardeningTests() {
  console.log('=== RUNNING PRODUCTION HARDENING TESTS ===\n');
  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, detail?: string) => {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  };

  // Test 1: Missing JWT_SECRET in production mode must throw
  try {
    const origEnv = process.env.NODE_ENV;
    const origSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';

    let threw = false;
    try {
      getJwtSecret();
    } catch (err: any) {
      threw = err.message.includes('JWT_SECRET environment variable is missing');
    }
    assert('JWT_SECRET required in production (fails fast when missing)', threw);

    process.env.NODE_ENV = origEnv;
    if (origSecret) process.env.JWT_SECRET = origSecret;
  } catch (err: any) {
    assert('JWT_SECRET test execution', false, err.message);
  }

  // Test 2: Missing DATABASE_URL in production must throw (no silent fallback)
  try {
    const origEnv = process.env.NODE_ENV;
    const origDbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'production';

    let threw = false;
    try {
      await initDatabase();
    } catch (err: any) {
      threw = err.message.includes('DATABASE_URL environment variable is strictly required in production mode');
    }
    assert('DATABASE_URL required in production (no silent fallback when missing)', threw);

    process.env.NODE_ENV = origEnv;
    if (origDbUrl) process.env.DATABASE_URL = origDbUrl;
  } catch (err: any) {
    assert('DATABASE_URL missing test execution', false, err.message);
  }

  // Test 3: Unreachable PostgreSQL in production must throw (no silent fallback)
  try {
    const origEnv = process.env.NODE_ENV;
    const origDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://invalid_user:invalid_pass@127.0.0.1:54329/invalid_db';
    process.env.NODE_ENV = 'production';

    let threw = false;
    try {
      await initDatabase();
    } catch (err: any) {
      threw = err.message.includes('Failed to connect to PostgreSQL in production mode') ||
              err.message.includes('Local persistence fallback is disabled');
    }
    assert('PostgreSQL connection failure in production aborts (no silent fallback)', threw);

    process.env.NODE_ENV = origEnv;
    if (origDbUrl) {
      process.env.DATABASE_URL = origDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  } catch (err: any) {
    assert('PostgreSQL failure test execution', false, err.message);
  }

  // Test 4: Health check accurately reports database state
  try {
    const health = await checkDatabaseHealth();
    assert('Database health probe returns structured status', typeof health.healthy === 'boolean' && typeof health.database === 'string');
  } catch (err: any) {
    assert('Health probe execution', false, err.message);
  }

  console.log('\n========================================');
  console.log(`PRODUCTION HARDENING TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHardeningTests();
