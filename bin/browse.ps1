#!/usr/bin/env pwsh
# bin/browse.ps1 - Windows ブラウザ CLI ラッパー
# 使い方: .\bin\browse.ps1 <command> [args...]
# 省略形: $B <command> [args...]
#
# 解決順:
#   1. browse/dist/browse (コンパイル済みバイナリ。bun build --compile)
#   2. browse/src/cli.ts (Bun 直接実行)
#   3. browse/src/cli.ts (Node.js + tsx フォールバック)
# Windows での運用は Git Bash / WSL の bin/browse.sh を推奨。
# このスクリプトは PowerShell ネイティブ環境向けのフォールバック。

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
    $ProjectRoot = Split-Path -Parent $PSScriptRoot
}

$BrowseDir = Join-Path $ProjectRoot 'browse'
# Windows ネイティブの場合は .exe バイナリのみ受け入れる
# (本家のコンパイル済みバイナリは ELF で Windows 実行不可)
$CompiledBin = $null
$WinBin = Join-Path $BrowseDir 'dist' 'browse.exe'
if (Test-Path $WinBin) {
    $CompiledBin = $WinBin
}
$CliScript = Join-Path $BrowseDir 'src' 'cli.ts'

# 状態ディレクトリをプロジェクトルートに設定
$env:BROWSE_STATE_DIR = Join-Path $ProjectRoot '.gstack'

# 1. コンパイル済みバイナリ優先 (Windows 用 .exe があるときだけ)
if ($CompiledBin) {
    & $CompiledBin @($Command) @Arguments
    exit $LASTEXITCODE
}

if (-not (Test-Path $CliScript)) {
    Write-Error "browse CLI not found at $CliScript. Run ./setup or 'bun run build' in browse/"
    exit 1
}

# 依存確認
$NodeModules = Join-Path $BrowseDir 'node_modules'
if (-not (Test-Path $NodeModules)) {
    Write-Host "[browse] Installing dependencies..." -ForegroundColor Yellow
    Push-Location $BrowseDir
    try {
        if (Get-Command bun -ErrorAction SilentlyContinue) {
            & bun install
        } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
            & npm install --production
        } else {
            Write-Error "Bun or npm is required to install browse dependencies. Install Bun from https://bun.sh/"
            exit 1
        }
        & npx playwright install chromium
    } finally {
        Pop-Location
    }
}

# 2. Bun 直接実行を優先
if (Get-Command bun -ErrorAction SilentlyContinue) {
    if ($Command) {
        & bun run $CliScript $Command @Arguments
    } else {
        & bun run $CliScript --help
    }
    exit $LASTEXITCODE
}

# 3. Node.js + tsx フォールバック
# Bun に Playwright pipe transport bug (bun#4253) があるため Windows では Node.js が公式フォールバック
if (Get-Command node -ErrorAction SilentlyContinue) {
    Push-Location $BrowseDir
    try {
        if ($Command) {
            & npx tsx $CliScript $Command @Arguments
        } else {
            & npx tsx $CliScript --help
        }
        exit $LASTEXITCODE
    } finally {
        Pop-Location
    }
}

Write-Error "Neither Bun nor Node.js found. Install Bun (https://bun.sh/) or Node.js (https://nodejs.org/)."
exit 1
