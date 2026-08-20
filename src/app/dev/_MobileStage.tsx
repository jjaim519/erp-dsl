'use client';
// 모바일 스테이지 — 박물관 상세(/dev/part/[name])가 Mobile* 부품을 보여주는 자리.
//  데스크탑 부품은 <Demo>로 페이지 안에 그대로 렌더되지만 모바일은 그럴 수 없어(뷰포트·문서 잠금·셸 스코프)
//  캔버스(/shell/m/part/[name])를 iframe으로 임베드한다 — /dev/preview 가 2티어에 쓰는 것과 같은 수법.
//  raw 레이아웃은 dev 앱 소유(헌법의 src/ui 구역 밖 — /dev/preview 선례).
import { useEffect, useRef, useState } from 'react';
import { Group, Text, SegmentedControl, Anchor } from '@/ui';

// 기기 폭 — 하한(SE)·표준·상한(Max). 하한이 중요하다: 좁은 폭에서 먼저 깨진다.
const DEVICES = [
  { value: 'se', label: 'SE 375', w: 375, h: 667 },
  { value: 'std', label: '표준 390', w: 390, h: 844 },
  { value: 'max', label: 'Max 430', w: 430, h: 932 },
];

export function MobileStage({ name }: { name: string }) {
  const [dev, setDev] = useState('std');
  // 박물관 좌측의 폰트 스케일 토글은 부모 문서의 :root에 걸린다. iframe은 별도 문서라 안 따라오므로
  //  여기서 그 변화를 관찰해 캔버스 URL(?fs=)에 실어 보낸다 → 토글 하나가 폰 안에서도 그대로 작동한다.
  const [fs, setFs] = useState('default');
  useEffect(() => {
    const read = () => setFs(document.documentElement.dataset.fontScale ?? 'default');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-font-scale'] });
    return () => mo.disconnect();
  }, []);

  const d = DEVICES.find((x) => x.value === dev)!;
  const src = `/shell/m/part/${encodeURIComponent(name)}?fs=${fs}`;
  const frameRef = useRef<HTMLIFrameElement>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Group gap="sm" align="center" wrap>
        <SegmentedControl size="sm" value={dev} onChange={setDev}
          options={DEVICES.map((x) => ({ label: x.label, value: x.value }))} />
        <Anchor href={src} external>캔버스만 열기</Anchor>
        <button type="button"
          onClick={() => { if (frameRef.current) frameRef.current.src = src; }}
          style={{
            font: 'inherit', fontSize: 13, padding: '4px 10px', cursor: 'pointer',
            background: 'none', color: 'var(--text-secondary)',
            border: 'var(--border-width) solid var(--border-default)',
            borderRadius: 'var(--mantine-radius-sm)',
          }}>
          상태 초기화
        </button>
      </Group>

      {/* 폰 베젤 + iframe. 높이 고정이라 셸이 그 안에서 100dvh를 채우고 하단 탭이 바닥에 붙는다.
          베젤 구성은 /shell/mobile 과 같은 값을 쓴다 — 같은 물건이 두 곳에서 다르게 보이면 안 된다. */}
      <div
        style={{
          width: d.w,
          height: d.h,
          flex: 'none',
          border: '10px solid var(--text-primary)',
          // eslint-disable-next-line no-restricted-syntax -- 폰 프레임 베젤 곡률(디바이스 목업), DSL UI radius 아님(스케일 밖 명시 예외)
          borderRadius: 44,
          overflow: 'hidden',
          boxShadow: 'var(--mantine-shadow-xl)',
          background: 'var(--bg-primary)',
        }}
      >
        <iframe
          ref={frameRef}
          /* 기기·스케일이 바뀌면 재마운트해 새 폭/스케일로 다시 평가시킨다 */
          key={`${name}-${d.w}x${d.h}-${fs}`}
          src={src}
          title={`${name} 모바일 캔버스`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>

      <Text variant="caption" color="secondary">
        iframe(자체 뷰포트)에 <code>{src}</code> 를 띄운다 — 브라우저를 줄이지 않고 진짜 폰 폭에서 본다.
        좌측 <b>폰트 스케일</b> 토글이 이 안에도 적용된다.
      </Text>
    </div>
  );
}
