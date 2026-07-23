'use client';
// LedgerPage (템플릿) — "돈 지표" 페이지 골격. 정산·매출·매입·미수금 등 *기간 스코프 금액 화면*의 공통 해부를 굳힌다.
//  도메인 0줄 — schema(period·metrics·breakdown·detail)로만 주입. ListPage·DetailPage 형제.
//  4단 해부:
//   ① 기간(period)   — PeriodNavigator(‹ 라벨 ›) 중앙 스트립. controlled.
//   ② KPI 밴드        — metrics[]을 Stat(추세형) / SummaryCard(건수+금액)로 자동 매핑, equalRows 그리드(균일 높이).
//   ③ 분해(breakdown) — SegmentedControl(품목별/발주별…) → DataTable → TotalRow(합계). elevated 카드 한 겹.
//   ④ 드릴(detail)    — 행 클릭 → Drawer(우측 슬라이드) 라인 상세. content=도메인 슬롯(Drawer children 계약과 동일).
//  · KPI 개수는 1~4열로 자동(초과는 다음 행). 합계·페이지네이션·빈상태는 데이터 유무로 결정(토글 prop 아님).
import type { ReactNode } from 'react';
import { Page } from './Page';
import { Stack } from './Stack';
import { Group } from './Group';
import { Card } from './Card';
import { Grid } from './Grid';
import { PageHeader, type HeaderMeta } from './PageHeader';
import { PeriodNavigator } from './PeriodNavigator';
import { SegmentedControl } from './SegmentedControl';
import { Stat } from './Stat';
import { SummaryCard } from './SummaryCard';
import { TotalRow } from './TotalRow';
import { Drawer } from './Drawer';
import { DataTable, type DataTableColumn, type DataTableRow, type DataTableSort } from './DataTable';
import type { Action, BadgeColor } from './_cells';
import type { IconName } from './Icon';

// KPI 타일 — 두 형태 닫힌 union. stat=단일 지표+추세(총액·전월대비) / summary=건수+금액(완료·대기).
export type LedgerMetric =
  | { kind: 'stat'; label: string; value: string; trend?: 'up' | 'down' | 'flat'; delta?: string; icon?: IconName }
  | { kind: 'summary'; label: string; icon?: IconName; tone?: BadgeColor; count?: number; amount?: number };

export type LedgerBreakdown = {
  tabs: { label: string; value: string }[];   // 분해 축(품목별/발주별…)
  value: string;
  onChange: (v: string) => void;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  total?: number;                              // 합계(₩) — 있으면 TotalRow
  status?: 'loading' | 'empty' | 'ready';
  emptyState?: { icon?: IconName; title: string; description?: string };
  onRowClick?: (row: DataTableRow) => void;    // 행 → 드릴(detail). 보통 detail.opened를 켠다.
  sort?: DataTableSort;
  onSortChange?: (s: DataTableSort) => void;
  page?: number;
  onPageChange?: (p: number) => void;
  totalPages?: number;
  totalCount?: number;
};

// 드릴 Drawer(controlled by 소비처). content=도메인 라인 상세 슬롯(Drawer children 계약 그대로).
export type LedgerDetail = {
  opened: boolean;
  onClose: () => void;
  title: string;
  actions?: Action[];
  size?: 'sm' | 'md' | 'lg';
  content: ReactNode;
};

type Props = {
  // PageHeader(고정 정체성 밴드)
  title: string;
  description?: string;
  status?: { label: string; tone: BadgeColor };
  actions?: Action[];
  // ① 기간
  period?: { label: string; onPrev: () => void; onNext: () => void; disabledPrev?: boolean; disabledNext?: boolean };
  // ② KPI 밴드
  metrics?: LedgerMetric[];
  // ③ 분해
  breakdown: LedgerBreakdown;
  // ④ 드릴
  detail?: LedgerDetail;
};

export function LedgerPage({ title, description, status, actions, period, metrics, breakdown, detail }: Props) {
  // KPI 열 수 — 타일 수 기준 1~4(초과는 다음 행). 12의 약수 중 안전 매핑.
  const n = metrics?.length ?? 0;
  const cols = (n >= 4 ? 4 : n === 3 ? 3 : n === 2 ? 2 : 1) as 1 | 2 | 3 | 4;

  const tile = (m: LedgerMetric, i: number) =>
    m.kind === 'stat'
      ? <Stat key={i} label={m.label} value={m.value} trend={m.trend} delta={m.delta} icon={m.icon} />
      : <SummaryCard key={i} label={m.label} icon={m.icon} tone={m.tone} count={m.count} amount={m.amount} />;

  const headerMeta: HeaderMeta[] = [];
  if (status) headerMeta.push({ kind: 'badge', label: status.label, tone: status.tone });
  if (description) headerMeta.push({ kind: 'text', label: description });

  return (
    <Page>
      <Stack gap="lg">
        <PageHeader title={title} meta={headerMeta} actions={actions} />

        {/* ① 기간 — 중앙 스트립(이 달의 정산 등 기간 진술). */}
        {period && (
          <Group justify="center" align="center">
            <PeriodNavigator label={period.label} onPrev={period.onPrev} onNext={period.onNext}
              disabledPrev={period.disabledPrev} disabledNext={period.disabledNext} />
          </Group>
        )}

        {/* ② KPI 밴드 — equalRows로 타일 높이 균일. */}
        {metrics && metrics.length > 0 && (
          <Grid columns={cols} gap="md" equalRows>
            {metrics.map(tile)}
          </Grid>
        )}

        {/* ③ 분해 — elevated 카드 한 겹: [세그먼트 헤더] / [표] / [합계]. */}
        <Card variant="elevated" padding="none">
          <div style={{ padding: 'var(--mantine-spacing-md)' }}>
            <SegmentedControl options={breakdown.tabs} value={breakdown.value} onChange={breakdown.onChange} size="sm" />
          </div>
          <DataTable
            columns={breakdown.columns}
            rows={breakdown.rows}
            status={breakdown.status}
            sort={breakdown.sort}
            onSortChange={breakdown.onSortChange}
            onRowClick={breakdown.onRowClick}
            page={breakdown.page}
            onPageChange={breakdown.onPageChange}
            totalPages={breakdown.totalPages}
            totalCount={breakdown.totalCount}
            emptyState={breakdown.emptyState}
          />
          {breakdown.total != null && (
            <div style={{ padding: 'var(--mantine-spacing-md)' }}>
              <TotalRow amount={breakdown.total} />
            </div>
          )}
        </Card>
      </Stack>

      {/* ④ 드릴 — Drawer(우측). content=도메인 라인 상세. */}
      {detail && (
        <Drawer opened={detail.opened} onClose={detail.onClose} title={detail.title}
          actions={detail.actions} size={detail.size ?? 'md'} position="right">
          {detail.content}
        </Drawer>
      )}
    </Page>
  );
}
