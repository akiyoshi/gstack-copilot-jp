#!/bin/bash
# [非推奨] gstack-copilot-jp セットアップスクリプト (macOS/Linux)
#
# このスクリプトは非推奨です。
# VS Code v1.116+ では、gstack-copilot-jp フォルダをワークスペースに追加するだけで
# スキル・エージェント・ルールが自動認識されます。
# セットアップスクリプトの実行は不要です。
#
# レガシー: シンボリックリンク方式でのインストール
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_ROOT="$SCRIPT_DIR"

COPILOT_SKILLS_DIR="$HOME/.copilot/skills"

step() { echo -e "\033[36m[gstack-copilot-jp]\033[0m $1"; }
ok()   { echo -e "  \033[32mOK:\033[0m $1"; }
skip() { echo -e "  \033[33mSKIP:\033[0m $1"; }
err()  { echo -e "  \033[31mERROR:\033[0m $1"; }

if [ "${1:-}" = "--uninstall" ]; then
    step "アンインストール中..."
    if [ -d "$COPILOT_SKILLS_DIR" ]; then
        find "$COPILOT_SKILLS_DIR" -maxdepth 1 -type l | while read -r link; do
            target="$(readlink "$link" 2>/dev/null || true)"
            case "$target" in
                *gstack-copilot-jp*) rm -f "$link"; ok "削除: $(basename "$link")" ;;
            esac
        done
    fi
    step "アンインストール完了"
    exit 0
fi

step "gstack-copilot-jp セットアップ開始"
echo "  ソース: $SOURCE_ROOT"

# 1. スキルディレクトリ作成
mkdir -p "$COPILOT_SKILLS_DIR"

# 2. 各スキルをシンボリックリンク
SKILL_COUNT=0
for skill_dir in "$SOURCE_ROOT/.github/skills"/*/; do
    skill_name="$(basename "$skill_dir")"
    link_path="$COPILOT_SKILLS_DIR/$skill_name"

    if [ -e "$link_path" ]; then
        skip "$skill_name (既に存在)"
    else
        ln -s "$skill_dir" "$link_path"
        ok "リンク: $skill_name"
        SKILL_COUNT=$((SKILL_COUNT + 1))
    fi
done

# 3. 完了
echo ""
step "セットアップ完了!"
echo "  スキル: $SKILL_COUNT 個インストール"
echo "  場所: $COPILOT_SKILLS_DIR"
echo ""
echo "  使い方:"
echo "    VS Code Copilot Chat で '/' を入力してスキル一覧を表示"
echo "    /office-hours から始めると良いでしょう"
echo ""
