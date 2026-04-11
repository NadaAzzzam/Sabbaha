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

/** `jdk.dir` from android/local.properties (Android Studio / manual). */
function readJdkDirFromLocalProperties(projectRoot) {
  if (!projectRoot) {
    return null;
  }
  const lp = path.join(projectRoot, 'android', 'local.properties');
  if (!fs.existsSync(lp)) {
    return null;
  }
  try {
    const text = fs.readFileSync(lp, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }
      const i = line.indexOf('=');
      if (i < 0) {
        continue;
      }
      if (line.slice(0, i).trim() !== 'jdk.dir') {
        continue;
      }
      let val = line.slice(i + 1).trim();
      val = val.replace(/^["']|["']$/g, '');
      return val || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Among ordered candidates, pick JDK 17 if present, else newest allowed (21 … 18).
 * @param {string[]} orderedCandidates
 * @returns {string|null}
 */
function pickPreferredJavaHome(orderedCandidates) {
  const seen = new Set();
  const list = [];
  for (const raw of orderedCandidates) {
    if (!raw) {
      continue;
    }
    let abs;
    try {
      abs = path.resolve(raw);
    } catch {
      continue;
    }
    if (seen.has(abs)) {
      continue;
    }
    seen.add(abs);
    if (!isUsableJdkHome(abs)) {
      continue;
    }
    list.push(abs);
  }
  if (!list.length) {
    return null;
  }
  const scored = list.map(p => ({ p, m: javaMajorVersion(p) }));
  const v17 = scored.filter(x => x.m === 17);
  if (v17.length) {
    return v17[0].p;
  }
  for (const maj of [21, 20, 19, 18]) {
    const hit = scored.find(x => x.m === maj);
    if (hit) {
      return hit.p;
    }
  }
  const unknown = scored.find(x => x.m == null);
  return unknown ? unknown.p : list[0];
}

function collectScanCandidates() {
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
  return candidates;
}

/**
 * @param {string} [projectRoot] repo root (parent of `android/`). Enables `android/local.properties` → `jdk.dir`.
 * @returns {string|null} JAVA_HOME path, or null if none found
 */
function resolveJavaHomeForAndroidBuild(projectRoot) {
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

  const fromLocal = readJdkDirFromLocalProperties(projectRoot);
  if (fromLocal && isUsableJdkHome(fromLocal)) {
    return path.resolve(fromLocal);
  }
  if (fromLocal && !isValidJdkHome(fromLocal)) {
    console.warn(
      `\n[android] android/local.properties jdk.dir is missing or invalid: ${fromLocal}\n`,
    );
  }

  return pickPreferredJavaHome(collectScanCandidates());
}

module.exports = {
  resolveJavaHomeForAndroidBuild,
  readJdkDirFromLocalProperties,
  javaMajorVersion,
  isValidJdkHome,
  ANDROID_BUILD_MAX_JAVA_MAJOR,
};
