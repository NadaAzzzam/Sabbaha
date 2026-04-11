#!/usr/bin/env node
/**
 * Prints a single line: absolute JAVA_HOME for Android Gradle (17–21), or nothing.
 * Used by android/gradlew and gradlew.bat so ./gradlew matches scripts/gradle.js.
 */
const { resolveJavaHomeForAndroidBuild } = require('./android-jdk');
const j = resolveJavaHomeForAndroidBuild();
if (j) {
  process.stdout.write(`${j}\n`);
}
