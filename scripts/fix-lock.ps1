Stop-Process -Id 3872,17272,20788,28724 -Force -ErrorAction SilentlyContinue
Start-Sleep 2
Remove-Item -Force "D:\Work\Nada\Sabbaha\android\.gradle\noVersion\buildLogic.lock" -ErrorAction SilentlyContinue
Write-Host "Done. Lock removed: $(!(Test-Path 'D:\Work\Nada\Sabbaha\android\.gradle\noVersion\buildLogic.lock'))"
