import tseslint from 'typescript-eslint';

// ─────────────────────────────────────────────────────────────
// 강제의 3층 중 "그물 2"(린트). 본 DSL의 일부 — 어느 레포에 올라가든 따라가는 헌법.
//  문 1: Mantine 직접 import 금지 (격리 구역 src/ui/** 만 예외)        — 헌법 7
//  문 2: hex 리터럴 직접 사용 금지 (theme.ts 파일 "하나"만 예외)        — 헌법 3·8
//
// ⚠️ files:['**/*.ts','**/*.tsx'] 명시 필수. 안 하면 flat config가 .ts/.tsx를
//    아예 안 훑어서 "에러 0"으로 거짓 통과한다. (02 §9-1)
// ─────────────────────────────────────────────────────────────

export default tseslint.config(
  // `.claude/worktrees/*`는 이 레포 자신의 체크아웃이라 훑으면 옛 커밋을 두 번 린트한다.
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', '.claude/**'] },

  // 본체: 두 문을 모든 .ts/.tsx에 건다.
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // 문 1
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@mantine/*'],
          message: 'Mantine 직접 import 금지 — @/ui 배럴만 사용 (헌법 7).',
        }],
      }],
      // 문 2 — 임의 값 리터럴 차단 (래퍼 *내부 구현*에서 토큰 우회를 막는다 — 닫힌 prop은 소비처만 막음)
      'no-restricted-syntax': ['error',
        {
          // (a) hex 색 리터럴
          selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3,4}){1,2}$/]',
          message: 'hex 리터럴 금지 — 색은 theme.ts 토큰만 (헌법 3·8).',
        },
        {
          // (b) borderRadius 인라인 하드코딩 — var(--mantine-radius-*)·0 만 허용.
          //     색(hex)처럼 radius도 "내부 저자가 토큰 우회"를 못 하게 막아, 토큰 갱신이 확실히 전파되게 한다.
          //     숫자 리터럴은 [value>0](정규식은 숫자에 안 먹음), px 문자열은 [value=/px$/]로 둘 다 잡는다. var()·0은 통과.
          selector: "Property[key.name='borderRadius'] > Literal[value>0], Property[key.name='borderRadius'] > Literal[value=/px$/]",
          message: 'borderRadius 하드코딩 금지 — var(--mantine-radius-xs|sm|md|full) 토큰만 (헌법 8 · px도 색과 동급 강제).',
        },
      ],
    },
  },

  // 예외 1: 격리 구역 전체는 Mantine 직접 import 허용 (폴더 단위 — 헌법 7·8)
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // 예외 2: hex는 theme.ts "파일 하나"만 허용 (폴더 아님 — 헌법 8)
  {
    files: ['src/ui/theme.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
);
