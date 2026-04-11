/**
 * Prepends Android SDK platform-tools and emulator to PATH so adb/emulator work
 * when ANDROID_HOME is unset but the SDK is in the default install location.
 * Also sets JAVA_HOME when Gradle cannot find Java (Android Studio ships a JBR).
 */
const { spawn, spawnSync } = require('child_process');
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
const extraArgs = process.argv.slice(2);

function resolveSdkHome() {
  const fromEnv = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }
  const localAppData = process.env.LOCALAPPDATA || '';
  if (localAppData) {
    const def = path.join(localAppData, 'Android', 'Sdk');
    if (fs.existsSync(def)) {
      return def;
    }
  }
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home) {
    const mac = path.join(home, 'Library', 'Android', 'sdk');
    if (fs.existsSync(mac)) {
      return mac;
    }
    const linux = path.join(home, 'Android', 'Sdk');
    if (fs.existsSync(linux)) {
      return linux;
    }
  }
  return null;
}

/**
 * Merge sdk.dir and node.executable into android/local.properties so Gradle (and Android Studio)
 * can find the SDK and Node even when PATH is minimal — fixes Windows codegen "node not recognized".
 */
function ensureLocalProperties(androidDir, sdkRoot) {
  const lp = path.join(androidDir, 'local.properties');
  const map = new Map();
  if (fs.existsSync(lp)) {
    for (const line of fs.readFileSync(lp, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i > 0) map.set(t.slice(0, i).trim(), t.slice(i + 1).trim());
    }
  }
  if (sdkRoot && fs.existsSync(sdkRoot)) {
    map.set('sdk.dir', sdkRoot.replace(/\\/g, '/'));
  }
  const nodeExe = process.execPath;
  if (nodeExe && fs.existsSync(nodeExe)) {
    map.set('node.executable', nodeExe.replace(/\\/g, '/'));
  }
  if (map.size === 0) {
    return;
  }
  const out = ['# local.properties — keys below are merged by scripts/run-android.js (gitignored)'];
  for (const [k, v] of map) {
    out.push(`${k}=${v}`);
  }
  fs.mkdirSync(androidDir, { recursive: true });
  fs.writeFileSync(lp, `${out.join('\n')}\n`, 'utf8');
  console.log(`[android] Updated ${path.relative(projectRoot, lp)}`);
}

const sdk = resolveSdkHome();
ensureLocalProperties(path.join(projectRoot, 'android'), sdk);

const env = { ...process.env };

if (sdk) {
  env.ANDROID_HOME = sdk;
  env.ANDROID_SDK_ROOT = sdk;
  const dirs = [
    path.join(sdk, 'platform-tools'),
    path.join(sdk, 'emulator'),
    path.join(sdk, 'cmdline-tools', 'latest', 'bin'),
    path.join(sdk, 'tools'),
    path.join(sdk, 'tools', 'bin'),
  ].filter(d => fs.existsSync(d));
  if (dirs.length) {
    env.PATH = `${dirs.join(path.delimiter)}${path.delimiter}${env.PATH}`;
  }
} else {
  console.warn(
    '\n[android] ANDROID_HOME is not set and the default SDK folder was not found.\n' +
      '  Install Android Studio, open SDK Manager, note the "Android SDK location", then either:\n' +
      '  - Set ANDROID_HOME to that path (Windows: System → Environment variables), or\n' +
      '  - Keep the default location: %LOCALAPPDATA%\\Android\\Sdk\n',
  );
}

const adb = sdk
  ? path.join(sdk, 'platform-tools', isWin ? 'adb.exe' : 'adb')
  : '';
if (sdk && !fs.existsSync(adb)) {
  console.warn(
    '[android] platform-tools not found under your SDK. In Android Studio: SDK Manager → SDK Tools → Android SDK Platform-Tools.\n',
  );
}

const javaHome = resolveJavaHomeForAndroidBuild(projectRoot);
if (javaHome) {
  env.JAVA_HOME = javaHome;
  const javaBin = path.join(javaHome, 'bin');
  if (fs.existsSync(javaBin)) {
    env.PATH = `${javaBin}${path.delimiter}${env.PATH}`;
  }
} else {
  const bad = javaMajorVersion(process.env.JAVA_HOME);
  if (bad != null && bad > ANDROID_BUILD_MAX_JAVA_MAJOR) {
    delete env.JAVA_HOME;
    console.warn(
      '\n[android] JAVA_HOME pointed to JDK ' +
        bad +
        ', which breaks native CMake steps. No JDK 17–21 was found under Android Studio / common paths.\n' +
        '  Install Android Studio (use its …\\jbr) or Eclipse Temurin 17/21, set JAVA_HOME to that folder, then retry.\n',
    );
  } else {
    console.warn(
      '\n[android] JAVA_HOME is not set and no JDK was found in common locations.\n' +
        '  Install a JDK 17+ (Android Studio includes one under its install folder …\\jbr).\n' +
        '  Then set JAVA_HOME to that JDK root (the folder that contains bin\\java.exe).\n',
    );
  }
}

if (process.execPath && fs.existsSync(process.execPath)) {
  env.NODE_BINARY = process.execPath;
  const nodeDir = path.dirname(process.execPath);
  env.PATH = `${nodeDir}${path.delimiter}${env.PATH || ''}`;
}

// Add android/ to PATH so the RN CLI can invoke gradlew.bat by name on Windows
const androidDir = path.join(projectRoot, 'android');
if (isWin && fs.existsSync(androidDir)) {
  env.PATH = `${androidDir}${path.delimiter}${env.PATH || ''}`;
}

applyProjectLocalGradleUserHome(env, projectRoot);

let rnCli;
try {
  rnCli = path.join(
    path.dirname(
      require.resolve('react-native/package.json', { paths: [projectRoot] }),
    ),
    'cli.js',
  );
} catch {
  console.error(
    '[android] Could not resolve react-native. Run npm install from the project root.',
  );
  process.exit(1);
}

if (!fs.existsSync(rnCli)) {
  console.error(`[android] Missing React Native CLI: ${rnCli}`);
  process.exit(1);
}

function sleepSync(seconds) {
  const s = Math.max(1, Math.floor(seconds));
  if (isWin) {
    spawnSync('timeout', ['/t', String(s), '/nobreak'], {
      stdio: 'ignore',
      windowsHide: true,
    });
  } else {
    spawnSync('sleep', [String(s)], { stdio: 'ignore' });
  }
}

function hasConnectedDevice(sdk) {
  const adb = path.join(sdk, 'platform-tools', isWin ? 'adb.exe' : 'adb');
  if (!fs.existsSync(adb)) {
    return false;
  }
  const r = spawnSync(adb, ['devices'], { encoding: 'utf8', env });
  if (r.error || typeof r.stdout !== 'string') {
    return false;
  }
  return r.stdout.split(/\r?\n/).some(line => /^\S+\s+device\s*$/.test(line.trim()));
}

/** Stale "emulator-5554 offline" entries break installDebug; adb restart usually clears them. */
function maybeRestartAdbWhenNoOnlineDevice(sdkForAdb, runEnv) {
  const adbPath = path.join(sdkForAdb, 'platform-tools', isWin ? 'adb.exe' : 'adb');
  if (!fs.existsSync(adbPath)) {
    return;
  }
  const r = spawnSync(adbPath, ['devices'], { encoding: 'utf8', env: runEnv, windowsHide: true });
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  const hasOnline = /^\S+\s+device\s*$/m.test(out);
  if (hasOnline) {
    return;
  }
  const looksStuck =
    /\boffline\b/i.test(out) ||
    /\bunauthorized\b/i.test(out) ||
    /\bauthorizing\b/i.test(out);
  if (!looksStuck && !/\S+\s+\S+/.test(out.replace(/^List of devices.*$/m, ''))) {
    return;
  }
  console.log('[android] No online device in `adb devices` — restarting adb server…');
  spawnSync(adbPath, ['kill-server'], { stdio: 'pipe', env: runEnv, windowsHide: true });
  spawnSync(adbPath, ['start-server'], { stdio: 'pipe', env: runEnv, windowsHide: true });
}

/** Where AVD *.ini / *.avd live (same rules as the Android SDK tools). */
function resolveAvdHome() {
  const fromEnv = process.env.ANDROID_AVD_HOME;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }
  const profile =
    process.env.USERPROFILE ||
    process.env.HOME ||
    (process.env.HOMEDRIVE && process.env.HOMEPATH
      ? path.join(process.env.HOMEDRIVE, process.env.HOMEPATH)
      : '');
  if (!profile) {
    return '';
  }
  return path.join(profile, '.android', 'avd');
}

/** Standard locations that may contain *.ini (metadata) even when *.avd data is elsewhere (path= in ini). */
function collectAvdHomeCandidates() {
  const seen = new Set();
  const out = [];
  function push(dir) {
    if (!dir) {
      return;
    }
    const n = path.normalize(dir);
    if (fs.existsSync(n) && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  push(process.env.ANDROID_AVD_HOME);
  const profile = process.env.USERPROFILE || process.env.HOME;
  if (profile) {
    push(path.join(profile, '.android', 'avd'));
  }
  if (process.env.HOMEDRIVE && process.env.HOMEPATH) {
    push(path.join(process.env.HOMEDRIVE, process.env.HOMEPATH, '.android', 'avd'));
  }
  if (process.env.LOCALAPPDATA) {
    push(path.join(process.env.LOCALAPPDATA, 'Android', 'avd'));
  }
  return out;
}

const MAX_DOT_ANDROID_WALK_DEPTH = 16;

/** Cached: find AVD *.ini anywhere under ~/.android (Studio may use non-default layout). */
let discoverAvdsUnderProfileCache;

function discoverAvdsUnderProfileAndroid() {
  if (discoverAvdsUnderProfileCache) {
    return discoverAvdsUnderProfileCache;
  }
  const profile = process.env.USERPROFILE || process.env.HOME;
  if (!profile) {
    discoverAvdsUnderProfileCache = { names: [], emuIniDir: '' };
    return discoverAvdsUnderProfileCache;
  }
  const root = path.join(profile, '.android');
  if (!fs.existsSync(root)) {
    discoverAvdsUnderProfileCache = { names: [], emuIniDir: '' };
    return discoverAvdsUnderProfileCache;
  }

  const iniPaths = [];
  function walk(dir, depth) {
    if (depth > MAX_DOT_ANDROID_WALK_DEPTH) {
      return;
    }
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'cache' || e.name === 'metrics' || e.name === 'studio') {
          continue;
        }
        walk(full, depth + 1);
      } else if (e.isFile() && e.name.toLowerCase().endsWith('.ini')) {
        const low = e.name.toLowerCase();
        if (
          low === 'adb_usb.ini' ||
          low === 'emu-update-last-check.ini' ||
          low.startsWith('analytics')
        ) {
          continue;
        }
        iniPaths.push(full);
      }
    }
  }
  walk(root, 0);

  const names = new Set();
  const dirIniCount = new Map();
  for (const iniPath of iniPaths) {
    let text;
    try {
      text = fs.readFileSync(iniPath, 'utf8');
    } catch {
      continue;
    }
    if (!/^\s*path\s*=/im.test(text)) {
      continue;
    }
    const dataPath = readAvdIniDataPath(iniPath);
    if (!dataPath || !fs.existsSync(dataPath)) {
      continue;
    }
    names.add(path.basename(iniPath, '.ini'));
    const d = path.dirname(iniPath);
    dirIniCount.set(d, (dirIniCount.get(d) || 0) + 1);
  }

  let emuIniDir = '';
  let best = 0;
  for (const [d, c] of dirIniCount) {
    if (c > best) {
      best = c;
      emuIniDir = d;
    }
  }

  discoverAvdsUnderProfileCache = {
    names: [...names].sort(),
    emuIniDir,
  };
  return discoverAvdsUnderProfileCache;
}

/** Data directory from AVD config.ini (Android Studio can store .avd on D: etc.). */
function readAvdIniDataPath(iniPath) {
  try {
    const text = fs.readFileSync(iniPath, 'utf8');
    const m = text.match(/^\s*path\s*=\s*(.+)$/im);
    if (!m) {
      return null;
    }
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    v = v.replace(/\//g, path.sep);
    return path.normalize(v);
  } catch {
    return null;
  }
}

/** Pick an AVD root that actually contains *.ini so emulator -list-avds matches the SDK. */
function primaryAvdHomeForEmulator() {
  for (const h of collectAvdHomeCandidates()) {
    try {
      const hasIni = fs
        .readdirSync(h)
        .some(f => f.toLowerCase().endsWith('.ini'));
      if (hasIni) {
        return h;
      }
    } catch {
      /* skip */
    }
  }
  const { emuIniDir } = discoverAvdsUnderProfileAndroid();
  if (emuIniDir) {
    return emuIniDir;
  }
  return resolveAvdHome();
}

function listAvdNamesFromFilesystem() {
  const names = new Set();
  for (const avdHome of collectAvdHomeCandidates()) {
    try {
      for (const ent of fs.readdirSync(avdHome, { withFileTypes: true })) {
        if (ent.isDirectory() && ent.name.toLowerCase().endsWith('.avd')) {
          names.add(ent.name.replace(/\.avd$/i, ''));
        }
      }
      for (const ent of fs.readdirSync(avdHome, { withFileTypes: true })) {
        if (!ent.isFile() || !ent.name.toLowerCase().endsWith('.ini')) {
          continue;
        }
        const base = ent.name.replace(/\.ini$/i, '');
        const sibling = path.join(avdHome, `${base}.avd`);
        if (fs.existsSync(sibling)) {
          names.add(base);
          continue;
        }
        const iniPath = path.join(avdHome, ent.name);
        const dataPath = readAvdIniDataPath(iniPath);
        if (dataPath && fs.existsSync(dataPath)) {
          names.add(base);
        }
      }
    } catch {
      /* skip this root */
    }
  }
  for (const n of discoverAvdsUnderProfileAndroid().names) {
    names.add(n);
  }
  return [...names].sort();
}

function listAvdNames(sdk) {
  const emulatorBin = path.join(sdk, 'emulator', isWin ? 'emulator.exe' : 'emulator');
  const avdHomeForEmu = primaryAvdHomeForEmulator();
  const emuEnv = {
    ...process.env,
    ...env,
    ANDROID_SDK_ROOT: sdk,
    ANDROID_HOME: sdk,
  };
  if (avdHomeForEmu) {
    emuEnv.ANDROID_AVD_HOME = avdHomeForEmu;
  }

  if (fs.existsSync(emulatorBin)) {
    const r = spawnSync(emulatorBin, ['-list-avds'], {
      encoding: 'utf8',
      env: emuEnv,
      windowsHide: true,
    });
    const combined = `${r.stdout || ''}\n${r.stderr || ''}`;
    const fromCli = combined
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .filter(l => !l.startsWith('INFO') && !l.startsWith('WARNING'));
    if (fromCli.length) {
      return [...new Set(fromCli)].sort();
    }
  }

  return listAvdNamesFromFilesystem();
}

function ensureAndroidDevice(sdkForDevice) {
  if (!sdkForDevice) {
    return;
  }
  if (hasConnectedDevice(sdkForDevice)) {
    return;
  }
  const skipAutoEmu = extraArgs.some(
    a => a === '--deviceId' || a === '-d' || a.startsWith('--deviceId='),
  );
  if (skipAutoEmu) {
    return;
  }
  const avds = listAvdNames(sdkForDevice);
  if (avds.length === 0) {
    const roots = collectAvdHomeCandidates();
    const hint = roots.length
      ? `\n    ${roots.join('\n    ')}\n`
      : ` ${resolveAvdHome() || '(set ANDROID_AVD_HOME or USERPROFILE)'}\n`;
    const avdDir = resolveAvdHome();
    let emptyNote = '';
    try {
      if (avdDir && fs.existsSync(avdDir)) {
        const n = fs.readdirSync(avdDir).length;
        if (n === 0) {
          emptyNote =
            '  Your default folder …\\.android\\avd is empty — create a device in Android Studio (Device Manager → Create device).\n';
        }
      }
    } catch {
      /* ignore */
    }
    console.warn(
      '\n[android] No device in `adb devices` and no AVDs found.\n' +
        `  AVD roots checked:${hint}` +
        emptyNote +
        '  If you use a custom AVD location, set user env ANDROID_AVD_HOME to that folder.\n' +
        '  Otherwise create/start an AVD in Android Studio → Device Manager.\n',
    );
    return;
  }
  const name = avds[0];
  const emulatorBin = path.join(
    sdkForDevice,
    'emulator',
    isWin ? 'emulator.exe' : 'emulator',
  );
  const avdHomeForEmu = primaryAvdHomeForEmulator();
  const emuSpawnEnv = { ...env };
  if (avdHomeForEmu) {
    emuSpawnEnv.ANDROID_AVD_HOME = avdHomeForEmu;
  }
  console.log(`[android] No device connected — starting emulator "${name}"…`);
  const child = spawn(emulatorBin, ['-avd', name], {
    detached: true,
    stdio: 'ignore',
    env: emuSpawnEnv,
    windowsHide: false,
  });
  child.unref();
  const emuWaitSec = Math.max(60, parseInt(process.env.ANDROID_EMULATOR_WAIT_SEC || '360', 10) || 360);
  const emuPollSec = 3;
  const emuIters = Math.ceil(emuWaitSec / emuPollSec);
  console.log(
    `[android] Waiting for emulator in adb (up to ${Math.round(emuWaitSec / 60)} min; set ANDROID_EMULATOR_WAIT_SEC to override)…`,
  );
  for (let i = 0; i < emuIters; i++) {
    sleepSync(emuPollSec);
    if (hasConnectedDevice(sdkForDevice)) {
      console.log('[android] Device connected.\n');
      return;
    }
  }
  console.warn(
    '\n[android] Emulator did not show up in `adb devices` in time.\n' +
      '  Finish booting the emulator window, then run: npm run android\n',
  );
}

if (sdk) {
  maybeRestartAdbWhenNoOnlineDevice(sdk, env);
}

ensureAndroidDevice(sdk);

// installDebug always needs a device; without one, Gradle can run for minutes then fail anyway.
if (sdk && !hasConnectedDevice(sdk)) {
  const emulatorExe = path.join(sdk, 'emulator', isWin ? 'emulator.exe' : 'emulator');
  console.error(
    '\n[android] No online device — not starting React Native / Gradle.\n' +
      '  Fix `adb devices` first (each line should end with "device", not offline/unauthorized).\n\n' +
      '  Emulator closes immediately or never appears:\n' +
      '  • Android Studio → Device Manager → ⋮ on the AVD → Cold Boot Now or Wipe Data.\n' +
      '  • Add a fresh AVD: Pixel, API 34, x86_64 (Google APIs / without Play Store often fewer issues).\n' +
      '  • Windows: enable virtualization (WHPX/Hyper-V); update GPU drivers; try Software GLES in AVD settings.\n' +
      `  • Run the emulator from a terminal and read errors:\n      "${emulatorExe}" -list-avds\n` +
      `      "${emulatorExe}" -avd <name_from_list>\n\n` +
      '  Physical device: USB debugging on, cable, authorize this PC when prompted.\n' +
      '  Build APK only (no install): npm run gradle -- assembleDebug\n',
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [rnCli, 'run-android', ...extraArgs],
  {
    stdio: 'inherit',
    env,
    cwd: projectRoot,
  },
);

process.exit(result.status === null ? 1 : result.status);
