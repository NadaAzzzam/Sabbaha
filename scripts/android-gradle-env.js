/**
 * Same environment Gradle CLI scripts use (JAVA_HOME, GRADLE_USER_HOME on D: vs C:, NODE_BINARY).
 */
const fs = require('fs');
const path = require('path');
const {
  resolveJavaHomeForAndroidBuild,
  javaMajorVersion,
  ANDROID_BUILD_MAX_JAVA_MAJOR,
} = require('./android-jdk');
const { applyProjectLocalGradleUserHome } = require('./android-gradle-home');

/**
 * @param {string} projectRoot
 * @param {{ warn?: boolean }} [opts]
 * @returns {{ env: NodeJS.ProcessEnv, javaHome: string | null }}
 */
function buildGradleRunEnv(projectRoot, opts = {}) {
  const warn = opts.warn !== false;
  const javaHome = resolveJavaHomeForAndroidBuild(projectRoot);
  const env = { ...process.env };

  applyProjectLocalGradleUserHome(env, projectRoot);

  if (javaHome) {
    env.JAVA_HOME = javaHome;
    const javaBin = path.join(javaHome, 'bin');
    if (fs.existsSync(javaBin)) {
      env.PATH = `${javaBin}${path.delimiter}${env.PATH || ''}`;
    }
  } else {
    const bad = javaMajorVersion(process.env.JAVA_HOME);
    if (bad != null && bad > ANDROID_BUILD_MAX_JAVA_MAJOR) {
      delete env.JAVA_HOME;
      if (warn) {
        console.warn(
          '\n[gradle] JAVA_HOME pointed to JDK ' +
            bad +
            ', which breaks native CMake/Prefab steps. No JDK 17–21 was found.\n' +
            '  Install Android Studio (…\\jbr) or Temurin 17/21, or run from a shell with JAVA_HOME set to that JDK.\n',
        );
      }
    }
  }

  if (process.execPath && fs.existsSync(process.execPath)) {
    env.NODE_BINARY = process.execPath;
    const nodeDir = path.dirname(process.execPath);
    env.PATH = `${nodeDir}${path.delimiter}${env.PATH || ''}`;
  }

  return { env, javaHome };
}

module.exports = { buildGradleRunEnv };
