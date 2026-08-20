// 정체 검사 — 「이 부품이 «무엇»인가」를 세 자로 잰다. (`check-layer-drift`가 «어느 층인가»를 재는 것과 짝)
//
//  왜 필요한가: 2026-08-20에 오너가 트리 맨 위 `Anchor`에서 걸렸다 — *"이게 대체 무슨 부품이냐"*.
//  파 보니 결함이 셋이었고 **셋 다 «Anchor 하나»의 문제가 아닐 수 있는 종류**였다:
//   ① 이름이 **구현**에서 왔다 — `<a>` = anchor element. 역할 이름이 아니다(Text·Title·Money와 대조).
//   ② 계약이 실전을 못 탄다 — `href`뿐이라 SPA에서 전체 문서 재로드. 쓰면 앱이 느려지니 안 쓴다.
//   ③ 실사용이 **dev 도구뿐**이었다 — 부품 안에서 쓰는 곳이 `_cells`의 `link` 셀 한 자리.
//
//  그래서 같은 자를 145개에 댄다. **이건 판정이 아니라 후보 추출기다** — 숫자가 이상한 행을
//  사람이 열어 보는 순서를 정할 뿐이고, 셋 다 «반드시 결함»은 아니다(아래 주의).
//
//  재는 것:
//   A. `mantine`   — 이름이 @mantine/core 컴포넌트와 **같은가**(이름을 물려받았을 자리).
//                    ⚠ 같다고 결함이 아니다 — Button·Text·Title은 Mantine도 쓰는 «역할» 이름이다.
//                    가려야 할 것은 «역할 뜻이 없는 기술 용어»(Anchor·Combobox 류)이고 그건 사람이 본다.
//   B. `부품안`     — 다른 **부품**(src/ui/*.tsx, `_` 제외)이 이 부품을 조립에 쓰는 횟수.
//   C. `앱`        — dev 앱(src/app)이 쓰는 횟수.
//                    B=0 이고 C>0 이면 **「부품 안에선 아무도 안 쓰고 dev 도구만 쓴다」** — Anchor의 자리.
//                    B=0 이고 C=0 이면 **「박물관 데모에만 존재한다」** — 더 센 신호.
//   D. `이동?`     — 이동을 표현하는데(`href`/`onNavigate`/`to`) **라우팅 통로가 있나**.
//                    Anchor ②의 일반화. 없으면 SPA 소비처가 못 쓴다.
//
//  ⚠ **셋 다 «부재 증명»이 아니다.** 실사용 0은 「소비처에 그 화면이 아직 없다」일 수도 있다
//    (kk 빈도 조사에서 이미 확인한 비대칭 — 빈도로 «추가»는 정당화되지만 «삭제»는 안 된다).
//    이 스크립트는 **어느 행을 먼저 열어 볼지**만 정한다.
//
//  dev 전용. 게이트 아님(prepublishOnly 제외).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ui = join(root, 'src', 'ui');
const app = join(root, 'src', 'app');
const read = (p) => readFileSync(p, 'utf8');

// ── 카탈로그 이름·prop ────────────────────────────────────────────────────────
const catalogSrc = read(join(ui, '_catalog.ts'));
const entries = [];
const HEAD = /\{\s*name:\s*'([^']+)'\s*,\s*layer:\s*'([^']+)'\s*,/g;
for (let m; (m = HEAD.exec(catalogSrc)); ) {
  let depth = 0, i = m.index;
  for (; i < catalogSrc.length; i++) {
    const c = catalogSrc[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  const src = catalogSrc.slice(m.index, i);
  entries.push({ name: m[1], layer: m[2], src });
}

// ── Mantine 컴포넌트 이름 집합 ────────────────────────────────────────────────
const mantineDir = join(root, 'node_modules', '@mantine', 'core', 'esm', 'components');
const MANTINE = new Set(existsSync(mantineDir) ? readdirSync(mantineDir) : []);

// ── 파일 수집 ─────────────────────────────────────────────────────────────────
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? walk(join(dir, d.name)) : (/\.tsx?$/.test(d.name) ? [join(dir, d.name)] : []));

//  «다른 부품»: src/ui의 공개 부품 파일만(`_` 접두 = dev·공유 모듈이라 제외).
const partFiles = readdirSync(ui).filter((f) => /\.tsx$/.test(f) && !f.startsWith('_'));
const appFiles = existsSync(app) ? walk(app) : [];

const partSrc = new Map(partFiles.map((f) => [f.replace(/\.tsx$/, ''), read(join(ui, f))]));
const appSrcs = appFiles.map((f) => read(f));

const countTag = (text, name) => (text.match(new RegExp(`<${name}(?=[\\s/>])`, 'g')) ?? []).length;

for (const e of entries) {
  const base = e.name.split('.')[0];
  //  자기 파일은 뺀다(자기가 자기를 쓰는 건 조립이 아니다).
  e.byParts = [...partSrc.entries()].reduce((n, [k, t]) => n + (k === base ? 0 : countTag(t, base)), 0);
  e.byApp = appSrcs.reduce((n, t) => n + countTag(t, base), 0);
  e.mantine = MANTINE.has(base);
  //  이동 축 — 이동을 표현하는 prop이 있는데 라우팅 통로(onNavigate/onClick/onSelect)가 없나.
  const props = [...e.src.matchAll(/\{\s*name:\s*'([^']+)'/g)].map((m) => m[1]).join(' ');
  e.hasHref = /\bhref\b|\bto\b/.test(props);
  e.hasRoute = /onNavigate|onClick|onSelect|onRowClick/.test(props);
}

// ── 출력 ─────────────────────────────────────────────────────────────────────
const row = (e, extra = '') =>
  `    ${e.name.padEnd(24)} ${e.layer.padEnd(8)} 부품안 ${String(e.byParts).padStart(3)} · 앱 ${String(e.byApp).padStart(3)}${extra}`;

//  ⚠ **사다리 위치에 따라 자가 다르다.** 위젯·템플릿은 꼭대기라 «다른 부품이 안 쓰는 게 정상»이고
//   (위에 아무것도 없다), 아래층은 «위로 소비되라고» 있는 것이라 안 쓰이면 이상하다.
//   초판은 둘을 같은 자로 재서 56건을 뱉었는데 그중 위젯 5·템플릿 9는 정상이었다.
const LOWER = new Set(['의미 원자', '레이아웃 원자', '배치 프리미티브', '분자']);
const lower = entries.filter((e) => LOWER.has(e.layer));
const upper = entries.filter((e) => !LOWER.has(e.layer));

const unusedLower = lower.filter((e) => e.byParts === 0);
const unusedUpper = upper.filter((e) => e.byApp === 0);
const devOnly = entries.filter((e) => e.byParts === 0 && e.byApp > 0);
const navGap = entries.filter((e) => e.hasHref && !e.hasRoute);

console.log(`\n부품 ${entries.length}개 — 「무엇인가」를 세 자로\n`);

console.log(`C-1. **아래층인데 조립에 안 쓰인다** — ${unusedLower.length}/${lower.length}건`);
console.log('   아래층은 「위로 소비되라고」 있는 재료다. 아무도 안 쓰면 재료가 아니라 창고에 있는 것.');
unusedLower.forEach((e) => console.log(row(e)));

console.log(`\nC-1b. 위층인데 **앱에서도 안 쓰인다**(데모에만 존재) — ${unusedUpper.length}/${upper.length}건`);
console.log('   위층은 다른 부품이 안 쓰는 게 정상이라 「앱이 쓰나」만 본다.');
unusedUpper.forEach((e) => console.log(row(e)));

console.log(`\nC-2. 부품 안 0 인데 dev 앱만 쓴다 — ${devOnly.length}건  ← Anchor가 있던 자리`);
devOnly.forEach((e) => console.log(row(e)));

console.log(`\nD. 이동을 표현하는데 라우팅 통로가 없다 — ${navGap.length}건`);
navGap.forEach((e) => console.log(row(e)));

console.log(`\nA. 이름이 Mantine 컴포넌트와 같다 — ${entries.filter((e) => e.mantine).length}건`);
console.log('   (같다고 결함이 아니다. 「역할 뜻이 없는 기술 용어」만 사람이 가린다.)');
console.log('   ' + entries.filter((e) => e.mantine).map((e) => e.name).join(' · '));

console.log('\n층별 «부품 안 사용 0» 분포 — 조립에 안 쓰이는 것이 어느 층에 몰리나');
for (const l of ['의미 원자', '레이아웃 원자', '배치 프리미티브', '분자', '유기체', '위젯', '템플릿']) {
  const g = entries.filter((e) => e.layer === l);
  if (!g.length) continue;
  const z = g.filter((e) => e.byParts === 0).length;
  console.log(`    ${l.padEnd(8)} ${String(g.length).padStart(3)}개 중 ${String(z).padStart(3)}개`);
}
console.log();
