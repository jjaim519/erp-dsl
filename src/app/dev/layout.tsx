'use client';
// 박물관 dev 셸 — 좌측 분류 내비(우리 Tree, 보기 전용) + 부품 검색.
//  · 분류 = 기초(토큰·셸) / 부품 = **데스크탑 · 모바일 2대분류**(각각 계층 ladder) / 데모.
//  · 데스크탑↔모바일을 가르는 기준은 `Mobile*` 접두 하나다 — 그게 이미 두 계열의 경계이기 때문
//    (모바일은 면·그림자를 안 쓰고 헤어라인으로만 나눠 시각 체계가 정반대라 섞어 쓰면 안 된다).
//    수동 목록을 두지 않아 부품이 늘어도 분류가 저절로 따라온다(단일 출처 _catalog).
//  · 각 그룹 내 부품은 알파벳 오름차순. 그룹 라벨에 카운트. 기본 펼침은 '부품'(+현재 계층)만.
//  · 검색어 입력 시 부품명으로 필터 + 매칭 그룹 자동 펼침. 단일 출처(_catalog·INPUT_ATOMS)에서 파생 → 드리프트 0.
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CATALOG, LAYERS, INPUT_ATOMS } from '@/ui/_catalog';
import { MOBILE_DEMOS, MOBILE_SCREENS } from '@/ui/_mobileDemos';
import { Tree, TextInput, SegmentedControl, type TreeNodeData } from '@/ui';

const byLabel = (a: TreeNodeData, b: TreeNodeData) => a.label.localeCompare(b.label);
const partLeaves = (entries: { name: string }[]): TreeNodeData[] =>
  entries.map((e) => ({ id: `/dev/part/${e.name}`, label: e.name })).sort(byLabel); // A→Z

// 대분류 — 모바일 계열은 `Mobile*` 접두가 곧 경계다(모바일 계열 파일 헤더 규율).
const isMobile = (name: string) => name.startsWith('Mobile');
const DESKTOP = CATALOG.filter((e) => !isMobile(e.name));
const MOBILE = CATALOG.filter((e) => isMobile(e.name));

// 계층 ladder 순서 유지(LAYERS) · 의미 원자만 표시·행동/입력군 2분할 · 각 그룹 내 부품 A→Z · 라벨에 카운트.
//  대분류마다 같은 사다리를 쓰되 그룹 id에 접두를 달아 펼침 상태가 서로 안 섞이게 한다.
const partNodes = (entries: typeof CATALOG, scope: string): TreeNodeData[] =>
  LAYERS.flatMap((layer) => {
    const inLayer = entries.filter((e) => e.layer === layer);
    if (inLayer.length === 0) return [];   // 그 대분류에 없는 계층은 빈 폴더로 남기지 않는다
    if (layer === '의미 원자') {
      const inputs = inLayer.filter((e) => INPUT_ATOMS.has(e.name));
      const display = inLayer.filter((e) => !INPUT_ATOMS.has(e.name));
      return [
        ...(display.length ? [{ id: `__bucket:${scope}:display`, label: `의미 원자 · 표시·행동 (${display.length})`, children: partLeaves(display) }] : []),
        ...(inputs.length ? [{ id: `__bucket:${scope}:input`, label: `의미 원자 · 입력군 (${inputs.length})`, children: partLeaves(inputs) }] : []),
      ];
    }
    return [{ id: `__layer:${scope}:${layer}`, label: `${layer} (${inLayer.length})`, children: partLeaves(inLayer) }];
  });

// ── 최상위 세 서랍 ────────────────────────────────────────────────────────────────
//  전에는 「기초 / 데스크탑 / 모바일 / 데모」였는데, **분류축이 없어서 «부품이 아닌 것»이 전부
//  「데모」로 밀려나 있었다** — 실험대(Bento)·조립 증명(저작)·수직 슬라이스(고객)·변환 도구(엑셀)·
//  편집기 PoC가 한 서랍에 뭉쳐 성격이 안 읽혔다. 동시에 트리에 **아예 없는 라우트가 다섯**이었다.
//
//  박물관에 있는 것은 실제로 세 종류뿐이다:
//   · **어휘** — 부품과 값 그 자체.        판별: 카탈로그에 있나 / 토큰인가
//   · **증명** — 어휘로 진짜 화면이 서는가.  판별: 조립 «결과»를 보여주나
//   · **도구** — 값을 정하거나 무언가 만드는 자리. 판별: 내가 조작해서 답을 얻나
//
//  ※ 모바일 «화면»은 조립된 결과라 어휘가 아니라 **증명**이다(부품은 모바일 어휘 사다리에 남는다).
//    모바일 계열이 형제 층이라는 규율과 안 부딪힌다 — 사다리는 그대로 나란히 있고, 화면만 갈렸다.
const NODES: TreeNodeData[] = [
  { id: '__vocab', label: '어휘', children: [
    { id: '/dev/tokens', label: '토큰' },
    { id: '__parts', label: `데스크탑 (${DESKTOP.length})`, children: partNodes(DESKTOP, 'd') },
    // 모바일은 데스크탑의 축소판이 아니라 *형제 층*이라 같은 깊이에 나란히 둔다.
    { id: '__mobile', label: `모바일 (${MOBILE.length})`, children: partNodes(MOBILE, 'm') },
  ] },

  { id: '__proof', label: '증명', children: [
    { id: '__shells', label: '셸', children: [
      { id: '/shell', label: '데스크탑 셸' },
      { id: '/shell/mobile', label: '모바일 셸 (4탭)' },
    ] },
    // 조립된 모바일 화면 — 4탭 셸을 통과하지 않고 *그 화면으로 바로* 간다.
    { id: '__mscreens', label: `모바일 화면 (${MOBILE_SCREENS.length})`, children:
      MOBILE_SCREENS.map((k) => ({ id: `/shell/m/part/${k}`, label: MOBILE_DEMOS[k].label ?? k })) },
    { id: '__pages', label: '페이지', children: [
      { id: '/customers', label: '고객 관리 (스키마 구동)' },
      { id: '/dev/authoring', label: '구성 모델 저작' },
    ] },
    { id: '/dev/preview', label: '반응형 2티어' },
  ] },

  { id: '__tools', label: '도구', children: [
    { id: '/dev/grid', label: 'Bento 실험대' },
    { id: '/dev/paper', label: '문서 렌더러 검증' },
    { id: '/dev/import', label: '엑셀 가져오기' },
    { id: '/playground', label: '부품 편집기 PoC' },
  ] },
];

// 부품명이 속한 [최상위, 대분류, 그룹] id (현재 위치 자동 펼침용).
//  «어휘» 서랍이 한 칸 더 생겼으므로 그것도 함께 펼쳐야 잎이 보인다.
function groupIdsOfPart(name: string): string[] {
  const entry = CATALOG.find((e) => e.name === name);
  if (!entry) return [];
  const scope = isMobile(name) ? 'm' : 'd';
  const root = isMobile(name) ? '__mobile' : '__parts';
  if (entry.layer === '의미 원자') return ['__vocab', root, `__bucket:${scope}:${INPUT_ATOMS.has(name) ? 'input' : 'display'}`];
  return ['__vocab', root, `__layer:${scope}:${entry.layer}`];
}
function initialExpanded(path: string): string[] {
  const m = path.match(/^\/dev\/part\/(.+)$/);
  const found = m ? groupIdsOfPart(m[1]) : [];
  return found.length ? found : ['__vocab', '__parts'];   // 부품 화면이 아니면 어휘·데스크탑만 펼침
}

// 검색 필터 — 잎(부품)을 label로 매칭, 매칭 자식이 있는 폴더만 유지.
function filterNodes(nodes: TreeNodeData[], q: string): TreeNodeData[] {
  const out: TreeNodeData[] = [];
  for (const n of nodes) {
    if (n.children) {
      const kids = filterNodes(n.children, q);
      if (kids.length) out.push({ ...n, children: kids });
    } else if (n.label.toLowerCase().includes(q)) {
      out.push(n);
    }
  }
  return out;
}
function folderIds(nodes: TreeNodeData[]): string[] {
  return nodes.flatMap((n) => (n.children ? [n.id, ...folderIds(n.children)] : []));
}

export default function DevLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [expanded, setExpanded] = useState<string[]>(() => initialExpanded(path));
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  // 폰트 스케일(접근성) 검증 토글 — :root에 data-font-scale를 깔아 전역 줌(소비 앱은 <html>에 1회 설정).
  //  `?fs=large|xlarge`도 받는다 — 토글은 사람 손이 있어야 눌리는데, 스케일 검증은 캡처로 대조해야 하는
  //  일이라(06 §4-3 ②가 폰트 캡 대신 「검증 절차로 닫는다」고 못박은 그 절차) 클릭 없이도 걸려야 한다.
  //  캔버스들이 이미 같은 수법을 쓴다(`/shell/part/…?fs=`).
  const [fscale, setFscale] = useState('default');
  useEffect(() => {
    const fs = new URLSearchParams(window.location.search).get('fs');
    if (fs === 'large' || fs === 'xlarge') { setFscale(fs); document.documentElement.dataset.fontScale = fs; }
  }, []);
  const setScale = (v: string) => {
    setFscale(v);
    if (v === 'default') delete document.documentElement.dataset.fontScale;
    else document.documentElement.dataset.fontScale = v;
  };

  // 검색 중이면 필터 트리 + 매칭 폴더 전부 펼침, 아니면 수동 펼침 상태.
  const view = useMemo(() => (q ? filterNodes(NODES, q) : NODES), [q]);
  const expandedIds = q ? folderIds(view) : expanded;

  const toggle = (id: string) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  const select = (id: string) => { if (id.startsWith('/')) router.push(id); else toggle(id); };

  return (
    <div className="dev-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-tertiary)' }}>
      {/* 인쇄 — 박물관 껍데기를 걷어낸다. 안 걷으면 좌측 넷바 248px가 종이(210mm)를 지면 밖으로 밀어
          백지만 나온다. 인라인 style이라 !important로만 이긴다. /dev 어느 화면에서 인쇄해도 걸리는 문제. */}
      <style>{`@media print{
        .dev-shell{display:block !important;min-height:0 !important;background:#fff !important}
        .dev-shell-nav{display:none !important}
        .dev-shell-main{padding:0 !important;flex:none !important}
      }`}</style>
      <nav className="dev-shell-nav" style={{ width: 248, flexShrink: 0, background: 'var(--bg-primary)', borderRight: '1px solid var(--border-default)', padding: 12, position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh', overflowY: 'auto' }}>
        {/* 워드마크 — ERP-DSL. dev 셸 정체성(클릭 시 박물관 홈). */}
        <Link href="/dev" style={{ display: 'inline-block', padding: '2px 8px 14px', textDecoration: 'none' }}>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            ERP<span style={{ color: 'var(--mantine-color-primary-6)' }}>-DSL</span>
          </span>
        </Link>
        {/* 폰트 스케일(접근성) 검증 — 기존/크게/아주크게. 전역 줌(타이포·간격 비율 고정). */}
        <div style={{ marginBottom: 10 }}>
          <SegmentedControl size="sm" fullWidth value={fscale} onChange={setScale}
            options={[{ label: '기존', value: 'default' }, { label: '크게', value: 'large' }, { label: '아주크게', value: 'xlarge' }]} />
        </div>
        {/* 부품 검색 — 입력 시 부품명 필터(매칭 그룹 자동 펼침). */}
        <div style={{ marginBottom: 10 }}>
          <TextInput value={query} onChange={setQuery} placeholder="부품 검색…" size="sm" />
        </div>
        <Tree nodes={view} selectedId={path} expandedIds={expandedIds} onSelect={select} onToggle={toggle} />
      </nav>
      <main className="dev-shell-main" style={{ flex: 1, padding: 32, minWidth: 0 }}>{children}</main>
    </div>
  );
}
