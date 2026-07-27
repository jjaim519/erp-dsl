'use client';
// 진단용 화면 — *기존 데스크탑 page 템플릿을 MobileShell에 그대로 넣으면 어떻게 되는지* 본다.
//  이건 권장 사용법이 아니라 **반례 전시**다. "데스크탑 템플릿은 폭만 좁혀선 성립하지 않는다"는
//  MobileShell 분리 근거를 말이 아니라 화면으로 확인하는 자리.
//  → 여기서 드러나는 불일치가 곧 모바일 page 어휘(Top·ListRow…)의 요구사항 목록이 된다.
import { useState } from 'react';
import { MobileShell, ListPage, type MobileTab, type DataTableRow } from '@/ui';
import { 고객행, 유입경로색 } from '@/app/customers/_data';

const TABS: MobileTab[] = [
  { path: '/board', label: '게시판', icon: 'clipboard' },
  { path: '/customers', label: '고객', icon: 'users' },
  { path: '/my', label: '내정보', icon: 'user' },
];

// 실제 소비처(/customers)가 쓰는 스키마 그대로 — 축소하거나 손보지 않는다(반례가 흐려지므로).
const listSchema = {
  title: '고객 관리',
  primaryAction: { label: '신규 고객', variant: 'primary' as const, icon: 'plus' as const, onClick: () => {} },
  columns: [
    { key: 'name', label: '고객명', type: 'text' as const, sortable: true },
    { key: 'phone', label: '연락처', type: 'text' as const },
    { key: 'source', label: '유입경로', type: 'badge' as const, badgeColors: 유입경로색 },
    { key: 'createdAt', label: '등록일', type: 'date' as const, sortable: true },
    { key: 'actions', label: '', type: 'actions' as const },
  ],
  filterable: true,
  emptyState: { icon: 'search' as const, title: '고객이 없습니다', description: '신규 고객을 등록해 보세요' },
};

export default function LegacyInMobileShell() {
  const [tab, setTab] = useState('/customers');
  return (
    <MobileShell tabs={TABS} activePath={tab} onNavigate={setTab}>
      <ListPage schema={listSchema} rows={고객행 as unknown as DataTableRow[]} totalCount={고객행.length} />
    </MobileShell>
  );
}
