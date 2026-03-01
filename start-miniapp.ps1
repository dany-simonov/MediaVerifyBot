param(
    [Parameter(Mandatory=$true, HelpMessage="Вставь authtoken с https://dashboard.ngrok.com/get-started/your-authtoken")]
    [string]$NgrokToken
)

$Root = "C:\Users\redmi\Desktop\MediaVerifyBot"

Write-Host ""
Write-Host "=== MediaVerify Mini App Launcher ===" -ForegroundColor Cyan
Write-Host ""

# 1. Обновляем PATH чтобы ngrok был виден
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 2. Проверяем ngrok
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] ngrok не найден. Установи: winget install ngrok.ngrok" -ForegroundColor Red
    exit 1
}

# 3. Сохраняем токен
Write-Host "[1/6] Настройка ngrok токена..." -ForegroundColor Yellow
ngrok config add-authtoken $NgrokToken | Out-Null
Write-Host "      OK" -ForegroundColor Green

# 4. Убиваем старые процессы
Write-Host "[2/6] Остановка старых процессов..." -ForegroundColor Yellow
Get-Process ngrok  -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node   -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "      OK" -ForegroundColor Green

# 5. Запускаем FastAPI
Write-Host "[3/6] Запуск FastAPI (порт 8000)..." -ForegroundColor Yellow
$apiJob = Start-Job -Name "FastAPI" -ScriptBlock {
    Set-Location $using:Root
    & "$using:Root\.venv\Scripts\python.exe" -m uvicorn api.main:app --host 127.0.0.1 --port 8000
}
Start-Sleep -Seconds 4

# Проверяем API
$apiOk = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
        $apiOk = $true
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $apiOk) {
    Write-Host "      [WARN] API не отвечает на /health, продолжаем..." -ForegroundColor DarkYellow
} else {
    Write-Host "      OK" -ForegroundColor Green
}

# 6. Запускаем Vite dev-server
Write-Host "[4/6] Запуск Vite dev-server (порт 3000)..." -ForegroundColor Yellow
$viteJob = Start-Job -Name "Vite" -ScriptBlock {
    Set-Location "$using:Root\miniapp"
    & npm run dev
}
Start-Sleep -Seconds 5

# Проверяем Vite
$viteOk = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $code = (Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop).StatusCode
        if ($code -eq 200) { $viteOk = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
}
if (-not $viteOk) {
    Write-Host "      [WARN] Vite не отвечает, проверь ручками: curl http://localhost:3000" -ForegroundColor DarkYellow
} else {
    Write-Host "      OK" -ForegroundColor Green
}

# 7. Запускаем ngrok только для фронта (Vite проксирует API внутри себя)
Write-Host "[5/6] Запуск ngrok туннеля (порт 3000)..." -ForegroundColor Yellow
Start-Process ngrok -ArgumentList "http", "3000" -WindowStyle Minimized
Start-Sleep -Seconds 6

# 8. Читаем URL из ngrok local API
Write-Host "[6/6] Получение публичного URL..." -ForegroundColor Yellow
$frontUrl = $null
for ($i = 0; $i -lt 15; $i++) {
    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $frontUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
        if ($frontUrl) { break }
    } catch { }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan

if ($frontUrl) {
    Write-Host " Mini App URL (вставь в BotFather):" -ForegroundColor White
    Write-Host " $frontUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host " Команды BotFather:" -ForegroundColor White
    Write-Host " /mybots -> @MediaVerifyBot -> Bot Settings -> Menu Button -> $frontUrl" -ForegroundColor DarkCyan

    # Копируем в буфер обмена
    $frontUrl | Set-Clipboard
    Write-Host ""
    Write-Host " (URL уже скопирован в буфер обмена)" -ForegroundColor DarkGreen
} else {
    Write-Host " [ERROR] Не удалось получить URL ngrok." -ForegroundColor Red
    Write-Host " Открой http://localhost:4040 в браузере и посмотри URL" -ForegroundColor Yellow
}

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Нажми Ctrl+C чтобы остановить все сервисы" -ForegroundColor DarkGray
Write-Host ""

# Ждём пока пользователь не нажмёт Ctrl+C
try {
    while ($true) { Start-Sleep -Seconds 30 }
} finally {
    Write-Host ""
    Write-Host "Останавливаю сервисы..." -ForegroundColor Yellow
    Get-Process ngrok  -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process node   -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -Force
    Write-Host "Готово." -ForegroundColor Green
}
