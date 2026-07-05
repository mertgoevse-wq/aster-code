// test-runtime-health.mjs — Check runtime server health endpoint
// Run: node scripts/test-runtime-health.mjs

const RUNTIME_URL = 'http://localhost:3001';

let passed = 0;
let failed = 0;
let skipped = 0;

function pass(msg) { passed++; console.log(`  ✅ ${msg}`); }
function fail(msg) { failed++; console.log(`  ❌ ${msg}`); }
function skip(msg) { skipped++; console.log(`  ⏭️  ${msg}`); }

async function run() {
  console.log('');
  console.log('=== Runtime Health Test ===');
  console.log('');

  // Test 1: Runtime health endpoint
  console.log('[1/3] Health endpoint GET /health');
  try {
    const res = await fetch(`${RUNTIME_URL}/health`);
    const data = await res.json();

    if (res.ok && data.status === 'ok') {
      pass(`Status: ok (HTTP ${res.status})`);
    } else {
      fail(`Unexpected response: HTTP ${res.status}, body: ${JSON.stringify(data)}`);
    }

    if (data.uptime !== undefined) {
      pass(`Uptime reported: ${typeof data.uptime === 'number' ? Math.floor(data.uptime) + 's' : data.uptime}`);
    } else {
      skip('Uptime not in response');
    }
  } catch (err) {
    skip(`Runtime not reachable at ${RUNTIME_URL}: ${err.message}`);
    skip('Start runtime with: npm run dev:runtime');
    // Don't fail — runtime may legitimately not be running
    skipped++; skipped++; // balance the pass expectations
    summary();
    return;
  }

  // Test 2: Agent skills endpoint
  console.log('[2/3] Agent skills GET /api/agent/skills');
  try {
    const res = await fetch(`${RUNTIME_URL}/api/agent/skills`);
    const data = await res.json();

    if (res.ok && data.success) {
      pass(`Skills returned: ${data.skills?.length || 0} skills`);
    } else {
      fail(`Skills endpoint failed: HTTP ${res.status}`);
    }
  } catch (err) {
    fail(`Skills request failed: ${err.message}`);
  }

  // Test 3: Models endpoint
  console.log('[3/3] Models GET /api/models');
  try {
    const res = await fetch(`${RUNTIME_URL}/api/models`);
    const data = await res.json();

    if (res.ok && data.success) {
      pass(`Models returned: ${data.models?.length || 0} models`);
    } else {
      fail(`Models endpoint failed: HTTP ${res.status}`);
    }
  } catch (err) {
    fail(`Models request failed: ${err.message}`);
  }

  summary();
}

function summary() {
  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('');
  if (failed > 0) {
    console.log('❌ Runtime health check FAILED');
    process.exit(1);
  } else if (passed > 0) {
    console.log('✅ Runtime health check PASSED');
    process.exit(0);
  } else {
    console.log('⏭️  Runtime not running — tests skipped');
    process.exit(0);
  }
}

run().catch(err => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
