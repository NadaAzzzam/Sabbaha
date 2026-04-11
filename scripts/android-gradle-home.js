/**
 * Gradle default cache is ~/.gradle (often on C:). Native prefab steps hardlink from that
 * cache into the project; Windows cannot hardlink across volumes → noisy CMake logs and slower copies.
 * Optionally use a GRADLE_USER_HOME on the project drive (only when drives differ).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * @param {string} projectRoot
 * @returns {string|null} directory to use as GRADLE_USER_HOME, or null to leave default
 */
function resolveProjectLocalGradleUserHome(projectRoot) {
  if (process.env.GRADLE_USER_HOME && String(process.env.GRADLE_USER_HOME).trim()) {
    return null;
  }
  if (process.platform !== 'win32') {
    return null;
  }
  const resolvedProject = path.resolve(projectRoot);
  const projectDrive = path.parse(resolvedProject).root.toLowerCase();
  const homeDrive = path.parse(os.homedir()).root.toLowerCase();
  if (projectDrive === homeDrive) {
    return null;
  }
  return path.join(resolvedProject, '.gradle-user-home');
}

/**
 * @param {NodeJS.ProcessEnv} runEnv
 * @param {string} projectRoot
 */
function applyProjectLocalGradleUserHome(runEnv, projectRoot) {
  const dest = resolveProjectLocalGradleUserHome(projectRoot);
  if (!dest) {
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  runEnv.GRADLE_USER_HOME = dest;
}

/**
 * Gradle user home after applyProjectLocalGradleUserHome (or default ~/.gradle).
 * @param {NodeJS.ProcessEnv} env
 */
function getEffectiveGradleUserHomeDir(env) {
  if (env.GRADLE_USER_HOME && String(env.GRADLE_USER_HOME).trim()) {
    return path.resolve(String(env.GRADLE_USER_HOME).trim());
  }
  return path.join(os.homedir(), '.gradle');
}

/**
 * Removes Foojay/Gradle JDK download *.lock and incomplete *.part files (stale locks from concurrent builds).
 * @param {string} gradleUserHome
 * @returns {number} files removed
 */
function clearStaleJdkToolchainFiles(gradleUserHome) {
  const jdks = path.join(gradleUserHome, 'jdks');
  if (!fs.existsSync(jdks)) {
    return 0;
  }
  let n = 0;
  for (const name of fs.readdirSync(jdks)) {
    if (!name.endsWith('.lock') && !name.endsWith('.part')) {
      continue;
    }
    try {
      fs.unlinkSync(path.join(jdks, name));
      n += 1;
    } catch (e) {
      const hint =
        e && (e.code === 'EBUSY' || e.code === 'EPERM')
          ? ' Another process still holds this file (Gradle daemon, Android Studio sync). Run: npm run gradle:unlock -- <OwnerPID> from the error, or close Studio.'
          : '';
      console.warn(`[gradle] Could not remove jdks/${name}: ${e.message}.${hint}`);
    }
  }
  return n;
}

module.exports = {
  applyProjectLocalGradleUserHome,
  resolveProjectLocalGradleUserHome,
  getEffectiveGradleUserHomeDir,
  clearStaleJdkToolchainFiles,
};
