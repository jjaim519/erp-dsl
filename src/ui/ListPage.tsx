'use client';
// ListPage (템플릿) — ERP 목록 페이지 골격. 헤더 행(카드 밖) + 테이블 elevated 카드("위젯 하나").
// 도메인 0줄. 도메인은 schema(columns)·rows·actions로만(헌법 1번).
// 관습:
//  · 헤더는 제목만(보조 desc 없음). 보조정보가 맥락을 주는 상세(DetailPage)와 대비 — 목록=제목만 / 상세=제목+보조.
//  · Pagination은 목록의 표준 구성요소(자리는 규격이 보장). 단 실제 표시는 totalPages 데이터가 결정한다
//    (렌더러가 데이터 없이 멋대로 만들지 않음 — 헌법/철학). filterable 슬롯과 같은 논리.
import { Stack } from './Stack';
import { Page } from './Page';
import { Card } from './Card';
import { PageHeader } from './PageHeader';
import { SegmentedControl } from './SegmentedControl';
import { DataTable, type DataTableColumn, type DataTableRow, type DataTableSort } from './DataTable';
import type { Action } from './_cells';
import type { IconName } from './Icon';

type ToolbarSchema = {
  // 유형 토글(B2C/B2B 등). SegmentedControl로 렌더, controlled — 실제 필터링은 페이지(밖). sort와 동형.
  segment?: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void };
};

type ListPageSchema = {
  title: string;
  description?: string;
  primaryAction?: Action;            // 맨 오른쪽, 예: + 신규 등록
  secondaryActions?: Action[];       // 가운데, 예: Export (선택)
  filterable?: boolean;              // 헤더에 필터 버튼 자리만 (동작은 보류 — rule of three)
  toolbar?: ToolbarSchema;           // 헤더와 표 사이(유형 세그먼트). 임의 JSX 금지 — 닫힌 스키마.
  columns: DataTableColumn[];
  emptyState?: { icon?: IconName; title: string; description?: string };
};

type Props = {
  schema: ListPageSchema;
  rows: DataTableRow[];
  status?: 'loading' | 'empty' | 'ready';
  sort?: DataTableSort;
  onSortChange?: (s: DataTableSort) => void;
  page?: number;
  onPageChange?: (p: number) => void;
  totalPages?: number;
  totalCount?: number;               // "총 N건" 푸터(데이터가 결정 — 표시는 number 있을 때만)
  onRowClick?: (row: DataTableRow) => void;
  onFilterClick?: () => void;        // filterable일 때 필터 버튼 동작(없으면 자리만)
};

export function ListPage({
  schema, rows, status = 'ready', sort, onSortChange, page, onPageChange, totalPages, totalCount, onRowClick, onFilterClick,
}: Props) {
  // 헤더 우측 액션: [필터(좌)] → [secondary…] → [primary(우)]
  const headerActions: Action[] = [
    ...(schema.filterable
      ? [{ label: '필터', variant: 'secondary' as const, icon: 'filter' as const, onClick: onFilterClick ?? (() => {}) }]
      : []),
    ...(schema.secondaryActions ?? []),
    ...(schema.primaryAction ? [schema.primaryAction] : []),
  ];

  const segment = schema.toolbar?.segment;

  return (
    <Page>
      <Stack gap="lg">
        <PageHeader
          title={schema.title}
          meta={schema.description ? [{ kind: 'text', label: schema.description }] : undefined}
          actions={headerActions.length > 0 ? headerActions : undefined}
        />
        {/* 툴바(헤더↔표 사이) — 유형 세그먼트. 닫힌 스키마, controlled. */}
        {segment && (
          <SegmentedControl options={segment.options} value={segment.value} onChange={segment.onChange} size="sm" />
        )}
        {/* 테이블 = elevated 카드 한 겹("columns 위젯 하나"). 한 구획=한 그림자. */}
        <Card variant="elevated" padding="none">
          <DataTable
            columns={schema.columns}
            rows={rows}
            status={status}
            sort={sort}
            onSortChange={onSortChange}
            page={page}
            onPageChange={onPageChange}
            totalPages={totalPages}
            totalCount={totalCount}
            onRowClick={onRowClick}
            emptyState={schema.emptyState}
          />
        </Card>
      </Stack>
    </Page>
  );
}
