// 층 드리프트 검사 — `_catalog.layer`(선언) ↔ 코드가 실제로 가진 성질(실측)을 기계로 대조한다.
//
//  왜 필요한가: `layer` 필드가 «판정 결과»가 아니라 «그때 뭐라고 부르기로 했나»의 기록이 되어 있다.
//  실제로 자기 `role` 문장이 스스로를 «위젯»이라 부르는데 `layer`는 '유기체'인 항목이 넷 있다
//  (OptionSetEditor·OptionSetComposer·OptionSetPicker·NotificationPanel). 145개를 손으로 훑기 전에
//  기계가 후보 목록을 먼저 뽑아, 사람이 «판정»만 하게 한다.
//
//  판정 기준은 새로 만들지 않는다 — 「05. 레이아웃과 위젯」 §2-2가 이미 위젯의 규율을 적어 뒀다:
//    ① raised 표면을 자기가 소유한다 (surface-raised + elevation, 바닥 sunken 위에 뜬다)
//    ② 내용이 넘치면 «자기 안에서» 처리한다 (페이지를 밀지 않는다 — Tile은 overflow:hidden)
//    ③ 빈 상태를 자기가 그린다
//  이 스크립트는 그 셋의 «흔적»을 코드에서 찾을 뿐이고, 흔적이 곧 판정은 아니다(아래 주의).
//
//  ⚠ 이건 그물이 아니라 «후보 추출기»다. 신호는 근사치이므로 출력은 전부 사람이 읽고 판정한다.
//     - raised: CSS 변수(--surface-raised/--elevation-raised) 또는 <Card variant="elevated">
//     - overflow: overflow(-x/-y): auto|scroll|hidden
//     - empty: EmptyState 조립 또는 emptyState prop
//     신호가 CSS 파일에 있으면 그 파일은 tsx의 `import './x.css'`로 찾는다.
//
//  검사하는 것:
//    A. role이 스스로를 '위젯'이라 부르는데 layer가 '위젯'이 아니다        (자기모순 — 확실한 드리프트)
//    B. layer='위젯'인데 ①raised 흔적이 없다                              (선언만 위젯)
//    C. layer가 유기체/템플릿인데 ①②③을 다 갖고 있다                     (위젯 승격 후보)
//    D. 층 역전 — 아래층 부품의 composition이 위층 부품을 담고 있다
//    E. 카탈로그 prop 목록 ↔ 실제 Props 타입 대조 (파싱 가능한 것만)
//
//  dev 전용. publish 대상 아님.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ui = join(root, 'src', 'ui');
const read = (p) => readFileSync(p, 'utf8');
const readIf = (p) => (existsSync(p) ? read(p) : '');

// ── _catalog에서 항목을 통째로 뜯는다(name·layer·role·props·composition) ──────────────
//  중괄호 균형으로 항목 하나의 소스를 잘라낸다 — 정규식만으론 중첩 객체를 못 센다.
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
  entries.push({ name: m[1], layer: m[2], src: catalogSrc.slice(m.index, i) });
}

const LAYER_ORDER = ['의미 원자', '레이아웃 원자', '배치 프리미티브', '분자', '유기체', '위젯', '템플릿'];
const rank = (l) => LAYER_ORDER.indexOf(l);
const byName = new Map(entries.map((e) => [e.name, e]));

for (const e of entries) {
  e.role = (e.src.match(/role:\s*'((?:[^'\\]|\\.)*)'/) ?? [, ''])[1];
  e.props = [...e.src.matchAll(/\{\s*name:\s*'([^']+)'\s*,\s*kind:/g)].map((m) => m[1]);
  const comp = e.src.match(/composition:\s*\{([\s\S]*)$/);
  e.comp = comp
    ? [...comp[1].matchAll(/'?([\w가-힣 ]+)'?\s*:\s*\[([^\]]*)\]/g)].map(([, k, v]) => ({
        layer: k.trim(),
        items: [...v.matchAll(/'([^']+)'/g)].map((x) => x[1]),
      }))
    : [];
}

// ── 부품 파일 + 그 파일이 import하는 CSS를 합쳐 한 덩이로 본다 ────────────────────────
function sourceOf(name) {
  const tsx = readIf(join(ui, `${name}.tsx`));
  if (!tsx) return null;
  const css = [...tsx.matchAll(/import\s+'\.\/([\w.-]+\.css)'/g)]
    .map((m) => readIf(join(ui, m[1])))
    .join('\n');
  return { tsx, all: `${tsx}\n${css}` };
}

const SIGNAL = {
  raised: (s) => /--surface-raised|--elevation-raised|variant="elevated"/.test(s.all),
  overflow: (s) => /overflow(-[xy])?\s*:\s*(auto|scroll|hidden)|overflowY?:\s*'(auto|scroll|hidden)'/.test(s.all),
  empty: (s) => /EmptyState|emptyState/.test(s.all),
};

const problems = { A: [], B: [], C: [], D: [], E: [], missing: [] };

for (const e of entries) {
  const s = sourceOf(e.name);
  if (!s) { problems.missing.push(e.name); continue; }
  e.sig = { raised: SIGNAL.raised(s), overflow: SIGNAL.overflow(s), empty: SIGNAL.empty(s) };
  //  raised는 «표면 소유»의 근사치일 뿐이라 오탐이 난다 — 실제로 NoteThread는 썸네일 위 20px ✕ 버튼
  //  하나에 쓰고 있었다(자기 role은 「자기 표면 없음」이라고 못박아 뒀다). 그래서 걸린 줄을 같이 낸다:
  //  사람이 «부품의 면인가, 안쪽 부속인가»를 한눈에 가르게.
  e.raisedAt = (s.all.split('\n').find((l) => /--surface-raised|--elevation-raised|variant="elevated"/.test(l)) ?? '').trim().slice(0, 90);

  // A. role이 스스로를 '위젯'이라 부르는데 layer가 아니다.
  //   첫 «절»(첫 — 또는 . 이전)만 본다 — 뒤 문장의 '위젯'은 대개 «내가 담는 것»을 가리키는 남 얘기다
  //   (Page·Container·Bento가 그렇게 걸렸다).
  const head = e.role.split(/[—.]/)[0];
  if (/위젯/.test(head) && e.layer !== '위젯') problems.A.push(e);

  // B. layer='위젯'인데 raised 흔적이 없다
  if (e.layer === '위젯' && !e.sig.raised) problems.B.push(e);

  // C. 유기체·템플릿인데 세 규율을 다 갖췄다 → 위젯 승격 후보
  if ((e.layer === '유기체' || e.layer === '템플릿') && e.sig.raised && e.sig.overflow && e.sig.empty)
    problems.C.push(e);

  // D. 층 역전 — 자기보다 위층을 조립요소로 담고 있다
  for (const c of e.comp) {
    for (const item of c.items) {
      const base = item.replace(/\..*$/, '');
      const child = byName.get(base);
      if (child && rank(child.layer) > rank(e.layer) && rank(e.layer) >= 0)
        problems.D.push({ ...e, detail: `${item}(${child.layer})` });
    }
  }

  // E. 카탈로그 prop 목록 ↔ 실제 Props 타입 대조 (`type XxxProps = {…}` 를 찾을 수 있을 때만)
  const pt = s.tsx.match(new RegExp(`type\\s+\\w*Props\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  if (pt) {
    //  한 줄에 여러 prop을 적는 표기(`value: X; onChange: Y;`)가 흔해 줄머리만 보면 뒤엣것을 놓친다.
    //  중첩 객체 타입은 먼저 걷어내고(안쪽 필드가 prop으로 새지 않게) 구분자 뒤 식별자를 전부 뽑는다.
    let flat = pt[1];
    for (let i = 0; i < 6; i++) flat = flat.replace(/\{[^{}]*\}/g, ' ');
    const actual = new Set([...flat.matchAll(/(?:^|[;,{])\s*(\w+)\??\s*:/gm)].map((m) => m[1]));
    //  카탈로그 prop 이름은 «value / onChange»처럼 짝을 한 칸에 적거나 «A층 — 데이터·콜백 유무»처럼
    //  구획 머리로도 쓰인다(표기 관습). 식별자만 뽑아 펴야 실제 불일치가 드러난다.
    const declared = new Set(
      e.props.flatMap((p) => p.split(/[/·,]/)).map((p) => p.trim().replace(/\?$/, ''))
        .filter((p) => /^[A-Za-z_]\w*$/.test(p)),
    );
    const onlyCatalog = [...declared].filter((p) => !actual.has(p));
    const onlyCode = [...actual].filter((p) => !declared.has(p) && p !== 'children');
    if (onlyCatalog.length || onlyCode.length)
      problems.E.push({ ...e, onlyCatalog, onlyCode });
  }
}

// ── 출력 ────────────────────────────────────────────────────────────────────────
const sig = (e) => `${e.sig.raised ? '면' : '·'}${e.sig.overflow ? '넘' : '·'}${e.sig.empty ? '빈' : '·'}`;
const line = (e, extra = '') => `    ${sig(e)}  ${e.name.padEnd(24)} ${e.layer.padEnd(8)} ${extra}`;

console.log(`\n부품 ${entries.length}개 · 신호 표기 [면=raised표면 / 넘=자체overflow / 빈=빈상태]\n`);

console.log(`A. role이 스스로를 «위젯»이라 부르는데 layer가 아니다 — ${problems.A.length}건 (자기모순)`);
problems.A.forEach((e) => console.log(line(e)));

console.log(`\nB. layer='위젯'인데 raised 표면 흔적이 없다 — ${problems.B.length}건`);
problems.B.forEach((e) => console.log(line(e)));

console.log(`\nC. 유기체·템플릿인데 05 §2-2 세 규율을 다 갖췄다 — ${problems.C.length}건 (승격 후보)`);
problems.C.forEach((e) => console.log(line(e)));

console.log(`\nD. 층 역전(아래층이 위층을 조립) — ${problems.D.length}건`);
problems.D.forEach((e) => console.log(line(e, `← ${e.detail}`)));

console.log(`\nE. 카탈로그 prop ↔ 실제 Props 불일치 — ${problems.E.length}건 (파싱 성공분만)`);
problems.E.forEach((e) =>
  console.log(
    `    ${e.name.padEnd(24)} ${e.onlyCatalog.length ? `문서만:[${e.onlyCatalog.join(' ')}] ` : ''}${
      e.onlyCode.length ? `코드만:[${e.onlyCode.join(' ')}]` : ''
    }`,
  ),
);

const BELOW = ['의미 원자', '레이아웃 원자', '배치 프리미티브', '분자'];
const surfaced = entries.filter((e) => e.sig && BELOW.includes(e.layer) && e.sig.raised);
console.log(`\nF. 아래층인데 raised 표면을 갖는다 — ${surfaced.length}건 (표면은 위젯의 것)`);
surfaced.forEach((e) => console.log(`${line(e)}\n            ↳ ${e.raisedAt}`));

console.log(`\n· 파일을 못 찾은 항목 ${problems.missing.length}: ${problems.missing.join(' ') || '없음'}`);

// ── 층별 신호 분포 (판정의 분모) ────────────────────────────────────────────────
console.log('\n층별 신호 분포 (면/넘/빈 을 가진 부품 수)');
for (const l of LAYER_ORDER) {
  const g = entries.filter((e) => e.layer === l && e.sig);
  if (!g.length) continue;
  const n = (k) => g.filter((e) => e.sig[k]).length;
  console.log(`    ${l.padEnd(8)} ${String(g.length).padStart(3)}개   면 ${n('raised')} · 넘 ${n('overflow')} · 빈 ${n('empty')}`);
}
console.log();
