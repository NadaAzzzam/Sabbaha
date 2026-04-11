Get-Process | Where-Object { $_.Name -match 'java|studio|gradle' } | Select-Object Id, Name | Format-Table
