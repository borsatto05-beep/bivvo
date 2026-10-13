$ErrorActionPreference = 'Stop'
Write-Host "=== Bivvo 11.76 - Preparar Android com Capacitor ===" -ForegroundColor Magenta

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js nao encontrado. Instale Node.js 22+ antes de continuar." -ForegroundColor Red
  exit 1
}
$major = [int]((node --version).TrimStart('v').Split('.')[0])
if ($major -lt 22) {
  Write-Host "O Capacitor 8 exige Node.js 22 ou superior. Versao encontrada: $(node --version)" -ForegroundColor Red
  exit 1
}

npm install
npm run build

if (-not (Test-Path "android")) {
  npx cap add android
}

npm run android:assets
npm run android:patch
npx cap sync android

Write-Host "" 
Write-Host "Android preparado com sucesso." -ForegroundColor Green
Write-Host "Abra com: npx cap open android" -ForegroundColor Cyan
Write-Host "Ou execute: npm run cap:open" -ForegroundColor Cyan
