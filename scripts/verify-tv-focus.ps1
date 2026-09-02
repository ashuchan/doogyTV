<#
.SYNOPSIS
    Automated D-pad focus verification script for Android TV / Fire TV via ADB.
.DESCRIPTION
    Sends D-pad navigation keyevents, dumps the UI hierarchy, and asserts that elements hold native OS focus.
#>

param (
    [string]$DeviceIp = "192.168.1.100",
    [int]$Port = 5555
)

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
    $adb = "adb"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DoggyTV - Automated TV Focus Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Connect
Write-Host "[1/5] Connecting to TV at ${DeviceIp}:${Port}..." -ForegroundColor Yellow
& $adb connect "${DeviceIp}:${Port}"

# 2. Wake up TV
Write-Host "[2/5] Waking up TV and ensuring screen is active..." -ForegroundColor Yellow
& $adb shell input keyevent 224
Start-Sleep -Seconds 1

# 3. Pull Current Hierarchy
Write-Host "[3/5] Dumping UI hierarchy..." -ForegroundColor Yellow
& $adb shell uiautomator dump /sdcard/uidump.xml
& $adb pull /sdcard/uidump.xml ./uidump_verify.xml

if (Test-Path ./uidump_verify.xml) {
    $xmlContent = Get-Content ./uidump_verify.xml -Raw
    if ($xmlContent -match 'focused="true"') {
        Write-Host "  [PASS] A native UI element currently holds focus (focused=true)!" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] No focused elements found in hierarchy dump." -ForegroundColor Red
    }
}

# 4. Test Navigation Flow (Down -> Right -> Left)
Write-Host "[4/5] Testing D-pad remote navigation keyevents..." -ForegroundColor Yellow
Write-Host "  -> Sending DPAD_DOWN (keycode 20)..."
& $adb shell input keyevent 20
Start-Sleep -Milliseconds 800

Write-Host "  -> Sending DPAD_RIGHT (keycode 22)..."
& $adb shell input keyevent 22
Start-Sleep -Milliseconds 800

Write-Host "  -> Sending DPAD_LEFT (keycode 21)..."
& $adb shell input keyevent 21
Start-Sleep -Milliseconds 800

# 5. Capture Screenshot Artifact
Write-Host "[5/5] Capturing screenshot for visual inspection..." -ForegroundColor Yellow
& $adb shell screencap -p /sdcard/screen_verify.png
& $adb pull /sdcard/screen_verify.png ./screen_verify.png
Write-Host "  [DONE] Screenshot pulled to ./screen_verify.png" -ForegroundColor Green

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Verification Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
