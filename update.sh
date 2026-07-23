#!/usr/bin/env bash
# 사용법:
#   1단계(검수)  : ./update.sh <압축푼-폴더> <patch|minor|major>
#   2단계(발행)  : ./update.sh <압축푼-폴더> <patch|minor|major> --publish
#
#   예) ./update.sh ~/Downloads/erp-dsl-n minor              # 덮어쓰고 검수만
#       ./update.sh ~/Downloads/erp-dsl-n minor --publish    # 덮어쓰고 발행까지
#
# 입력 대기(read)가 없다. 1단계는 항상 멈추고 '다음에 칠 명령'을 크게 알려준다.
set -euo pipefail

SRC="${1:-}"
BUMP="${2:-patch}"
PUBLISH="${3:-}"
REPO="$(cd "$(dirname "$0")" && pwd)"

# --- 입력 검증 ---
if [[ -z "$SRC" ]]; then
  echo "❌ 사용법: ./update.sh <압축푼-폴더> <patch|minor|major> [--publish]"
  exit 1
fi
SRC="${SRC%/}"                          # 끝 슬래시 제거
if [[ ! -d "$SRC" ]]; then
  echo "❌ 폴더가 없습니다: $SRC"; exit 1
fi
if [[ ! -f "$SRC/package.json" && ! -d "$SRC/src" ]]; then
  echo "⚠️  $SRC 안에 src/ 가 안 보입니다. 압축이 한 겹 더 들어가 있을 수 있어요."
  exit 1
fi

echo "▶ 재료: $SRC"
echo "▶ 공장: $REPO"
echo "▶ 버전: $BUMP"
echo

# --- 1. 덮어쓰기 (레포 인프라·인증·git은 보존) ---
# 웹에서 받은 건 '소스 트리'다. package.json(발행설정)·.gitignore·.npmignore·.npmrc는
# 레포가 주인이므로 절대 덮어쓰지 않는다. 버전업은 아래 npm version이 담당한다.
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.npmrc' \
  --exclude='.gitignore' \
  --exclude='.npmignore' \
  --exclude='package.json' \
  --exclude='update.sh' \
  "$SRC/" "$REPO/"

cd "$REPO"

# --- 2. 변경 없으면 종료 ---
if [[ -z "$(git status --porcelain)" ]]; then
  echo "✅ 바뀐 내용이 없습니다. 발행할 것 없음."
  exit 0
fi

# --- 3. 변경 요약 + tar 검수 ---
echo
echo "=== 바뀐 파일 ==="
git status --short
echo
echo "=== 이번에 발행될 파일(검수) ==="
npm pack --dry-run 2>&1 | grep 'npm notice' | grep -iE '\.(ts|tsx|md|json|css)$' || true
echo

# --- 4. --publish 없으면 여기서 멈추고 다음 명령을 크게 안내 ---
if [[ "$PUBLISH" != "--publish" ]]; then
  echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
  echo "┃  검수 끝. 위 목록 OK면 아래 줄을 그대로 다시 실행하세요:       ┃"
  echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
  echo
  echo "    $REPO/update.sh $SRC $BUMP --publish"
  echo
  echo "(아직 커밋·발행 안 함. 덮어쓴 파일은 'git restore .' 로 되돌릴 수 있음)"
  exit 0
fi

# --- 5. 발행 ---
echo "=== 커밋 → $BUMP 버전업 → push(태그) → CI publish ==="
git add -A
git commit -m "sync: 웹 최신본 반영"
npm version "$BUMP" -m "release: %s"
git push origin main --follow-tags   # v* 태그 push → .github/workflows/publish.yml 이 npm publish 수행

echo
echo "🎉 태그 push 완료 → GitHub Actions(publish.yml)가 자동 발행. Actions 탭에서 결과 확인."
echo "   소비자: npm install @jjaim519/erp-dsl@latest"
