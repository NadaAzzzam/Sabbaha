/**
 * Resolve a JDK home suitable for Android Gradle / AGP (Prefab, CMake).
 * JDK 22+ can make native configure steps fail: stderr contains
 * "WARNING: A restricted method in java.lang.System has been called", which AGP treats as fatal.
 */
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

function javaExecutable(javaHome) {
  return path.join(javaHome, 'bin', isWin ? 'java.exe' : 'java');
}

function isValidJdkHome(dir) {
  if (!dir || !fs.existsSync(dir)) {
    return false;
  }
  return fs.existsSync(javaExecutable(dir));
}

/** Major version from JAVA_HOME/release; null if unknown. */
function javaMajorVersion(javaHome) {
  if (!isValidJdkHome(javaHome)) {
    return null;
  }
  const releaseFile = path.join(javaHome, 'release');
  try {
    if (!fs.existsSync(releaseFile)) {
      return null;
    }
    const text = fs.readFileSync(releaseFile, 'utf8');
    const m = text.match(/JAVA_VERSION="?(\d+)/);
    if (m) {
      return parseInt(m[1], 10);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Prefer 17–21 for Android Gradle native tooling. */
const ANDROID_BUILD_MAX_JAVA_MAJOR = 21;

function pushIfDir(list, dir) {
  if (dir) {
    list.push(dir);
  }
}

function jdkDirsUnder(base) {
  if (!base || !fs.existsSync(base)) {
    return [];
  }
  try {
    return fs
      .readdirSync(base, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => path.join(base, d.name));
  } catch {
    return [];
  }
}

function isUsableJdkHome(dir) {
  if (!isValidJdkHome(dir)) {
    return false;
  }
  const major = javaMajorVersion(dir);
  return major == null || major <= ANDROID_BUILD_MAX_JAVA_MAJOR;
}

/**
 * @returns {string|null} JAVA_HOME path, or null if none found
 */
function resolveJavaHomeForAndroidBuild() {
  const envJh = process.env.JAVA_HOME;
  if (isValidJdkHome(envJh)) {
    const major = javaMajorVersion(envJh);
    if (major == null || major <= ANDROID_BUILD_MAX_JAVA_MAJOR) {
      return envJh;
    }
    console.warn(
      `\n[android] JAVA_HOME is JDK ${major}. Android native builds often fail on JDK 22+ (restricted APIs). ` +
        `Using a JDK 17–21 instead (e.g. Android Studio …\\jbr) if found.\n`,
    );
  }

  const candidates = [];

  if (isWin) {
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const la = process.env.LOCALAPPDATA || '';
    pushIfDir(
      candidates,
      path.join(pf, 'Android', 'Android Studio', 'jbr'),
    );
    pushIfDir(
      candidates,
      path.join(la, 'Programs', 'Android', 'Android Studio', 'jbr'),
    );
    const jetBrains = path.join(pf, 'JetBrains');
    for (const d of jdkDirsUnder(jetBrains)) {
      if (path.basename(d).startsWith('Android Studio')) {
        pushIfDir(candidates, path.join(d, 'jbr'));
      }
    }
    for (const base of [
      path.join(pf, 'Microsoft'),
      path.join(pf, 'Eclipse Adoptium'),
      path.join(pf, 'Java'),
      path.join(pf, 'Amazon Corretto'),
    ]) {
      candidates.push(...jdkDirsUnder(base));
    }
  } else if (isMac) {
    pushIfDir(candidates, '/Applications/Android Studio.app/Contents/jbr');
    pushIfDir(
      candidates,
      '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    );
    const jvms = '/Library/Java/JavaVirtualMachines';
    for (const d of jdkDirsUnder(jvms)) {
      pushIfDir(candidates, path.join(d, 'Contents', 'Home'));
    }
  } else {
    pushIfDir(candidates, '/opt/android-studio/jbr');
    for (const d of jdkDirsUnder('/usr/lib/jvm')) {
      candidates.push(d);
    }
  }

  for (const c of candidates) {
    if (isUsableJdkHome(c)) {
      return c;
    }
  }
  return null;
}

module.exports = {
  resolveJavaHomeForAndroidBuild,
  javaMajorVersion,
  isValidJdkHome,
  ANDROID_BUILD_MAX_JAVA_MAJOR,
};
