# bin/gstack-sync-user-skills.ps1
#
# `~/.copilot/skills/<skill>` を `<repo>/.github/skills/<skill>` と同期する
# (PowerShell / Windows 用)。
#
# bash 版 (bin/gstack-sync-user-skills) と同じロジックを Windows ネイティブで動かす。
# WSL/Git Bash を経由せず PowerShell から直接実行できるため、VS Code の
# 統合ターミナル (pwsh) ユーザー向けの主経路となる。
#
# 使い方:
#   pwsh -File bin/gstack-sync-user-skills.ps1            # 同期実行
#   pwsh -File bin/gstack-sync-user-skills.ps1 -DryRun    # 変更を加えず表示のみ
#   pwsh -File bin/gstack-sync-user-skills.ps1 -Quiet     # 変更があった場合のみ出力
#
# 終了コード: 0=成功, 1=エラー

[CmdletBinding()]
param(
  [switch]$DryRun,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir   = Split-Path -Parent $ScriptDir
$SkillsSrc = Join-Path $RootDir '.github\skills'
$SkillsDst = Join-Path $env:USERPROFILE '.copilot\skills'

if (-not (Test-Path $SkillsSrc)) {
  Write-Error "source skills directory not found: $SkillsSrc"
  exit 1
}

if (-not (Test-Path $SkillsDst)) {
  New-Item -ItemType Directory -Force -Path $SkillsDst | Out-Null
}

function Write-Log {
  param([string]$Message)
  if (-not $Quiet) {
    Write-Host $Message
  }
}

function New-Junction {
  param([string]$LinkPath, [string]$TargetPath)
  if ($DryRun) { return $true }
  # mklink /J = directory junction (no admin required, NTFS only)
  $linkWin   = $LinkPath
  $targetWin = $TargetPath
  $output = & cmd.exe /c "mklink /J `"$linkWin`" `"$targetWin`"" 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "mklink failed for $LinkPath : $output"
    return $false
  }
  return $true
}

function Remove-Link {
  param([string]$LinkPath)
  if ($DryRun) { return }
  $item = Get-Item -LiteralPath $LinkPath -Force -ErrorAction SilentlyContinue
  if ($null -eq $item) { return }
  if ($item.LinkType -in @('SymbolicLink', 'Junction')) {
    # Junction は Remove-Item で消せる (target は影響なし)
    [System.IO.Directory]::Delete($LinkPath, $false)
  } elseif ($item.PSIsContainer) {
    # 通常ディレクトリは消さない (呼び出し側で警告のみ)
    return
  } else {
    Remove-Item -LiteralPath $LinkPath -Force
  }
}

function Test-IsLink {
  param([string]$Path)
  $item = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
  if ($null -eq $item) { return $false }
  return $item.LinkType -in @('SymbolicLink', 'Junction')
}

# --- フェーズ 1: 期待される skill 名セットを構築 ---

# VS Code Copilot Chat 組み込みのスラッシュコマンド名
# (test/reserved-names.js と同期した一覧)
$ReservedNames = @(
  'explain','review','tests','fix','new','newNotebook','semanticSearch','setupTests',
  'error','compact','chronicle','generate','edit','search'
)

$expected = @{}
$rejected = @()
Get-ChildItem -LiteralPath $SkillsSrc -Directory | ForEach-Object {
  if ($_.Name -eq 'bin') { return }
  $skillFile = Join-Path $_.FullName 'SKILL.md'
  if (-not (Test-Path -LiteralPath $skillFile)) { return }
  if ($ReservedNames -contains $_.Name) {
    $script:rejected += $_.Name
    return
  }
  $expected[$_.Name] = $true
}

if ($rejected.Count -gt 0) {
  Write-Host "ERROR: 以下のスキルは VS Code 組み込みコマンドと衝突します:" -ForegroundColor Red
  foreach ($n in $rejected) {
    Write-Host "  - $n (built-in /$n を上書きしてしまう)" -ForegroundColor Red
  }
  Write-Host "  解決: ディレクトリと frontmatter name を 'gstack-<name>' 等にリネーム" -ForegroundColor Yellow
  exit 2
}

# --- フェーズ 2: 既存リンクを走査 — dangling は削除 ---
$removedNames = @()
$warnedDirs   = @()

if (Test-Path -LiteralPath $SkillsDst) {
  Get-ChildItem -LiteralPath $SkillsDst -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $name = $_.Name
    # gstack-copilot-jp 自身の root link はスキルではない
    if ($name -eq 'gstack-copilot-jp') { return }

    $linkPath    = $_.FullName
    $targetSkill = Join-Path $linkPath 'SKILL.md'
    $isLink      = Test-IsLink -Path $linkPath

    if (-not $isLink) {
      # 実ディレクトリ — ユーザーが手動コピーした可能性、触らない
      $script:warnedDirs += $name
      return
    }

    if (-not (Test-Path -LiteralPath $targetSkill)) {
      Write-Log ("REMOVE  {0}  (dangling link)" -f $name)
      Remove-Link -LinkPath $linkPath
      $script:removedNames += $name
      return
    }

    if (-not $expected.ContainsKey($name)) {
      Write-Log ("REMOVE  {0}  (no matching source skill)" -f $name)
      Remove-Link -LinkPath $linkPath
      $script:removedNames += $name
      return
    }
  }
}

# --- フェーズ 3: 不足リンクを作成 ---
$createdNames = @()
foreach ($name in $expected.Keys) {
  $linkPath   = Join-Path $SkillsDst $name
  $targetPath = Join-Path $SkillsSrc $name
  $skillCheck = Join-Path $linkPath 'SKILL.md'

  if ((Test-Path -LiteralPath $linkPath) -and (Test-Path -LiteralPath $skillCheck)) {
    continue
  }

  Write-Log ("CREATE  {0}  -> {1}" -f $name, $targetPath)
  if (New-Junction -LinkPath $linkPath -TargetPath $targetPath) {
    $createdNames += $name
  }
}

# --- フェーズ 4: サマリ ---
$prefix = if ($DryRun) { '[DRY-RUN] ' } else { '' }

if ($createdNames.Count -eq 0 -and $removedNames.Count -eq 0 -and $warnedDirs.Count -eq 0) {
  Write-Log ("{0}gstack-sync-user-skills: in sync ({1} skills)" -f $prefix, $expected.Count)
} else {
  Write-Log ''
  Write-Log "${prefix}Summary:"
  Write-Log ("  Source:  {0} ({1} skills)" -f $SkillsSrc, $expected.Count)
  Write-Log ("  Target:  {0}" -f $SkillsDst)
  Write-Log ("  Created: {0}" -f $createdNames.Count)
  Write-Log ("  Removed: {0}" -f $removedNames.Count)
  if ($warnedDirs.Count -gt 0) {
    Write-Log ("  Warning: {0} non-link directories left untouched:" -f $warnedDirs.Count)
    foreach ($w in $warnedDirs) {
      Write-Log ("    - {0} (real directory, not managed)" -f $w)
    }
  }
}

exit 0
