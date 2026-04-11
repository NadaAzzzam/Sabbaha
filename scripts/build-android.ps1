$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = 'C:\Users\EGDEV07\AppData\Local\Android\Sdk'
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:PATH"

Set-Location 'D:\Work\Nada\Sabbaha\android'
& '.\gradlew.bat' 'app:installDebug' '-PreactNativeDevServerPort=8081' '--no-daemon'
