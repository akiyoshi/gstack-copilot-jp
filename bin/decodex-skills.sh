#!/usr/bin/env bash
# bin/decodex-skills.sh — Outside Voice 言語刷新スクリプト (v1.2)
#
# 目的: SKILL.md / .md 文書から Codex CLI 表記を Outside Voice 表記へ機械置換する。
# 互換シム名 (`gstack-codex-probe`, `_gstack_codex_*`) は保持する。
#
# 使い方:
#   bin/decodex-skills.sh [--dry-run] PATH [PATH...]
#   bin/decodex-skills.sh --all              # .github/skills/*/SKILL.md を一括処理 (allowlist 除く)
#
# 設計判断:
# - sed の in-place 編集 (BSD/GNU 互換のため macOS の sed -i '' を使わず一時ファイル方式)
# - 互換シム参照は protect → 置換 → restore の 3 段階で保護
# - allowlist は契約テスト (test/skill-contracts.test.js) と一致させる

set -euo pipefail

DRY_RUN=0
TARGETS=()

ALLOWLIST=(
  "pair-agent"
  "retro"
  "cso"
  "investigate"
  "qa"
  "qa-only"
  "land-and-deploy"
)

is_allowlisted() {
  local path="$1"
  for skill in "${ALLOWLIST[@]}"; do
    if [[ "$path" == *"/${skill}/SKILL.md" ]]; then
      return 0
    fi
  done
  return 1
}

usage() {
  cat <<'EOF'
Usage: bin/decodex-skills.sh [--dry-run] PATH [PATH...]
       bin/decodex-skills.sh [--dry-run] --all

Replaces Codex CLI references with Outside Voice terminology while
preserving compatibility shim names (gstack-codex-probe, _gstack_codex_*).

Options:
  --dry-run   Print diff without modifying files
  --all       Process all .github/skills/*/SKILL.md (excluding allowlist)
EOF
}

# 置換ルール: パターン → 置換後
# 順序が重要 (具体的なパターンを先に)
apply_replacements() {
  local file="$1"
  local tmp="${file}.decodex.tmp"

  # 互換シム参照を sentinel に退避 (sed 置換の影響を受けないように)
  # __SHIM_PROBE__ / __SHIM_FN_*__ という置き換えにくい sentinel を使う
  sed -E \
    -e 's/gstack-codex-probe/__SHIM_PROBE__/g' \
    -e 's/_gstack_codex_([a-z_]+)/__SHIM_FN_\1__/g' \
    "$file" > "$tmp"

  # 1. ラベル変更: CODEX SAYS → OUTSIDE VOICE SAYS
  sed -i.bak -E 's/CODEX SAYS/OUTSIDE VOICE SAYS/g' "$tmp"

  # 2. degradation tag: [codex-only] → [outside-only], [subagent-only] → [primary-only]
  sed -i.bak -E 's/\[codex-only\]/[outside-only]/g' "$tmp"
  sed -i.bak -E 's/\[subagent-only\]/[primary-only]/g' "$tmp"
  sed -i.bak -E 's/\[codex-unavailable[^]]*\]/[outside-unavailable]/g' "$tmp"
  sed -i.bak -E 's/\[codex stalled[^]]*\]/[outside voice stalled]/g' "$tmp"

  # 3. timeout/empty メッセージ
  sed -i.bak -E 's/Codex timed out after ([0-9]+) minutes?/Outside Voice timed out after \1 minutes/g' "$tmp"
  sed -i.bak -E 's/Codex returned no response/Outside Voice unavailable/g' "$tmp"
  sed -i.bak -E 's/Codex returned empty/Outside Voice returned empty/g' "$tmp"

  # 4. インストール推奨の削除 (誤誘導排除) — Codex CLI 必須ではないため
  sed -i.bak -E '/npm install -g @openai\/codex/d' "$tmp"
  sed -i.bak -E 's|`npm install -g @openai/codex`||g' "$tmp"
  sed -i.bak -E 's/Install Codex for cross-model coverage[^"]*/See DESIGN.md for the multi-model Outside Voice architecture/g' "$tmp"
  sed -i.bak -E 's/Codex CLI not found[^"]*/Outside Voice unavailable — running with primary subagent only/g' "$tmp"
  # ~/.codex/plans 等のユーザーディレクトリ参照: 削除 (Codex CLI 前提なので不要)
  sed -i.bak -E 's|"\$HOME/\.codex/plans"||g' "$tmp"
  sed -i.bak -E 's|\$HOME/\.codex/plans||g' "$tmp"

  # 5. Skill log keys: ship's dashboard 互換のログキーを改名
  sed -i.bak -E 's/\bcodex-plan-review\b/outside-voice-plan-review/g' "$tmp"
  sed -i.bak -E 's/\bcodex-review\b/outside-voice-review/g' "$tmp"

  # 6. mktemp prefix: codex-drl- 等の一時ファイル接頭辞を改名
  sed -i.bak -E 's|/tmp/codex-([a-z]+)-|/tmp/outside-voice-\1-|g' "$tmp"

  # 7. プロンプト/見出し中の "Codex" 言及
  #    "ask Codex" / "ran Codex" / "Codex found" のような動詞句
  sed -i.bak -E 's/\bCodex (found|reported|flagged|surfaced)\b/Outside Voice \1/g' "$tmp"
  sed -i.bak -E 's/\bask Codex\b/ask the outside voice/g' "$tmp"
  sed -i.bak -E 's/\bran Codex\b/ran the outside voice/g' "$tmp"
  sed -i.bak -E 's/\b(via|using|invoke|run) Codex\b/\1 the outside voice/g' "$tmp"
  sed -i.bak -E 's/\bCodex (says|said|noted)\b/Outside Voice \1/g' "$tmp"

  # 8. CONSENSUS TABLE 列ヘッダー
  sed -i.bak -E 's/Claude  Codex  Consensus/Primary  OutVoice  Consensus/g' "$tmp"
  sed -i.bak -E 's/Claude  Codex/Primary  OutVoice/g' "$tmp"

  # 9. "Claude subagent" / "subagent (Claude)" → "Primary subagent"
  sed -i.bak -E 's/Claude subagent/Primary subagent/g' "$tmp"

  # 10. "Codex (CEO|design|eng|DX) voice" → "Outside Voice (\1)"
  sed -i.bak -E 's/Codex (CEO|design|eng|DX) voice/Outside Voice (\1)/g' "$tmp"

  # 11. "Codex" 単独参照 (汎用) — 残った素の Codex/codex を outside voice に置換
  #    シム名と log key, mktemp prefix は既に処理済み or sentinel に退避
  sed -i.bak -E 's/\bCODEX\b/OUTSIDE VOICE/g' "$tmp"
  sed -i.bak -E 's/\bCodex\b/Outside Voice/g' "$tmp"
  sed -i.bak -E 's/\bcodex\b/outside voice/g' "$tmp"

  # --- Semantic protection (post-pass): rule 9 / rule 11 が生んだ縮退を補正 ---
  # 12. Rule 9 が生んだ自己矛盾ヘッダーを修正:
  #     "(Claude subagent)" は元々「Outside Voice の fallback として走る fresh-context な Claude」
  #     を指していた。"Primary subagent" だと「主役」の意味になり矛盾するため、
  #     "independent subagent" (fresh-context な独立 voice) に統一する。
  sed -i.bak -E 's/\(Primary subagent\)/(independent subagent)/g' "$tmp"
  # 13. 大文字版 "CLAUDE SUBAGENT" は rule 9 (case-sensitive) に拾われない。
  #     見出しレベルでも統一する。
  sed -i.bak -E 's/CLAUDE SUBAGENT/INDEPENDENT SUBAGENT/g' "$tmp"
  # 14. JSONL の SOURCE field 値: スペース入りトークンを単一トークンに圧縮。
  #     "outside voice+subagent" → "outside+independent" 等。grep しやすく、autoplan の
  #     "outside+primary" 命名空間と整合する。
  sed -i.bak -E 's/"outside voice\+subagent"/"outside+independent"/g' "$tmp"
  sed -i.bak -E 's/"outside voice-only"/"outside-only"/g' "$tmp"
  sed -i.bak -E 's/"subagent-only"/"independent-only"/g' "$tmp"
  # 15. 冗長な "(plan review — outside voice):" を "(plan review):" に圧縮。
  #     元 "CODEX SAYS (plan review — outside voice)" の "outside voice" は generic 説明だったが、
  #     "OUTSIDE VOICE SAYS (plan review — outside voice)" になるとトートロジー。
  sed -i.bak -E 's/SAYS \(plan review — outside voice\)/SAYS (plan review)/g' "$tmp"
  # 16. dashboard prose: "(legacy)" / "(new auto-scaled)" の二項対立は v1.2 rename で
  #     不適切（同一 release で改名したものを legacy と呼ぶ）。同一 cluster として記述。
  sed -i.bak -E 's/`adversarial-review` \(new auto-scaled\) and `outside-voice-review` \(legacy\)/`adversarial-review` and `outside-voice-review` (same review log cluster)/g' "$tmp"

  # シム参照を復元
  sed -i.bak -E 's/__SHIM_PROBE__/gstack-codex-probe/g' "$tmp"
  sed -i.bak -E 's/__SHIM_FN_([a-z_]+)__/_gstack_codex_\1/g' "$tmp"

  rm -f "${tmp}.bak"

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "=== [dry-run] $file ==="
    diff -u "$file" "$tmp" || true
    rm -f "$tmp"
  else
    if ! cmp -s "$file" "$tmp"; then
      mv "$tmp" "$file"
      echo "[modified] $file"
    else
      rm -f "$tmp"
      echo "[unchanged] $file"
    fi
  fi
}

# 引数処理
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --all)
      # .github/skills/*/SKILL.md を allowlist 除外して列挙
      while IFS= read -r f; do
        if ! is_allowlisted "$f"; then
          TARGETS+=("$f")
        fi
      done < <(find .github/skills -mindepth 2 -maxdepth 2 -name 'SKILL.md' -type f)
      shift
      ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; usage; exit 2 ;;
    *) TARGETS+=("$1"); shift ;;
  esac
done

if [ "${#TARGETS[@]}" -eq 0 ]; then
  echo "No targets specified." >&2
  usage
  exit 2
fi

for target in "${TARGETS[@]}"; do
  if [ ! -f "$target" ]; then
    echo "[skip] $target (not a file)" >&2
    continue
  fi
  apply_replacements "$target"
done
