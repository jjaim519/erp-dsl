'use client';
// 반응형 프리뷰 갤러리 — AppShell + 페이지를 3티어(데스크탑/태블릿/폰) iframe으로 본다.
//  · 왜 iframe인가: 셸은 @container가 아니라 뷰포트 useMediaQuery로 분기한다. 한 화면 안 폭만 다른 div는
//    전부 바깥 뷰포트로 평가돼 소용없다. iframe은 자체 뷰포트라 각 폭에서 미디어쿼리가 정확히 발화한다.
//  · 비교 모드: 3티어 나란히(스케일 다운, 클릭 유지) — 한눈에 대조.
//  · 집중 모드: 한 티어 1:1 + 우측 드래그 핸들로 폭 실시간 변경 → 브레이크포인트 경계를 눈으로 튜닝.
//  · 브레이크포인트: 폰 <768 · 태블릿 768–1279 · 데스크탑 ≥1280. 1280 경계 = iPad 가로(≤Pro11 1194)를
//    태블릿 레일에 담기 위함(결정 2). 값은 AppShell과 동기 — 여기 readout이 그 경계를 눈으로 튜닝하는 자.
//  · dev 전용(배포 제외). raw 레이아웃은 dev 앱 소유(헌법의 src/ui 구역 밖).
import { useRef, useState } from 'react';
import { Title, Text, Stack, Group, Select, SegmentedControl, Badge } from '@/ui';

const PAGES = [
  { value: 'home', label: '대시보드 (조립 샘플)' },
  { value: 'LedgerPage', label: '정산 (LedgerPage)' },
  { value: 'HierarchyExplorer', label: '계층 탐색 (HierarchyExplorer)' },
  { value: 'CalendarPage', label: '캘린더 (CalendarPage)' },
  { value: 'BoardList', label: '게시판 목록 (BoardList)' },
  { value: 'BoardView', label: '게시글 (BoardView)' },
  { value: 'BoardWrite', label: '게시판 작성 (BoardWrite)' },
];

// 비교 모드 3티어 — 각 경계를 대표하는 폭. target = 표시 폭(스케일 다운 기준).
const COMPARE = [
  { key: 'desktop', label: '데스크탑', w: 1440, h: 900, target: 460 },
  { key: 'tablet', label: '태블릿 (가로)', w: 1024, h: 768, target: 330 },
  { key: 'phone', label: '폰', w: 390, h: 844, target: 200 },
];

// 집중 모드 프리셋 — 티어 선택 시 폭·높이 기본값. 폭은 이후 드래그로 조정.
const TIER: Record<string, { w: number; h: number }> = { desktop: { w: 1440, h: 900 }, tablet: { w: 1024, h: 768 }, phone: { w: 390, h: 844 } };
const TABLET_ORIENT: Record<string, { w: number; h: number }> = { landscape: { w: 1024, h: 768 }, portrait: { w: 834, h: 1194 } };
const PHONE_PRESET: Record<string, { w: number; h: number }> = { se: { w: 375, h: 667 }, std: { w: 390, h: 844 }, max: { w: 430, h: 932 } };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
function tierOf(w: number): { label: string; color: 'neutral' | 'info' | 'success' } {
  if (w < 768) return { label: '폰', color: 'neutral' };
  if (w < 1280) return { label: '태블릿', color: 'info' };
  return { label: '데스크탑', color: 'success' };
}

export default function PreviewGallery() {
  const [page, setPage] = useState('home');
  const [mode, setMode] = useState('compare');

  // 집중 모드 상태
  const [tier, setTier] = useState('desktop');
  const [orient, setOrient] = useState('landscape');
  const [preset, setPreset] = useState('std');
  const [w, setW] = useState(TIER.desktop.w);
  const [h, setH] = useState(TIER.desktop.h);
  const drag = useRef<{ x: number; w: number } | null>(null);

  const src = (extra?: string) => `/shell/frame?page=${page}${extra ?? ''}`;

  const applyTier = (t: string) => {
    setTier(t);
    const base = t === 'tablet' ? TABLET_ORIENT[orient] : t === 'phone' ? PHONE_PRESET[preset] : TIER[t];
    setW(base.w); setH(base.h);
  };
  const applyOrient = (o: string) => { setOrient(o); setW(TABLET_ORIENT[o].w); setH(TABLET_ORIENT[o].h); };
  const applyPreset = (p: string) => { setPreset(p); setW(PHONE_PRESET[p].w); setH(PHONE_PRESET[p].h); };

  const t = tierOf(w);

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Title variant="heading">반응형 프리뷰</Title>
        <Text variant="body" color="secondary">
          AppShell + 페이지를 iframe(자체 뷰포트)으로 띄워 3티어를 진짜 폭에서 본다. 브레이크포인트: 폰 &lt;768 · 태블릿 768–1279 · 데스크탑 ≥1280.
        </Text>
      </Stack>

      {/* 컨트롤 바 */}
      <Group gap="lg" align="end" wrap>
        <div style={{ minWidth: 280 }}>
          <Text variant="caption" color="secondary">페이지</Text>
          <Select options={PAGES} value={page} onChange={(v) => setPage(v ?? 'home')} size="sm" />
        </div>
        <div>
          <Text variant="caption" color="secondary">모드</Text>
          <SegmentedControl size="sm" value={mode} onChange={setMode}
            options={[{ label: '비교', value: 'compare' }, { label: '집중', value: 'focus' }]} />
        </div>
      </Group>

      {mode === 'compare' ? (
        <Group gap="xl" align="start" wrap>
          {COMPARE.map((c) => {
            const scale = Math.min(c.target / c.w, 600 / c.h);
            return (
              <Stack key={c.key} gap="xs" align="start">
                <Group gap="xs" align="center">
                  <Text variant="body-strong">{c.label}</Text>
                  <Text variant="caption" color="secondary">{c.w} × {c.h}</Text>
                </Group>
                <div style={{
                  width: c.w * scale, height: c.h * scale, overflow: 'hidden',
                  border: '1px solid var(--border-strong)', borderRadius: 'var(--mantine-radius-md)',
                  background: 'var(--bg-primary)', boxShadow: 'var(--mantine-shadow-sm)',
                }}>
                  <iframe
                    key={`${c.key}-${page}`}
                    src={src()}
                    title={c.label}
                    style={{ width: c.w, height: c.h, border: 'none', display: 'block', transform: `scale(${scale})`, transformOrigin: 'top left' }}
                  />
                </div>
              </Stack>
            );
          })}
        </Group>
      ) : (
        <Stack gap="md">
          <Group gap="lg" align="end" wrap>
            <div>
              <Text variant="caption" color="secondary">티어</Text>
              <SegmentedControl size="sm" value={tier} onChange={applyTier}
                options={[{ label: '데스크탑', value: 'desktop' }, { label: '태블릿', value: 'tablet' }, { label: '폰', value: 'phone' }]} />
            </div>
            {tier === 'tablet' && (
              <div>
                <Text variant="caption" color="secondary">방향</Text>
                <SegmentedControl size="sm" value={orient} onChange={applyOrient}
                  options={[{ label: '가로', value: 'landscape' }, { label: '세로', value: 'portrait' }]} />
              </div>
            )}
            {tier === 'phone' && (
              <div>
                <Text variant="caption" color="secondary">기기</Text>
                <SegmentedControl size="sm" value={preset} onChange={applyPreset}
                  options={[{ label: 'SE', value: 'se' }, { label: '14', value: 'std' }, { label: 'Max', value: 'max' }]} />
              </div>
            )}
            <Group gap="xs" align="center">
              <Badge color={t.color}>{t.label}</Badge>
              <Text variant="body-strong">{Math.round(w)} × {h}px</Text>
              <Text variant="caption" color="secondary">← 우측 핸들을 끌어 폭 조정 (경계 768 / 1280)</Text>
            </Group>
          </Group>

          {/* 1:1 프레임 + 우측 드래그 핸들. 가로 넘치면 이 래퍼가 스크롤. */}
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ display: 'flex', width: 'max-content' }}>
              <div style={{
                width: w, height: h, overflow: 'hidden',
                border: '1px solid var(--border-strong)', borderRadius: 'var(--mantine-radius-md)',
                background: 'var(--bg-primary)', boxShadow: 'var(--mantine-shadow-sm)',
              }}>
                <iframe
                  key={`focus-${page}-${h}`}
                  src={src()}
                  title="집중 프리뷰"
                  style={{ width: w, height: h, border: 'none', display: 'block' }}
                />
              </div>
              {/* 드래그 핸들 — pointer capture로 프레임 밖까지 추적. 폭만 조정(높이는 프리셋). */}
              <div
                onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, w }; }}
                onPointerMove={(e) => { if (drag.current) setW(clamp(drag.current.w + (e.clientX - drag.current.x), 320, 1920)); }}
                onPointerUp={() => { drag.current = null; }}
                title="폭 조정"
                style={{
                  width: 12, height: h, cursor: 'ew-resize', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-secondary)', borderRadius: 'var(--mantine-radius-sm)',
                  marginLeft: 4, touchAction: 'none',
                }}
              >
                <div style={{ width: 2, height: 28, borderRadius: 'var(--mantine-radius-full)', background: 'var(--border-strong)' }} />
              </div>
            </div>
          </div>
        </Stack>
      )}
    </Stack>
  );
}
