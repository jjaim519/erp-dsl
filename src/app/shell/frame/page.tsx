'use client';
// iframe 타깃 — AppShell + 선택된 페이지를 한 뷰포트(=iframe)에 렌더한다.
//  · /dev/preview 갤러리가 이 라우트를 폭 다른 iframe들로 띄운다. iframe은 자체 뷰포트라
//    셸의 useMediaQuery·미디어쿼리가 각 iframe 폭 기준으로 평가된다 → 3티어를 진짜로 본다.
//  · /shell 아래에 둔다(= /dev 박물관 레이아웃 미상속) → root(Providers)만 상속해 셸 단독으로 뜬다.
//    (/dev 아래에 두면 박물관 좌측 트리 nav가 겹쳐 iframe 안에 nav가 중복됨.)
//  · ?page= 로 셸 안에 넣을 페이지를 고른다. 실제 풀페이지 템플릿은 _registry의 <Demo/>를 재사용
//    (새 목업 안 만듦 — 단일 출처). page 미지정/미매칭이면 'home'(경량 조립 샘플).
//  · 도메인 무지: 셸·부품은 무엇을 렌더하는지 모른다. 여기 샘플 데이터는 dev 앱 소유(라이브러리 아님).
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AppShell, PageHeader, Card, Title, Text, Stack, Grid, SummaryCard, DescriptionList,
} from '@/ui';
import { Demo } from '@/ui/_dev';

// 셸 샘플 배선 — 도메인-제네릭 ERP 명사(특정 프로덕트 아님). 8항목 → 모바일 하단탭 '더보기' 오버플로도 검증.
const MENU = [
  { label: '대시보드', icon: 'dashboard', path: '/', group: '개요' },
  { label: '주문', icon: 'upload', path: '/orders', group: '거래', count: 3 },
  { label: '제품', icon: 'package', path: '/products', group: '거래' },
  { label: '거래처', icon: 'building', path: '/partners', group: '거래' },
  { label: '재고', icon: 'warehouse', path: '/stock', group: '관리' },
  { label: '정산', icon: 'wallet', path: '/billing', group: '관리' },
  { label: '리포트', icon: 'chart-bar', path: '/reports', group: '관리' },
  { label: '설정', icon: 'settings', path: '/settings', group: '관리' },
] as const;

// 경량 조립 샘플 — PageHeader + KPI 그리드(4) + 정보 카드 그리드(2). 티어별 밀도·리플로우를 한눈에.
function HomePage() {
  return (
    <Stack gap="lg">
      <PageHeader title="대시보드" description="이번 달 개요" />
      <Grid columns={4} gap="md">
        <Grid.Col span={1}><SummaryCard label="신규 주문" icon="upload" tone="info" count={128} /></Grid.Col>
        <Grid.Col span={1}><SummaryCard label="승인 대기" icon="clock" tone="warning" count={12} /></Grid.Col>
        <Grid.Col span={1}><SummaryCard label="이번 달 매출" icon="wallet" tone="success" amount={48200000} /></Grid.Col>
        <Grid.Col span={1}><SummaryCard label="지연 건" icon="ban" tone="danger" count={3} /></Grid.Col>
      </Grid>
      <Grid columns={2} gap="lg">
        <Grid.Col span={1}>
          <Card variant="outlined" padding="lg">
            <Stack gap="sm">
              <Title variant="subheading">최근 거래처</Title>
              <DescriptionList
                columns={1}
                items={[
                  { label: '대명물산', value: '주문 4건', type: 'text' },
                  { label: '한빛산업', value: '주문 2건', type: 'text' },
                  { label: '세종테크', value: '견적 대기', type: 'badge', badgeColors: { '견적 대기': 'warning' } },
                ]}
              />
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={1}>
          <Card variant="outlined" padding="lg">
            <Stack gap="sm">
              <Title variant="subheading">공지</Title>
              <Text variant="body" color="secondary">
                2컬럼 그리드가 좁은 뷰포트에서 어떻게 눌리는지 보는 자리 — 페이지 구성(리플로우) 작업의 대상.
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

// _registry Demo로 렌더할 실제 풀페이지 템플릿(page picker 옵션과 일치).
const DEMO_PAGES = new Set(['LedgerPage', 'HierarchyExplorer', 'CalendarPage', 'BoardList', 'BoardView', 'BoardWrite']);

function FrameInner() {
  const sp = useSearchParams();
  const page = sp.get('page') ?? 'home';
  const active = sp.get('active') ?? '/';

  const body = DEMO_PAGES.has(page) ? <Demo name={page} /> : <HomePage />;

  return (
    <AppShell
      logo={<Title variant="heading">ERP</Title>}
      activePath={active}
      onNavigate={() => {}}
      menuItems={MENU.map((m) => ({ ...m }))}
      profile={{
        name: '김병준', role: '관리자', email: 'user@example.com',
        menu: [
          { label: '내 프로필', icon: 'user', onClick: () => {} },
          { label: '설정', icon: 'settings', onClick: () => {} },
          { label: '로그아웃', icon: 'logout', variant: 'danger', onClick: () => {} },
        ],
      }}
      notification={{ hasUnread: true, onClick: () => {} }}
    >
      {body}
    </AppShell>
  );
}

export default function FramePage() {
  return (
    <Suspense fallback={null}>
      <FrameInner />
    </Suspense>
  );
}
