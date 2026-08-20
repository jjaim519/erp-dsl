'use client';
// 데스크탑 무대 — 박물관 상세(`/dev/part/[name]`)가 부품을 보여주는 자리.
//  캔버스(`/shell/part/[name]`)를 iframe으로 임베드한다. **왜 iframe인가는 캔버스 파일 헤더에 있다**
//  (요지: Mantine이 CSS 변수를 `:root[data-…-scheme]`에 써서 같은 문서 안엔 «다크 섬»을 못 만든다).
//
//  무대가 소유하는 축 넷 — 전부 «보이지 않으면 판정이 안 서는» 것들이다:
//   ① 보기   데모 ↔ 매트릭스(축의 곱). 매트릭스가 없는 부품엔 세그먼트를 안 낸다(미조립).
//   ② 모드   라이트 ↔ 다크 ↔ **병치**. `theme.ts`의 semantic이 모드 분기가 일어나는 유일한 층인데,
//            전환으로만 보면 두 값을 나란히 못 댄다 — 토큰 판정은 병치라야 선다.
//   ③ 폭     iframe 폭 = **진짜 뷰포트**라 브라우저를 안 줄여도 `@container` 강등이 걸린다.
//            768은 AppShell 하한(`APPSHELL_MIN_WIDTH`)이라 그 아래는 안 연다 — 무너지는 게 정상인 자리다.
//   ④ 탐침   측정 HUD on/off.
//   ⑤ 바탕   흰 면(기본) ↔ 페이지 바닥. 부품 대부분은 카드 안(흰 면)에 살고, 위젯만 바닥 위에 뜬다.
//   ⑥ 높이   자동(내용) ↔ 480 ↔ 720. 고정 배치로 뜨는 것(모달·시트)만 손으로 키운다.
//
//  폰트 스케일은 **좌측 트리의 토글이 주인**이다. iframe은 별도 문서라 부모의 `:root`가 상속되지 않으므로
//  여기서 관찰해 `?fs=`로 실어 보낸다(`_MobileStage`가 쓰던 수법 그대로 — 두 무대가 같은 자를 쓴다).
//
//  raw 레이아웃은 dev 앱 소유(`/dev/preview`·`_MobileStage` 선례 — 헌법의 src/ui 구역 밖).
//  dev 전용(배포 제외).
import { useEffect, useRef, useState } from 'react';
import { Group, SegmentedControl, Anchor, Text } from '@/ui';
import { hasMatrix } from './_matrix';

// 자기 높이를 «뷰포트»에서 가져오는 부품 — 캔버스가 자기 높이를 못 말하므로(순환) 무대가 준다.
const FULL_HEIGHT = new Set(['AppShell']);

//  높이 — 기본은 «자동»(내용이 정한다. 작은 원자가 빈 판에 뜨지 않게).
//   열리는 것(드롭다운·팝오버·달력)은 캔버스가 삽입을 관찰해 **자동으로 따라 커진다.**
//   고정 배치로 뜨는 것(모달·드로어·시트)은 `scrollHeight`를 안 늘려서 자동이 못 잡는다 —
//   그때만 손으로 키운다. 부품 목록을 또 두는 대신 토글 하나로 여는 이유: 목록은 언젠가 틀리고,
//   무대를 조작하는 건 사람이다.
const HEIGHTS = [
  { value: 'auto', label: '자동' },
  { value: '480', label: '480' },
  { value: '720', label: '720' },
];

const WIDTHS = [
  { value: 'min', label: '768', px: 768 },      // AppShell 하한 — 그 아래는 가로 스크롤로 무너지는 게 계약
  { value: 'base', label: '1120', px: 1120 },   // 기본 — page-max 1200 안쪽
  { value: 'full', label: '최대', px: 0 },       // 0 = 무대 폭 전부
];

type Pane = 'light' | 'dark';

export function Stage({ name }: { name: string }) {
  const [view, setView] = useState('demo');
  const [mode, setMode] = useState('light');
  const [width, setWidth] = useState('base');
  const [probe, setProbe] = useState('on');
  const [bg, setBg] = useState('surface');   // 기본 = 흰 면(부품 대부분이 사는 자리)
  const [hMode, setHMode] = useState('auto');
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [nonce, setNonce] = useState(0);   // 「상태 초기화」 — 데모 내부 상태를 버리고 새로 마운트

  // 폰트 스케일 승계 — 좌측 토글이 `:root`에 거는 것을 관찰해 쿼리로 실어 보낸다.
  const [fs, setFs] = useState('default');
  useEffect(() => {
    const read = () => setFs(document.documentElement.dataset.fontScale ?? 'default');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-font-scale'] });
    return () => mo.disconnect();
  }, []);

  // 캔버스가 보고하는 높이를 받는다. iframe은 자기 내용 높이를 밖에 안 알려주므로 이 길뿐이고,
  //  안 받으면 무대가 임의 높이로 자르는데 그건 화면에서 «부품이 잘린 것»과 구분이 안 된다.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; name?: string; h?: number };
      if (d?.type !== 'erp-stage-height' || typeof d.h !== 'number') return;
      const [key, h] = [String(d.name), d.h];
      setHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const panes: Pane[] = mode === 'both' ? ['light', 'dark'] : [mode as Pane];
  const w = WIDTHS.find((x) => x.value === width)!;
  //  높이는 캔버스가 보고한 «내용 높이» 그대로다. 바닥값(옛 240)은 링크 하나짜리 원자를
  //   빈 판에 띄우던 원인이라 걷었다 — 첫 보고 전 한 프레임만 96으로 버틴다.
  const height = hMode !== 'auto' ? Number(hMode)
    : FULL_HEIGHT.has(name) ? 720
    : (heights[name] ?? 96);

  const src = (scheme: Pane) =>
    `/shell/part/${encodeURIComponent(name)}?scheme=${scheme}&fs=${fs}&view=${view}`
    + `&probe=${probe === 'on' ? 1 : 0}${bg === 'floor' ? '&bg=floor' : ''}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* 컨트롤 스트립 — 격자 밖, 높이는 내용(02 §화면 해부도의 그 자리와 같은 성격) */}
      <Group gap="md" align="center" wrap>
        {hasMatrix(name) && (
          <SegmentedControl size="sm" value={view} onChange={setView}
            options={[{ label: '데모', value: 'demo' }, { label: '매트릭스', value: 'matrix' }]} />
        )}
        <SegmentedControl size="sm" value={mode} onChange={setMode}
          options={[{ label: '라이트', value: 'light' }, { label: '다크', value: 'dark' }, { label: '병치', value: 'both' }]} />
        <SegmentedControl size="sm" value={width} onChange={setWidth}
          options={WIDTHS.map((x) => ({ label: x.label, value: x.value }))} />
        <SegmentedControl size="sm" value={hMode} onChange={setHMode} options={HEIGHTS} />
        <SegmentedControl size="sm" value={bg} onChange={setBg}
          options={[{ label: '흰 면', value: 'surface' }, { label: '바닥', value: 'floor' }]} />
        <SegmentedControl size="sm" value={probe} onChange={setProbe}
          options={[{ label: '탐침', value: 'on' }, { label: '끔', value: 'off' }]} />
        <Anchor href={src('light')} external>캔버스만 열기</Anchor>
        <button type="button" onClick={() => setNonce((n) => n + 1)}
          style={{
            font: 'inherit', fontSize: 13, padding: '4px 10px', cursor: 'pointer',
            background: 'none', color: 'var(--text-secondary)',
            border: 'var(--border-width) solid var(--border-default)',
            borderRadius: 'var(--mantine-radius-sm)',
          }}>
          상태 초기화
        </button>
      </Group>

      {/* 무대 — 병치일 땐 두 캔버스가 나란히. 폭이 넘치면 이 줄만 가로로 스크롤한다(페이지는 안 밀린다). */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', alignItems: 'flex-start' }}>
        {panes.map((scheme) => (
          <div key={scheme} style={{ flex: w.px ? 'none' : 1, minWidth: 0 }}>
            {mode === 'both' && (
              <Text variant="caption" color="secondary">{scheme === 'light' ? '라이트' : '다크'}</Text>
            )}
            <iframe
              /* 모드·스케일·보기가 바뀌면 재마운트 — 캔버스는 쿼리를 마운트 때 한 번 읽는다 */
              key={`${name}-${scheme}-${fs}-${view}-${nonce}`}
              src={src(scheme)}
              title={`${name} 캔버스 (${scheme})`}
              style={{
                width: w.px || '100%',
                height,
                border: 'var(--border-width) solid var(--border-default)',
                borderRadius: 'var(--mantine-radius-xs)',
                display: 'block',
                background: 'var(--bg-tertiary)',
              }}
            />
          </div>
        ))}
      </div>

      {/* 화면 문구는 «조작법»만 남긴다. 왜 iframe인지·폭 토글이 왜 진짜 뷰포트인지는 이 파일 헤더에 있다 —
          도구 설명을 상시 노출하면 그것도 어휘처럼 읽히고, 정작 봐야 할 부품에서 눈을 뺏는다. */}
      <Text variant="caption" color="secondary">탐침: 마우스가 지난 요소를 잰다 · Option+클릭 = 고정</Text>
    </div>
  );
}
