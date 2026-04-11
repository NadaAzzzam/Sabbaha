#!/usr/bin/env node
/**
 * Prints a single line: absolute JAVA_HOME for Android Gradle (17–21), or nothing.
 * Used by android/gradlew and gradlew.bat so ./gradlew matches scripts/gradle.js.
 */
const path = require('path');
const { resolveJavaHomeForAndroidBuild } = require('./android-jdk');
const projectRoot = path.join(__dirname, '..');
const j = resolveJavaHomeForAndroidBuild(projectRoot);
if (j) {
  process.stdout.write(`${j}\n`);
}
