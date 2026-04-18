<#
.SYNOPSIS
    [非推奨] gstack-copilot-jp セットアップスクリプト (Windows)
.DESCRIPTION
    このスクリプトは非推奨です。
    VS Code v1.116+ では、gstack-copilot-jp フォルダをワークスペースに追加するだけで
    スキル・エージェント・ルールが自動認識されます。
    セットアップスクリプトの実行は不要です。

    レガシー: シンボリックリンク方式でのインストール（管理者権限必要）
#>

param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"

$SourceRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$SourceRoot\.github\skills")) {
    $SourceRoot = $PSScriptRoot
}

$CopilotSkillsDir = Join-Path $HOME ".copilot\skills"
$UserPromptsDir = Join-Path $env:APPDATA "Code\User\prompts"

function Write-Step($msg) { Write-Host "[gstack-copilot-jp] $msg" -ForegroundColor Cyan }
function Write-OK($msg) { Write-Host "  OK: $msg" -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "  SKIP: $msg" -ForegroundColor Yellow }

if ($Uninstall) {
    Write-Step "アンインストール中..."

    # スキルのシンボリックリンクを削除
    if (Test-Path $CopilotSkillsDir) {
        Get-ChildItem $CopilotSkillsDir -Directory | Where-Object {
            $_.Attributes -band [System.IO.FileAttributes]::ReparsePoint
        } | ForEach-Object {
            $target = (Get-Item $_.FullName).Target
            if ($target -and $target -like "*gstack-copilot-jp*") {
                Remove-Item $_.FullName -Force
                Write-OK "削除: $($_.Name)"
            }
        }
    }

    # エージェント・プロンプトのシンボリックリンクを削除
    if (Test-Path $UserPromptsDir) {
        Get-ChildItem $UserPromptsDir -File | Where-Object {
            $_.Attributes -band [System.IO.FileAttributes]::ReparsePoint
        } | ForEach-Object {
            $target = (Get-Item $_.FullName).Target
            if ($target -and $target -like "*gstack-copilot-jp*") {
                Remove-Item $_.FullName -Force
                Write-OK "削除: $($_.Name)"
            }
        }
    }

    Write-Step "アンインストール完了"
    exit 0
}

# --- インストール ---

Write-Step "gstack-copilot-jp セットアップ開始"
Write-Host "  ソース: $SourceRoot"

# 1. スキルディレクトリ作成
if (-not (Test-Path $CopilotSkillsDir)) {
    New-Item -ItemType Directory -Path $CopilotSkillsDir -Force | Out-Null
    Write-OK "作成: $CopilotSkillsDir"
}

# 2. 各スキルをシンボリックリンク
$skillsDir = Join-Path $SourceRoot ".github\skills"
$skillCount = 0
Get-ChildItem $skillsDir -Directory | ForEach-Object {
    $linkPath = Join-Path $CopilotSkillsDir $_.Name
    $targetPath = $_.FullName

    if (Test-Path $linkPath) {
        Write-Skip "$($_.Name) (既に存在)"
    } else {
        try {
            New-Item -ItemType SymbolicLink -Path $linkPath -Target $targetPath | Out-Null
            Write-OK "リンク: $($_.Name)"
            $skillCount++
        } catch {
            Write-Host "  ERROR: $($_.Name) - 管理者権限が必要かもしれません" -ForegroundColor Red
        }
    }
}

# 3. エージェント・プロンプトをユーザープロファイルにリンク
if (-not (Test-Path $UserPromptsDir)) {
    New-Item -ItemType Directory -Path $UserPromptsDir -Force | Out-Null
}

$agentsDir = Join-Path $SourceRoot ".github\agents"
$promptsDir = Join-Path $SourceRoot ".github\prompts"

foreach ($dir in @($agentsDir, $promptsDir)) {
    if (Test-Path $dir) {
        Get-ChildItem $dir -File | ForEach-Object {
            $linkPath = Join-Path $UserPromptsDir $_.Name
            if (-not (Test-Path $linkPath)) {
                try {
                    New-Item -ItemType SymbolicLink -Path $linkPath -Target $_.FullName | Out-Null
                    Write-OK "リンク: $($_.Name)"
                } catch {
                    Write-Host "  ERROR: $($_.Name)" -ForegroundColor Red
                }
            }
        }
    }
}

# 4. 完了
Write-Host ""
Write-Step "セットアップ完了!"
Write-Host "  スキル: $skillCount 個インストール"
Write-Host "  場所: $CopilotSkillsDir"
Write-Host ""
Write-Host "  使い方:" -ForegroundColor Cyan
Write-Host "    VS Code Copilot Chat で '/' を入力してスキル一覧を表示"
Write-Host "    /office-hours から始めると良いでしょう"
Write-Host ""
