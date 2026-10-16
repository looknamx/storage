$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ShortcutPath = Join-Path -Path $DesktopPath -ChildPath "FleetManagement.lnk"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetVbs = Join-Path -Path $ScriptDir -ChildPath "run-hidden.vbs"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
# Point directly to wscript.exe running run-hidden.vbs so CMD is 100% invisible
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$TargetVbs`""
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "ระบบบริหารรถบริษัท คลังอะไหล่ และประวัติซ่อมบำรุง"
$Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,71"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully (Invisible Background CMD mode) at: $ShortcutPath" -ForegroundColor Green
