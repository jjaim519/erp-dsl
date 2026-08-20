'use client';
// MobileShell 프리뷰 — 모바일 셸 거동(Navigation·본문 스크롤·하단 탭·safe-area)을
//  브라우저를 줄이지 않고 본다. 핵심: iframe은 *자체 뷰포트*라 그 안의 미디어쿼리·useMediaQuery가
//  iframe 폭을 기준으로 평가된다 → /shell을 폰 폭으로 띄우면 데스크탑 화면에서도 진짜 모바일로 렌더된다.
import { useState } from 'react';
import { Container, Stack, Group, Title, Text, SegmentedControl, Anchor } from '@/ui';

const DEVICES: Record<string, { label: string; w: number; h: number }> = {
  se:  { label: 'iPhone SE',         w: 375, h: 667 },
  std: { label: 'iPhone 14',         w: 390, h: 844 },
  max: { label: 'iPhone 14 Pro Max', w: 430, h: 932 },
};

// 띄울 화면 — 모바일 어휘로 짠 것 하나.
//  ※ 「기존 ListPage 투입(반례)」는 걷어냈다(v0.94.0). 「데스크탑 템플릿은 폭만 좁혀선 성립하지
//    않는다」는 결론이 이미 06에 확정돼 있어 반례를 상시 전시할 이유가 없다 — 결론이 선 뒤의
//    반례는 «증명»이 아니라 «옛 시도의 잔해»고, 박물관에 두면 그것도 어휘처럼 읽힌다.
const SCREENS: Record<string, { label: string; src: string }> = {
  native: { label: '모바일 어휘', src: '/shell/m' },
};

export default function MobileShellPreview() {
  const [dev, setDev] = useState('std');
  const [scr, setScr] = useState('native');
  const d = DEVICES[dev];
  const s = SCREENS[scr];

  return (
    <Container maxWidth="wide">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title variant="heading">MobileShell 프리뷰</Title>
          <Text variant="body" color="secondary">
iframe(자체 뷰포트)에 <code>/shell/m</code>을 폰 크기로 띄운다 — 브라우저를 줄이지 않고 실제 폰 높이에서
            셸 거동(Navigation 뒤로+제목 · 본문만 스크롤 · 하단 탭)을 본다. MobileShell은 AppShell의 축소판이 아니라 형제다:
            면·그림자를 쓰지 않고 배경 + 가로 헤어라인으로만 나눈다.
          </Text>
          <Text variant="caption" color="secondary">
            ※ 홈 인디케이터 safe-area(env())는 실제 기기에서만 채워진다 — 프리뷰에선 0. 데모 화면 원본은 <Anchor href="/shell/m">/shell/m</Anchor>.
          </Text>
        </Stack>

        {/* 화면 선택 — 모바일 어휘 vs 데스크탑 템플릿 반례. */}
        <SegmentedControl
          options={Object.entries(SCREENS).map(([v, x]) => ({ value: v, label: x.label }))}
          value={scr}
          onChange={setScr}
          size="sm"
        />

        {/* 기기 폭 프리셋 — 좁은(SE)·표준·큰 폰에서 하단 탭 분배·프로필 거동 비교. */}
        <SegmentedControl
          options={Object.entries(DEVICES).map(([v, x]) => ({ value: v, label: `${x.label} · ${x.w}×${x.h}` }))}
          value={dev}
          onChange={setDev}
          size="sm"
        />

        {/* 폰 베젤 + iframe. 높이 고정이라 셸이 그 안에서 100dvh를 채우고 하단 탭이 바닥에 붙는다. */}
        <Group justify="center">
          <div
            style={{
              width: d.w,
              height: d.h,
              border: '10px solid var(--text-primary)',
              // eslint-disable-next-line no-restricted-syntax -- 폰 프레임 베젤 곡률(디바이스 목업), DSL UI radius 아님(스케일 밖 명시 예외)
              borderRadius: 44,
              overflow: 'hidden',
              boxShadow: 'var(--mantine-shadow-xl)',
              background: 'var(--bg-primary)',
            }}
          >
            <iframe
              key={`${scr}-${d.w}x${d.h}`}   /* 기기·화면 바꾸면 iframe 재마운트 → 새 폭으로 재평가 */
              src={s.src}
              title={`MobileShell — ${s.label}`}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>
        </Group>
      </Stack>
    </Container>
  );
}
