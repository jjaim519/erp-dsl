// 카탈로그 드리프트 검사 — `_catalog`(문서) ↔ `index.ts`(수출) ↔ `_mobileDemos`(예시)를 기계로 대조한다.
//
//  왜 필요한가: 조사가 "별도 부품파의 실제 비용은 코드 중복이 아니라 **문서 부패**"라고 지목했다
//  (Microsoft fluent2 실측: 문서가 나열한 iOS 부품 12개 vs 실제 코드 ~40개, README가 없는 파일을 가리킴).
//  우리 방어는 `_catalog` 단일 출처 + /dev 박물관인데, **그 단일 출처를 사람이 손으로 맞춰왔다.**
//  손으로 맞추는 건 언젠가 틀린다 — 그래서 기계에 넘긴다.
//
//  검사하는 것(전부 명확히 판정 가능한 것만):
//   1. 카탈로그가 없는 부품을 가리키는가        (문서 → 코드)
//   2. Mobile* 부품에 라이브 예시가 있는가       (부품 → 박물관)
//   3. 카탈로그에 같은 이름이 두 번 있는가
//  검사하지 않는 것: "수출됐는데 카탈로그에 없다" — 타입·훅·Providers 등 부품 아닌 수출이 많아
//   기계가 가릴 수 없다. 그건 사람이 큐레이션하는 영역이다(헌법 4).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ui = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'ui');
const read = (f) => readFileSync(join(ui, f), 'utf8');

// ── index.ts에서 *값* 수출 이름만 뽑는다(`type X`는 제외, `X as Y`는 별칭 Y가 바깥 이름) ──
const exported = new Set();
for (const m of read('index.ts').matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
  for (const raw of m[1].split(',')) {
    const s = raw.trim();
    if (!s || s.startsWith('type ')) continue;
    const alias = s.split(/\s+as\s+/);
    exported.add((alias[1] ?? alias[0]).trim());
  }
}

// ── _catalog.ts 항목 이름 — `{ name: 'X', layer:` 만 잡는다(props의 `{ name: 'color', kind:`와 구분) ──
const catalog = [];
for (const m of read('_catalog.ts').matchAll(/\{\s*name:\s*'([^']+)'\s*,\s*layer:/g)) catalog.push(m[1]);

// ── _mobileDemos.tsx의 MOBILE_DEMOS 키 ──
const demos = new Set();
for (const m of read('_mobileDemos.tsx').matchAll(/^\s{2}([A-Za-z][\w]*):\s*\{\s*render:/gm)) demos.add(m[1]);

// ── role 게이트 — 「부품명 아래 한 줄」 계약을 기계가 지킨다 ────────────────────
//  role은 박물관에서 **평문으로** 그려진다(`<Text>{entry.role}</Text>`). 그래서
//   · 길면 부품명 아래에 문단이 깔리고(설명이 부품을 덮는다)
//   · 마크다운은 `**`가 글자 그대로 찍힌다.
//  근거는 소스 파일 헤더 주석이 받는다 — 실제로 role>150자였던 50개 전부 헤더에 같은 글이 있었다.
const ROLE_MAX = 80;
const roleProblems = [];
for (const m of read('_catalog.ts').matchAll(/\{\s*name:\s*'([^']+)'\s*,\s*layer:\s*'[^']+'\s*,\s*role:\s*'((?:[^'\\]|\\.)*)'/g)) {
  const [, name, role] = m;
  if (role.length > ROLE_MAX) roleProblems.push(`role이 ${role.length}자 (상한 ${ROLE_MAX}) — ${name}: 근거는 소스 헤더 주석으로`);
  if (/\*\*|«|»|`/.test(role)) roleProblems.push(`role에 마크다운·기호 — ${name}: 평문으로 렌더된다`);
}

//  props도 같은 병을 앓았다 — 배열에 **산문이 prop인 척** 들어가 있었다(「A층 — 데이터·콜백 유무」·
//  「키 조작」·「상세를 담는 표면」…). 박물관이 배지 달린 prop처럼 그려서 「고를 수 있는 선택지」와
//  「왜 그런가」가 한 줄에 섞였다. 21개를 소스 헤더로 옮겼고, 다시 못 들어오게 둘을 막는다:
//   · prop 이름은 **식별자**여야 한다(문장 금지). `a / b`·`x?`·`sections[].items`·`Grid.Col span`은 허용.
//   · values에 마크다운 금지 — role과 같은 이유(평문 렌더라 `**`가 글자로 찍힌다).
//  ⚠ values의 **길이는 안 막는다**: 타입 모양(`QueueItem[] = { … }`)은 길어도 「선택지」라 정당하고,
//   산문인지 타입인지는 기계가 못 가린다. 그 판정은 사람이 훑을 때 한다.
//  판별은 「식별자냐」가 아니라 **「한글이 뭉쳐 있냐」**로 한다. prop 이름은 코드 식별자라 ASCII이고
//  (`a? / b?`·`Grid.Col span`·`notice / mustRead (+onChange)`도 전부 ASCII), 산문만 한글이 이어진다.
//  식별자 규칙으로 재 봤더니 정당한 이름 13개가 걸렸다 — 자를 바꾼 이유다. `type(셀)`처럼 한 글자가
//  섞이는 건 통과시킨다(그건 값의 단위지 문장이 아니다).
const PROSE_NAME = /\s—\s|[가-힣]{2,}/;
for (const m of read('_catalog.ts').matchAll(/name:\s*'([^']+)'\s*,\s*kind:\s*'[^']*'\s*,\s*values:\s*'((?:[^'\\]|\\.)*)'/g)) {
  const [, pname, values] = m;
  if (PROSE_NAME.test(pname)) roleProblems.push(`prop 이름이 문장이다 — "${pname}": 설명은 소스 헤더 주석으로`);
  if (/\*\*|«|»/.test(values)) roleProblems.push(`values에 마크다운 — "${pname}": 평문으로 렌더된다`);
}

const problems = [...roleProblems];

// 1. 카탈로그가 없는 부품을 가리킨다
for (const name of catalog) {
  if (!exported.has(name)) problems.push(`카탈로그에 '${name}'이 있는데 index.ts가 수출하지 않는다 (문서가 없는 부품을 가리킨다)`);
}

// 2. Mobile* 부품에 라이브 예시가 없다
for (const name of catalog) {
  if (name.startsWith('Mobile') && !demos.has(name)) {
    problems.push(`'${name}'에 _mobileDemos 예시가 없다 (박물관에서 실물을 못 본다 — 링크 한 줄로 돌아가는 길이다)`);
  }
}

// 2b. 데스크탑 부품에 박물관 예시가 없다 — 카탈로그에만 올리고 `_registry`를 안 채우면
//  박물관이 「예시 준비 중」만 띄운다. 부품을 낸 사람은 냈다고 생각하는데 보는 쪽은 못 본다.
//  ⚠ 경고로만 둔다(실패 아님) — 예전부터 빈 자리가 있어 실패로 만들면 배포가 막힌다.
const registry = read('_registry.tsx');
const demoBody = registry.slice(registry.indexOf('const D: Record<string, ReactNode> = {'));
const deskDemos = new Set([...demoBody.matchAll(/^ {4}([A-Za-z][\w]*):\s/gm)].map((m) => m[1]));
const noDemo = catalog.filter((n) => !n.startsWith('Mobile') && !deskDemos.has(n));

// 3. 카탈로그 중복
const seen = new Set();
for (const name of catalog) {
  if (seen.has(name)) problems.push(`카탈로그에 '${name}'이 두 번 있다`);
  seen.add(name);
}

// ── 결과 ──
const mobileParts = catalog.filter((n) => n.startsWith('Mobile'));
console.log(`[drift] 카탈로그 ${catalog.length}건 (데스크탑 ${catalog.length - mobileParts.length} · 모바일 ${mobileParts.length})`);
console.log(`[drift] index.ts 값 수출 ${exported.size}건 · 모바일 라이브 예시 ${demos.size}건 · 데스크탑 박물관 예시 ${deskDemos.size}건`);
if (noDemo.length) {
  console.warn(`[drift] ⚠ 박물관 예시 없음 ${noDemo.length}건 — ${noDemo.join(' · ')} (박물관에 「예시 준비 중」만 뜬다)`);
}

if (problems.length) {
  console.error(`\n[drift] 불일치 ${problems.length}건:`);
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}
console.log('[drift] 불일치 없음');
