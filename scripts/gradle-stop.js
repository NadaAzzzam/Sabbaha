/**
 * Stops Gradle daemons for this project. Use when you see:
 * "Timeout waiting to lock build logic queue", JDK download locks under jdks/, or wrapper zip lock timeouts.
 * Uses the same GRADLE_USER_HOME as npm run gradle (e.g. .gradle-user-home on D:).
 * Close Android Studio first if it is syncing this project, then run: npm run gradle:stop
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { buildGradleRunEnv } = require('./android-gradle-env');
const {
  getEffectiveGradleUserHomeDir,
  clearStaleJdkToolchainFiles,
} = require('./android-gradle-home');

const isWin = process.platform === 'win32';
const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const gradlew = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');

if (!fs.existsSync(gradlew)) {
  console.error('android/gradlew not found');
  process.exit(1);
}

const { env } = buildGradleRunEnv(projectRoot, { warn: false });
const r = spawnSync(gradlew, ['--stop'], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: isWin,
});

const gh = getEffectiveGradleUserHomeDir(env);
const cleared = clearStaleJdkToolchainFiles(gh);
if (cleared > 0) {
  console.log(`[gradle:stop] Removed ${cleared} stale file(s) under ${path.join(gh, 'jdks')}`);
}

process.exit(r.status === null ? 1 : r.status);
