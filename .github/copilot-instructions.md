<!-- upstream: garrytan/gstack CLAUDE.md (dfe9df2375) adapted for GitHub Copilot CLI -->
<!-- adaptation: Claude Code → Copilot CLI, .claude/ → .github/, bun → npm where applicable -->
# gstack-copilot-jp development

GitHub Copilot（CLI + VS Code Chat）+ 日本語のAIソフトウェアファクトリー。
本家 [gstack](https://github.com/garrytan/gstack) の方法論を GitHub Copilot 向けに適応。

## 言語

このプロジェクトは日本語ファーストで進める。

- ユーザーへの応答は常に日本語で行う
- スキル、ツール、プロンプト、外部ドキュメントが英語で書かれていても、作業の結論とユーザー向け出力は日本語にする
- **SKILL.md 内の ask_user の質問文・選択肢テキストも日本語に翻訳して表示する**
- **英語のスキル指示を読んでも、ユーザーに見せるテキストは全て日本語にする。英語テキストをそのまま表示しない**
- スキルのデフォルト言語がこのルールを上書きしないこと

## スキルルーティング

リクエストが利用可能なスキルに一致する場合 → **必ず該当スキルを最初に呼び出す。**
直接回答したり、他のツールを先に使ったりしない。

| ユーザーの意図 | 呼び出すスキル |
|---|---|
| プロダクトのアイディア、「これ作る価値ある？」 | `/office-hours` |
| 戦略レビュー、スコープ、野心度 | `/plan-ceo-review` |
| アーキテクチャレビュー、データフロー | `/plan-eng-review` |
| デザインレビュー、UI/UX | `/plan-design-review` |
| 開発者体験、オンボーディング、API設計 | `/plan-devex-review` |
| 全レビューを一括で | `/autoplan` |

| デザイン相談、ブランド構築 | `/design-consultation` |
| デザイン案を複数見たい | `/design-shotgun` |
| デザインをHTMLに変換 | `/design-html` |
| コードレビュー、diff確認 | `/gstack-review` |
| デザイン実装レビュー | `/design-review` |
| DX実装レビュー | `/devex-review` |
| バグ、エラー、「なぜ壊れた？」 | `/investigate` |
| QA、テスト実行 | `/qa` |
| QAレポートのみ（修正なし） | `/qa-only` |
| セキュリティ監査、脆弱性 | `/cso` |
| パフォーマンス計測 | `/benchmark` |
| モデル比較、どのモデルがいい | `/benchmark-models` |
| コード品質ダッシュボード | `/health` |
| リリース、PR作成 | `/ship` |
| VERSIONキュー表示、並行PRのVERSION衡突検出 | `/landing-report` |
| マージ＆デプロイ | `/land-and-deploy` |
| デプロイ後の監視 | `/canary` |
| 週次振り返り | `/retro` |
| ドキュメント更新 | `/document-release` |
| PDF作成、markdownをPDFに | `/make-pdf` |
| 学習記録の管理 | `/learn` |
| セッション振り返り | `/learn 振り返り` |

| 「慎重にやって」、安全モード | `/careful` |
| ファイル編集を制限 | `/freeze` |
| フル安全モード | `/guard` |
| 制限解除 | `/unfreeze` |
| ブラウザで開く、サイトテスト | `/browse` |
| ブラウザCookieインポート | `/setup-browser-cookies` |
| 可視ブラウザ起動 | `/open-gstack-browser` |
| エージェント連携、ブラウザ共有 | `/pair-agent` |
| デプロイ環境の設定 | `/setup-deploy` |
| アップグレード | `/gstack-upgrade` |
| セッション保存 | `/context-save` |
| セッション復帰、どこまでやったっけ | `/context-restore` |

<!-- ↓ upstream CLAUDE.md (dfe9df2375) adapted for Copilot CLI ↓ -->

## Commands

```bash
npm test              # run all tests (vitest + browse) — run before every commit
npm run test:project  # project tests only (vitest run)
npm run test:browse   # browse tests only (cd browse && bun test)
```

Browse tests require Bun + Playwright. First time: `cd browse && bun install && bunx playwright install chromium`.

WSL + NTFS caveat: `@rollup/rollup-linux-x64-gnu` may not install automatically.
Run `npm install @rollup/rollup-linux-x64-gnu` manually if vitest fails to start.

## Testing

```bash
npm test              # run before every commit — free, <2s
```

`npm test` runs skill contract tests, structure tests (vitest), and browse
integration tests. Tests use ESM import format. All tests must pass before
creating a PR.

## Project structure

```
gstack-copilot-jp/
├── .github/
│   ├── copilot-instructions.md  # Project instructions (this file)
│   ├── hooks/
│   │   └── lifecycle.json       # Hook definitions (PascalCase events)
│   └── skills/          # 39 skills + bin/
│       ├── autoplan/    # /autoplan (auto-review pipeline: CEO → design → eng → DX)
│       ├── ship/        # /ship (release + PR creation)
│       ├── browse/      # /browse (headless browser QA)
│       ├── bin/         # Shared skill utilities
│       │   ├── gstack-codex-probe    # Outside Voice model detection
│       │   ├── gstack-review-log     # Review log writer
│       │   └── gstack-question-preference  # Question tuning
│       └── ...          # 34 more skills
├── bin/                 # CLI utilities (19 scripts)
│   ├── gstack-env       # Environment setup ($B definition)
│   ├── gstack-slug      # Repository slug extraction
│   ├── gstack-session-start.sh  # Session start hook
│   ├── gstack-session-end.sh    # Session end hook
│   ├── browse.sh        # Browser launch fallback
│   └── ...
├── browse/              # Headless browser CLI (Bun + Playwright)
│   ├── src/             # CLI + server + commands
│   │   ├── commands.ts  # Command registry (single source of truth)
│   │   ├── server.ts    # Bun.serve-based server
│   │   ├── snapshot.ts  # SNAPSHOT_FLAGS metadata array
│   │   └── error-handling.ts  # safeUnlink, safeKill, isProcessAlive
│   ├── test/            # Integration tests + fixtures
│   └── dist/            # Compiled binary (bun build --compile)
├── test/                # Project tests (vitest, ESM)
├── setup                # One-time setup script
├── CHANGELOG.md         # Release notes (user-facing)
├── VERSION              # Version number (monotonic)
├── DESIGN.md            # Design decision record (why we chose this shape)
├── ARCHITECTURE.md      # Current system layout & data flow
├── ETHOS.md             # Builder philosophy (Boil the Lake, Search Before Building)
├── ROADMAP.md           # Pending work and future plans
├── upstream-tracking.md # Upstream tracking ledger
├── upstream-tracking.json # Tracking data (machine-readable)
├── docs/
│   ├── vscode-setup.md
│   └── archive/         # Past design exploration & implementation plans
└── package.json         # Build scripts (vitest, browse)
```

## SKILL.md workflow

SKILL.md files are **edited directly** in `.github/skills/<skill-name>/SKILL.md`.
Unlike upstream gstack, this project does NOT use `.tmpl` templates or the
`gen-skill-docs` pipeline. SKILL.md files are the source of truth.

To add a new browse command: add it to `browse/src/commands.ts` and rebuild.
To add a snapshot flag: add it to `SNAPSHOT_FLAGS` in `browse/src/snapshot.ts` and rebuild.

**Token ceiling:** SKILL.md files trip a warning above 160KB (~40K tokens).
This is a "watch for feature bloat" guardrail, not a hard gate. Modern flagship
models have 200K-1M context windows. The ceiling exists to catch runaway growth,
not to force compression on carefully-tuned big skills (`ship`, `plan-ceo-review`,
`office-hours` legitimately pack 25-35K tokens of behavior).

## Platform-agnostic design

Skills must NEVER hardcode framework-specific commands, file patterns, or directory
structures. Instead:

1. **Read copilot-instructions.md** for project-specific config (test commands, etc.)
2. **If missing, ask_user** — let the user tell you or search the repo
3. **Persist the answer to copilot-instructions.md** so we never have to ask again

This applies to test commands, deploy commands, and any other project-specific
behavior. The project owns its config; gstack reads it.

## Writing SKILL files

SKILL.md files are **prompt templates read by Copilot**, not bash scripts.
Each bash code block runs in a separate shell — variables do not persist between blocks.

Rules:
- **Use natural language for logic and state.** Don't use shell variables to pass
  state between code blocks. Instead, tell Copilot what to remember and reference
  it in prose (e.g., "the base branch detected in Step 0").
- **Don't hardcode branch names.** Detect `main`/`master`/etc dynamically via
  `gh pr view` or `gh repo view`. Use "the base branch" in prose, `<base>` in
  code block placeholders.
- **Keep bash blocks self-contained.** Each code block should work independently.
  If a block needs context from a previous step, restate it in the prose above.
- **Express conditionals as English.** Instead of nested `if/elif/else` in bash,
  write numbered decision steps: "1. If X, do Y. 2. Otherwise, do Z."

## Writing style (V1)

Default output from every skill follows the Writing Style section in the SKILL.md
preamble: jargon glossed on first use, questions framed in outcome terms ("what
breaks for your users if...") not implementation terms, short sentences, decisions
close with user impact. Power users who want tighter V0 prose set
`gstack-config set explain_level terse` (binary switch, no middle mode).

## Browser interaction

When you need to interact with a browser (QA, dogfooding, cookie setup), use the
`/browse` skill or run the browse binary directly via `$B <command>`. Always prefer
the `/browse` skill family — do not attempt browser operations in general responses.

`$B` is defined by `eval "$(bin/gstack-env)"`. It prefers compiled `browse/dist/browse`,
falls back to `bin/browse.sh`.

## Compiled binaries

The `browse/dist/` directory contains a compiled Bun binary (`browse`, `find-browse`).
The `./setup` script builds from source for the current platform.

When staging files, always use specific filenames (`git add file1 file2`) — never
`git add .` or `git add -A`, which may accidentally include large binaries.

## Commit style

**Always bisect commits.** Every commit should be a single logical change. When
you've made multiple changes (e.g., a rename + a rewrite + new tests), split them
into separate commits before pushing. Each commit should be independently
understandable and revertable.

Examples of good bisection:
- Rename/move separate from behavior changes
- Test infrastructure separate from test implementations
- Mechanical refactors separate from new features
- Skill additions/removals are atomic commits (splitting directory changes from
  test/routing updates causes CI mid-failures)

Conventional Commits: `<type>(<scope>): <description>`
type: feat, fix, test, refactor, docs, chore, style, perf.
PR diffs target 300 lines or fewer. Never `git add -A` for bulk commits.

When the user says "bisect commit" or "bisect and push," split staged/unstaged
changes into logical commits and push.

## Slop-scan: AI code quality, not AI code hiding

We use [slop-scan](https://github.com/benvinegar/slop-scan) to catch patterns where
AI-generated code is genuinely worse than what a human would write. We are NOT trying
to pass as human code. We are AI-coded and proud of it. The goal is code quality.

```bash
npx slop-scan scan .          # human-readable report
npx slop-scan scan . --json   # machine-readable for diffing
```

### What to fix (genuine quality improvements)

- **Empty catches around file ops** — use `safeUnlink()` (ignores ENOENT, rethrows
  EPERM/EIO). A swallowed EPERM in cleanup means silent data loss.
- **Empty catches around process kills** — use `safeKill()` (ignores ESRCH, rethrows
  EPERM). A swallowed EPERM means you think you killed something you didn't.
- **Redundant `return await`** — remove when there's no enclosing try block. Saves a
  microtask, signals intent.
- **Typed exception catches** — `catch (err) { if (!(err instanceof TypeError)) throw err }`
  is genuinely better than `catch {}` when the try block does URL parsing or DOM work.
  You know what error you expect, so say so.

### What NOT to fix (linter gaming, not quality)

- **String-matching on error messages** — `err.message.includes('closed')` is brittle.
  Playwright/Chrome can change wording anytime. If a fire-and-forget operation can fail
  for ANY reason and you don't care, `catch {}` is the correct pattern.
- **Adding comments to exempt pass-through wrappers** — "alias for active session" above
  a method just to trip slop-scan's exemption rule is noise, not documentation.
- **Tightening best-effort cleanup paths** — shutdown, emergency cleanup, and disconnect
  code should use `safeUnlinkQuiet()` (swallows ALL errors). A cleanup path that throws
  on EPERM means the rest of cleanup doesn't run. That's worse.

### Utilities in `browse/src/error-handling.ts`

| Function | Use when | Behavior |
|----------|----------|----------|
| `safeUnlink(path)` | Normal file deletion | Ignores ENOENT, rethrows others |
| `safeUnlinkQuiet(path)` | Shutdown/emergency cleanup | Swallows all errors |
| `safeKill(pid, signal)` | Sending signals | Ignores ESRCH, rethrows others |
| `isProcessAlive(pid)` | Boolean process checks | Returns true/false, never throws |

Don't chase the number. Fix patterns that represent actual code quality problems.
Accept findings where the "sloppy" pattern is the correct engineering choice.

## CHANGELOG + VERSION style

**Versioning invariant.** VERSION is a monotonic ordered release identifier, not a
strict semver commitment. The bump level (major/minor/patch) expresses intent at
ship time.

**VERSION and CHANGELOG are branch-scoped.** Every feature branch that ships gets its
own version bump and CHANGELOG entry. The entry describes what THIS branch adds —
not what was already on main.

**When to write the CHANGELOG entry:**
- At `/ship` time, not during development or mid-branch.
- The entry covers ALL commits on this branch vs the base branch.
- Never fold new work into an existing CHANGELOG entry from a prior version that
  already landed on main.

**Key questions before writing:**
1. What branch am I on? What did THIS branch change?
2. Is the base branch version already released? (If yes, bump and create new entry.)
3. Does an existing entry on this branch already cover earlier work? (If yes, replace
   it with one unified entry for the final version.)

**Merging main does NOT mean adopting main's version.** When you merge origin/main into
a feature branch, main may bring new CHANGELOG entries and a higher VERSION. Your branch
still needs its OWN version bump on top.

**After merging main, always check:**
- Does CHANGELOG have your branch's own entry separate from main's entries?
- Is VERSION higher than main's VERSION?
- Is your entry the topmost entry in CHANGELOG (above main's latest)?
If any answer is no, fix it before continuing.

**After any CHANGELOG edit that moves, adds, or removes entries,** immediately run
`grep "^## \[" CHANGELOG.md` to verify no duplicates and sensible reverse-chronological
order. Gaps between version numbers are fine.

**Never orphan branch-internal versions.** If your branch bumped VERSION several times
during development, the final ship consolidates ALL of them into a single entry at
the final version. Readers see one release, not a branch diary.

CHANGELOG.md is **for users**, not contributors. Write it like product release notes:

- Lead with what the user can now **do** that they couldn't before.
- Use plain language, not implementation details. "You can now..." not "Refactored the..."
- **Never mention ROADMAP.md, internal tracking, or contributor-facing details.**
- Every entry should make someone think "oh nice, I want to try that."

**Only document what shipped between main and this change.** Keep out of the CHANGELOG:
- Branch resyncs, merge commits with main, rebase activity.
- Plan approvals, review outcomes, scope negotiations.
- "Work queued," "plan approved," "in-progress," "will ship later."
- Version-bump housekeeping when no user-facing work actually landed.

## AI effort compression

When estimating or discussing effort, always show both human-team and CC+gstack time:

| Task type | Human team | CC+gstack | Compression |
|-----------|-----------|-----------|-------------|
| Boilerplate / scaffolding | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Architecture / design | 2 days | 4 hours | ~5x |
| Research / exploration | 1 day | 3 hours | ~3x |

Completeness is cheap. Don't recommend shortcuts when the complete implementation
is a "lake" (achievable) not an "ocean" (multi-quarter migration). See the
Completeness Principle in the skill preamble for the full philosophy.

## Search before building

Before designing any solution that involves concurrency, unfamiliar patterns,
infrastructure, or anything where the runtime/framework might have a built-in:

1. Search for "{runtime} {thing} built-in"
2. Search for "{thing} best practice {current year}"
3. Check official runtime/framework docs

Three layers of knowledge: tried-and-true (Layer 1), new-and-popular (Layer 2),
first-principles (Layer 3). Prize Layer 3 above all. See ETHOS.md for the full
builder philosophy.

## Long-running tasks: don't give up

When running tests or any long-running background task, **poll until completion**.
Never say "I'll be notified when it completes" and stop checking — keep the loop
going until the task finishes or the user tells you to stop.

Report progress at each check (which tests passed, which are running, any failures
so far). The user wants to see the run complete, not a promise that you'll check later.