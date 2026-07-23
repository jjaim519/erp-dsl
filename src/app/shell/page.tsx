'use client';
// AppShell 도그푸드 데모 — 셸(최외곽 프레임)을 단독으로 본다.
//  · 로고 형태 전환기: 텍스트가 아닌 실제 이미지 로고(가로/세로/정사각/원형)가 슬롯에 들어갔을 때의 거동 검증용.
//    슬롯 규칙(appshell.css): 로고 박스에 종횡비대로 최대 적합 — 형태별로 폭/높이가 박스를 채우고 절대 찌그러지지 않음.
import { useState } from 'react';
import { AppShell, PageHeader, Card, Title, Text, Stack, SegmentedControl, Anchor, NotificationPanel } from '@/ui';

// 실제 로고를 흉내낸 data-URI SVG — intrinsic 크기를 크게 잡아 "최대로 박았을 때" 슬롯이 어떻게 캡하는지 본다.
const svg = (w: number, h: number, inner: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`);

const TXT = (s: string, size: number) =>
  `<text x="50%" y="50%" dy=".35em" fill="#fff" font-family="sans-serif" font-weight="700" font-size="${size}" text-anchor="middle">${s}</text>`;

const LOGOS: Record<string, { src: string; intrinsic: string }> = {
  wide:   { src: svg(240, 60, `<rect width="240" height="60" rx="10" fill="#3b5ba5"/>${TXT('ACME ERP', 24)}`), intrinsic: '240×60 · 가로 4:1' },
  tall:   { src: svg(64, 160, `<rect width="64" height="160" rx="12" fill="#3b5ba5"/>${TXT('A', 30)}`), intrinsic: '64×160 · 세로 1:2.5' },
  square: { src: svg(120, 120, `<rect width="120" height="120" rx="18" fill="#3b5ba5"/>${TXT('A', 56)}`), intrinsic: '120×120 · 정사각' },
  circle: { src: svg(120, 120, `<circle cx="60" cy="60" r="58" fill="#3b5ba5"/>${TXT('A', 56)}`), intrinsic: '120×120 · 원형' },
};

const SHAPE_OPTS = [
  { label: '텍스트', value: 'text' },
  { label: '가로형', value: 'wide' },
  { label: '세로형', value: 'tall' },
  { label: '정사각', value: 'square' },
  { label: '원형', value: 'circle' },
];

export default function ShellDemo() {
  const [active, setActive] = useState('/orders');
  const [shape, setShape] = useState('wide');

  const logo =
    shape === 'text'
      ? <Title variant="heading">kk ERP</Title>
      : <img src={LOGOS[shape].src} alt="로고" />;

  return (
    <AppShell
      logo={logo}
      onLogoClick={() => setActive('/')}
      activePath={active}
      onNavigate={setActive}
      menuItems={[
        { label: '대시보드', icon: 'dashboard', path: '/', group: '개요' },
        { label: '발주', icon: 'upload', path: '/orders', group: '거래', count: 3 },
        { label: '제품', icon: 'package', path: '/products', group: '거래' },
        { label: '거래처', icon: 'building', path: '/partners', group: '거래' },
        { label: '재고', icon: 'warehouse', path: '/stock', group: '관리' },
        { label: '정산', icon: 'wallet', path: '/billing', group: '관리' },
        { label: '설정', icon: 'settings', path: '/settings', group: '관리' },
      ]}
      profile={{
        name: '김병준', role: '관리자', email: 'bj.kim@kk.co.kr',
        menu: [
          { label: '내 프로필', icon: 'user', onClick: () => {} },
          { label: '설정', icon: 'settings', onClick: () => {} },
          { label: '로그아웃', icon: 'logout', variant: 'danger', onClick: () => {} },
        ],
      }}
      notification={{ hasUnread: true, content: (
        <NotificationPanel
          items={[
            { id: '1', tone: 'success', title: '발주 #1024 승인 요청이 도착했습니다', actor: '이수연', time: '5분 전', group: '오늘' },
            { id: '2', tone: 'warning', title: '경첩 35mm 재고가 안전재고 이하로 떨어졌습니다', actor: '시스템', time: '22분 전', group: '오늘' },
            { id: '3', tone: 'info', title: '6월 정산 마감이 내일입니다', actor: '시스템', time: '1시간 전', group: '오늘' },
            { id: '4', tone: 'danger', title: '발주 #1019가 반려되었습니다', actor: '박준호', time: '어제', read: true, group: '이번 주' },
          ]}
          onMarkAllRead={() => {}}
          onViewAll={() => {}}
        />
      ) }}
    >
      <Stack gap="lg">
        <PageHeader title="AppShell 데모" meta={[{ kind: 'text', label: `활성 경로: ${active}` }]} />
        <Card variant="outlined" padding="lg">
          <Stack gap="sm">
            <Text variant="body-strong">로고 형태 전환 — 좌상단 로고 슬롯이 어떻게 잡는지 본다</Text>
            <SegmentedControl options={SHAPE_OPTS} value={shape} onChange={setShape} size="sm" />
            <Text variant="caption" color="secondary">
              {shape === 'text' ? '텍스트 로고(글자 크기는 호출측이 정함 — 슬롯 높이 영향 없음)' : `원본 ${LOGOS[shape].intrinsic} → 로고 박스(56px)를 종횡비대로 최대 채움(찌그러짐 없음).`}
            </Text>
          </Stack>
        </Card>
        <Card variant="outlined" padding="lg">
          <Stack gap="xs">
            <Text variant="body">사이드바(로고·메뉴·프로필) + 콘텐츠. 모바일 폭에선 하단 탭바로 재구성. AppShell은 ‘발주’가 뭔지 모른다.</Text>
            <Text variant="caption" color="secondary">모바일 거동은 브라우저를 줄이거나 → <Anchor href="/shell/mobile">/shell/mobile</Anchor> 폰 프리뷰에서 본다.</Text>
          </Stack>
        </Card>
      </Stack>
    </AppShell>
  );
}
