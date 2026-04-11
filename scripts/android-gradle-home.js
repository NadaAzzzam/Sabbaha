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

module.exports = {
  applyProjectLocalGradleUserHome,
  resolveProjectLocalGradleUserHome,
};
