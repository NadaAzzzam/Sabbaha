#!/usr/bin/env node
/** Used by android/gradlew.bat: one line = GRADLE_USER_HOME when cross-volume (Windows). */
const fs = require('fs');
const path = require('path');
const { resolveProjectLocalGradleUserHome } = require('./android-gradle-home');

const projectRoot = path.join(__dirname, '..');
const dest = resolveProjectLocalGradleUserHome(projectRoot);
if (dest) {
  fs.mkdirSync(dest, { recursive: true });
  process.stdout.write(`${dest}\n`);
}
