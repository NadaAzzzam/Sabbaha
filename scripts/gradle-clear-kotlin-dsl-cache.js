/**
 * Fixes Windows: "Could not move temporary workspace ... kotlin-dsl ... to immutable location".
 * Stale/locked kotlin-dsl script caches under GRADLE_USER_HOME break settings plugin resolution.
 * Run: npm run gradle:stop && npm run gradle:clear-kotlin-cache && npm run gradle -- clean
 */
const fs = require('fs');
const path = require('path');
const { resolveProjectLocalGradleUserHome } = require('./android-gradle-home');

const projectRoot = path.join(__dirname, '..');

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  }
  return false;
}

/** Remove kotlin-dsl caches under <gradleHome>/caches/<version>/kotlin-dsl */
function clearKotlinDslUnderGradleHome(gradleHome) {
  const caches = path.join(gradleHome, 'caches');
  if (!fs.existsSync(caches)) {
    return 0;
  }
  let n = 0;
  for (const ent of fs.readdirSync(caches, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const kotlinDsl = path.join(caches, ent.name, 'kotlin-dsl');
    if (rmrf(kotlinDsl)) {
      console.log(`[gradle-clear-kotlin] Removed ${path.relative(projectRoot, kotlinDsl)}`);
      n++;
    }
  }
  return n;
}

const homes = new Set();
const envHome = process.env.GRADLE_USER_HOME && String(process.env.GRADLE_USER_HOME).trim();
if (envHome) {
  homes.add(path.resolve(envHome));
}
const local = resolveProjectLocalGradleUserHome(projectRoot);
if (local) {
  homes.add(path.resolve(local));
}

let total = 0;
for (const home of homes) {
  total += clearKotlinDslUnderGradleHome(home);
}

if (total === 0) {
  console.log('[gradle-clear-kotlin] No kotlin-dsl cache dirs found (already clean or different GRADLE_USER_HOME).');
}
