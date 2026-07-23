'use client';
// 고객 탭 공통 셸 — AppShell이 목록/상세를 감싼다. (AppShell은 "고객"을 모름 — 메뉴·로고 주입)
import { useRouter, usePathname } from 'next/navigation';
import { AppShell, Title, NotificationPanel } from '@/ui';

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname.startsWith('/customers') ? '/customers' : pathname;

  return (
    <AppShell
      logo={<Title variant="heading">kk ERP</Title>}
      onLogoClick={() => router.push('/')}
      activePath={active}
      onNavigate={(p) => router.push(p)}
      menuItems={[
        { label: '대시보드', icon: 'dots', path: '/', group: '개요' },
        { label: '고객 관리', icon: 'search', path: '/customers', group: '거래' },
        { label: '제품', icon: 'upload', path: '/products', group: '거래' },
        { label: '설정', icon: 'refresh', path: '/settings', group: '관리' },
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
            { id: '3', tone: 'danger', title: '발주 #1019가 반려되었습니다', actor: '박준호', time: '어제', read: true, group: '이번 주' },
          ]}
          onMarkAllRead={() => {}}
          onViewAll={() => {}}
        />
      ) }}
    >
      {children}
    </AppShell>
  );
}
