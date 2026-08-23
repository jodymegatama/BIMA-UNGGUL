Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "killed old nodes"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run dev -- --host 127.0.0.1 --port 5173" -WorkingDirectory "C:\laragon\www\bimaunggul\frontend" -WindowStyle Hidden
Write-Host "launched"
Start-Sleep -Seconds 6
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Format-Table LocalAddress,LocalPort,State,OwningProcess -AutoSize | Out-String | Write-Host
Get-Process node -ErrorAction SilentlyContinue | Format-Table Id,ProcessName -AutoSize | Out-String | Write-Host
try {
  $res = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 4
  Write-Host ("CURL OK " + $res.StatusCode + " len " + $res.Content.Length)
} catch {
  Write-Host ("CURL FAIL " + $_.Exception.Message)
}
