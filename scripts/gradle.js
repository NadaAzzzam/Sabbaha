/**
 * Runs android/gradlew with a JDK Gradle can use for Prefab/CMake (17–21).
 * With JDK 22+ on JAVA_HOME, AGP fails configureCMake with:
 * "WARNING: A restricted method in java.lang.System has been called".
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  resolveJavaHomeForAndroidBuild,
  javaMajorVersion,
  ANDROID_BUILD_MAX_JAVA_MAJOR,
} = require('./android-jdk');
const { applyProjectLocalGradleUserHome } = require('./android-gradle-home');

const isWin = process.platform === 'win32';
const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const gradlew = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');
const extraArgs = process.argv.slice(2);

if (!fs.existsSync(gradlew)) {
  console.error('[gradle] android/gradlew not found');
  process.exit(1);
}

const javaHome = resolveJavaHomeForAndroidBuild();
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
    console.warn(
      '\n[gradle] JAVA_HOME pointed to JDK ' +
        bad +
        ', which breaks native CMake/Prefab steps. No JDK 17–21 was found.\n' +
        '  Install Android Studio (…\\jbr) or Temurin 17/21, or run from a shell with JAVA_HOME set to that JDK.\n',
    );
  }
}

if (process.execPath && fs.existsSync(process.execPath)) {
  env.NODE_BINARY = process.execPath;
  const nodeDir = path.dirname(process.execPath);
  env.PATH = `${nodeDir}${path.delimiter}${env.PATH || ''}`;
}

function quoteCmdArg(arg) {
  const s = String(arg);
  if (!/[\s"&]/.test(s)) {
    return s;
  }
  return `"${s.replace(/"/g, '\\"')}"`;
}

const gradleArgs = [];
if (javaHome) {
  gradleArgs.push(`-Dorg.gradle.java.home=${javaHome}`);
}

const r = isWin
  ? spawnSync(`${quoteCmdArg(gradlew)} ${[...gradleArgs, ...extraArgs].map(quoteCmdArg).join(' ')}`, {
      cwd: androidDir,
      env,
      stdio: 'inherit',
      shell: true,
    })
  : spawnSync(gradlew, [...gradleArgs, ...extraArgs], {
      cwd: androidDir,
      env,
      stdio: 'inherit',
      shell: false,
    });

process.exit(r.status === null ? 1 : r.status);
