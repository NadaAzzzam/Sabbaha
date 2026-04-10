/**
 * Removes Android CMake / app build outputs so the next `npm run android` does a
 * full native reconfigure. Safer than `./gradlew clean` when CMake autolinking
 * points at codegen dirs that are not created yet (clean can fail with GLOB mismatch).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const targets = [
  path.join(root, 'android', 'app', '.cxx'),
  path.join(root, 'android', 'app', 'build'),
  path.join(root, 'android', 'build'),
];

function rmrf(dir) {
  if (!fs.existsSync(dir)) {
    return false;
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

let removed = 0;
for (const dir of targets) {
  if (rmrf(dir)) {
    console.log(`[android-reset] Removed ${path.relative(root, dir)}`);
    removed++;
  }
}
if (removed === 0) {
  console.log('[android-reset] Nothing to remove (folders already absent).');
}
console.log('[android-reset] Run: npm run android (with emulator or USB device).');
