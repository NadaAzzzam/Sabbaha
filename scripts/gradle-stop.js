/**
 * Stops Gradle daemons for this project. Use when you see:
 * "Timeout waiting to lock build logic queue" or wrapper zip lock timeouts.
 * Close Android Studio first if it is syncing this project, then run: npm run gradle:stop
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const androidDir = path.join(__dirname, '..', 'android');
const gradlew = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');

if (!fs.existsSync(gradlew)) {
  console.error('android/gradlew not found');
  process.exit(1);
}

const r = spawnSync(gradlew, ['--stop'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWin,
});

process.exit(r.status === null ? 1 : r.status);
