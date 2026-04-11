/**
 * Runs android/gradlew with a JDK Gradle can use for Prefab/CMake (17–21).
 * With JDK 22+ on JAVA_HOME, AGP fails configureCMake with:
 * "WARNING: A restricted method in java.lang.System has been called".
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { buildGradleRunEnv } = require('./android-gradle-env');

const isWin = process.platform === 'win32';
const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const gradlew = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');
const extraArgs = process.argv.slice(2);

if (!fs.existsSync(gradlew)) {
  console.error('[gradle] android/gradlew not found');
  process.exit(1);
}

const { env, javaHome } = buildGradleRunEnv(projectRoot);

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
