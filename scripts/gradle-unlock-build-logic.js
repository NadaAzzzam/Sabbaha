/**
 * Clears "Timeout waiting to lock build logic queue" / buildLogic.lock when another Gradle
 * JVM still holds android/.gradle/noVersion (often Android Studio sync or a stuck daemon).
 * Also clears stale Foojay JDK download *.lock / *.part under GRADLE_USER_HOME/jdks after --stop.
 *
 * Usage:
 *   npm run gradle:unlock -- <OwnerPID>     e.g.  npm run gradle:unlock -- 25964
 * Or set GRADLE_UNLOCK_PID=25964
 *
 * Close Android Studio for this project first if you prefer not to kill its Gradle process.
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
const noVersionDir = path.join(androidDir, '.gradle', 'noVersion');

function quoteCmdArg(arg) {
  const s = String(arg);
  if (!/[\s"&]/.test(s)) return s;
  return `"${s.replace(/"/g, '\\"')}"`;
}

if (!fs.existsSync(gradlew)) {
  console.error('[gradle-unlock] android/gradlew not found');
  process.exit(1);
}

const { env } = buildGradleRunEnv(projectRoot, { warn: false });

console.log('[gradle-unlock] Stopping Gradle daemons for this user home…');
spawnSync(gradlew, ['--stop'], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: isWin,
});

const gh = getEffectiveGradleUserHomeDir(env);
const jdkCleared = clearStaleJdkToolchainFiles(gh);
if (jdkCleared > 0) {
  console.log(
    `[gradle-unlock] Removed ${jdkCleared} JDK download lock/part file(s) under ${path.join(gh, 'jdks')}`,
  );
}

const pidArg =
  process.argv[2] ||
  (process.env.GRADLE_UNLOCK_PID && String(process.env.GRADLE_UNLOCK_PID).trim()) ||
  '';
const pid = pidArg ? parseInt(pidArg, 10) : NaN;

if (!Number.isNaN(pid) && pid > 0) {
  console.log(`[gradle-unlock] Terminating process tree for PID ${pid}…`);
  if (isWin) {
    const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'inherit',
      shell: true,
    });
    if (r.status !== 0) {
      console.warn(
        '[gradle-unlock] taskkill failed (process may already be gone, or need Administrator).',
      );
    }
  } else {
    spawnSync('kill', ['-9', String(pid)], { stdio: 'inherit' });
  }
  if (isWin) {
    spawnSync('timeout', ['/t', '2', '/nobreak'], { stdio: 'ignore', shell: true });
  } else {
    spawnSync('sleep', ['2'], { stdio: 'ignore' });
  }
} else {
  console.warn(
    '[gradle-unlock] No PID passed. If the lock error shows Owner PID, run:\n' +
      '  npm run gradle:unlock -- <PID>\n' +
      'Or close Android Studio / any Gradle sync using this project, then re-run this script.',
  );
}

if (fs.existsSync(noVersionDir)) {
  try {
    fs.rmSync(noVersionDir, { recursive: true, force: true });
    console.log('[gradle-unlock] Removed android/.gradle/noVersion');
  } catch (e) {
    console.error(`[gradle-unlock] Could not remove noVersion: ${e.message}`);
    console.error(
      '[gradle-unlock] Something still holds the lock — use Task Manager to end the Owner PID, then run again.',
    );
    process.exit(1);
  }
} else {
  console.log('[gradle-unlock] android/.gradle/noVersion was already absent.');
}

console.log('[gradle-unlock] Done. Try: npm run gradle -- assembleDebug');
