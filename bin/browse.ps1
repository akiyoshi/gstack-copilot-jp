#!/usr/bin/env pwsh
# bin/browse.ps1 — Windows ブラウザ CLI ラッパー
# 使い方: .\bin\browse.ps1 <command> [args...]
# 省略形: $B <command> [args...]

param(
    [Parameter(Position=0)]
    [string]$Command,

    [Parameter(Position=1, ValueFromRemainingArguments)]
    [string[]]$Arguments
)

$ErrorActionPreference = 'Stop'

# プロジェクトルート検出
$ProjectRoot = git rev-parse --show-toplevel 2>$null
if (-not $ProjectRoot) {
    $ProjectRoot = $PSScriptRoot | Split-Path -Parent
}

$BrowseDir = Join-Path $ProjectRoot 'browse'
$CliScript = Join-Path $BrowseDir 'src' 'cli.js'

if (-not (Test-Path $CliScript)) {
    # グローバルインストール
    $GlobalDir = Join-Path $HOME '.gstack-copilot-jp' 'browse'
    $CliScript = Join-Path $GlobalDir 'src' 'cli.js'
    if (-not (Test-Path $CliScript)) {
        Write-Error "browse CLI not found. Run setup.ps1 first."
        exit 1
    }
}

# node 確認
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is required. Install from https://nodejs.org/"
    exit 1
}

# Playwright インストール確認
$NodeModules = Join-Path (Split-Path $CliScript -Parent | Split-Path -Parent) 'node_modules'
if (-not (Test-Path $NodeModules)) {
    Write-Host "[browse] Installing dependencies..." -ForegroundColor Yellow
    Push-Location (Split-Path $CliScript -Parent | Split-Path -Parent)
    npm install --production 2>$null
    npx playwright install chromium 2>$null
    Pop-Location
}

# 状態ディレクトリをプロジェクトルートに設定
$env:BROWSE_STATE_DIR = Join-Path $ProjectRoot '.gstack'

# CLI 実行
if ($Command) {
    $allArgs = @($CliScript, $Command) + ($Arguments | Where-Object { $_ })
    & node @allArgs
} else {
    & node $CliScript --help
}
