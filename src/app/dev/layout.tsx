'use client';
// 박물관 dev 셸 — 좌측 분류 내비(우리 Tree, 보기 전용) + 부품 검색.
//  · 분류 = 기초(토큰·셸) / 부품(계층 ladder, 의미 원자만 표시·행동·입력군 2분할) / 데모.
//  · 각 그룹 내 부품은 알파벳 오름차순. 그룹 라벨에 카운트. 기본 펼침은 '부품'(+현재 계층)만.
//  · 검색어 입력 시 부품명으로 필터 + 매칭 그룹 자동 펼침. 단일 출처(_catalog·INPUT_ATOMS)에서 파생 → 드리프트 0.
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { CATALOG, LAYERS, INPUT_ATOMS } from '@/ui/_catalog';
import { Tree, TextInput, SegmentedControl, type TreeNodeData } from '@/ui';

const byLabel = (a: TreeNodeData, b: TreeNodeData) => a.label.localeCompare(b.label);
const partLeaves = (entries: { name: string }[]): TreeNodeData[] =>
  entries.map((e) => ({ id: `/dev/part/${e.name}`, label: e.name })).sort(byLabel); // A→Z

// 계층 ladder 순서 유지(LAYERS) · 의미 원자만 표시·행동/입력군 2분할 · 각 그룹 내 부품 A→Z · 라벨에 카운트.
const PART_NODES: TreeNodeData[] = LAYERS.flatMap((layer) => {
  const entries = CATALOG.filter((e) => e.layer === layer);
  if (layer === '의미 원자') {
    const inputs = entries.filter((e) => INPUT_ATOMS.has(e.name));
    const display = entries.filter((e) => !INPUT_ATOMS.has(e.name));
    return [
      { id: '__bucket:display', label: `의미 원자 · 표시·행동 (${display.length})`, children: partLeaves(display) },
      { id: '__bucket:input', label: `의미 원자 · 입력군 (${inputs.length})`, children: partLeaves(inputs) },
    ];
  }
  return [{ id: `__layer:${layer}`, label: `${layer} (${entries.length})`, children: partLeaves(entries) }];
});

const NODES: TreeNodeData[] = [
  { id: '__basics', label: '기초', children: [
    { id: '/dev/tokens', label: '토큰' },
    { id: '/shell', label: '셸' },
    { id: '/dev/preview', label: '반응형 프리뷰' },
  ] },
  { id: '__parts', label: `부품 (${CATALOG.length})`, children: PART_NODES },
  { id: '__demos', label: '데모', children: [
    { id: '/dev/grid', label: '위젯 그리드 시범' },
    { id: '/dev/authoring', label: '구성 모델 저작(조립 증명)' },
    { id: '/customers', label: '고객 관리' },
    { id: '/dev/import', label: '초기 등록 (엑셀)' },
    { id: '/playground', label: 'SummaryCard 편집기' },
  ] },
];

// 부품명이 속한 그룹 id (현재 위치 자동 펼침용).
function groupIdOfPart(name: string): string | null {
  const entry = CATALOG.find((e) => e.name === name);
  if (!entry) return null;
  if (entry.layer === '의미 원자') return INPUT_ATOMS.has(name) ? '__bucket:input' : '__bucket:display';
  return `__layer:${entry.layer}`;
}
function initialExpanded(path: string): string[] {
  const base = ['__parts'];
  const m = path.match(/^\/dev\/part\/(.+)$/);
  if (m) { const g = groupIdOfPart(m[1]); if (g) base.push(g); }
  return base;
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
  const [fscale, setFscale] = useState('default');
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-tertiary)' }}>
      <nav style={{ width: 248, flexShrink: 0, background: 'var(--bg-primary)', borderRight: '1px solid var(--border-default)', padding: 12, position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh', overflowY: 'auto' }}>
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
      <main style={{ flex: 1, padding: 32, minWidth: 0 }}>{children}</main>
    </div>
  );
}
