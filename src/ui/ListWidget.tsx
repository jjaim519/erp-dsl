'use client';
// ListWidget (위젯) — 목록을 raised 표면 하나에 담는 위젯. ListPage를 대체.
//  · 엔진 흡수: @tanstack/react-table(헤드리스)를 이 파일에 격리(헌법 7 — TipTap이 Editor/RichText에 갇힌 것과 동형).
//    정렬·전역검색·faceted 필터·페이징·행선택 = TanStack 로직. 렌더링·색·간격 = 전부 우리 토큰·셀 어휘(무테).
//  · 소비처는 TanStack을 안 본다 — 닫힌 스키마(columns·search·selectable…)만 준다. 도메인=데이터(헌법 1).
//  · 툴바(검색·필터)를 위젯 표면 *안*에 소유 → 바닥 blend 0(파편 SearchToolbar/segment 통합).
//  · 정렬(align): 타입에서 자동 도출(기본, "쉬운 길=옳은 길") + 컬럼별 닫힌 override. header·body가 한 값 공유.
//  · [MVP] core·sorting·globalFilter·columnFilter(facet)·pagination·rowSelection. 상태는 내부(ephemeral) — controlled 승격은 다음.
//    다음 티어: grouping+집계·expanding·컬럼 표시/핀. 나중: 가상화·리사이즈·저장뷰.
import { useMemo, useState } from 'react';
import { Table, Group as MGroup, Center } from '@mantine/core';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  getPaginationRowModel, getFacetedRowModel, getFacetedUniqueValues,
  type ColumnDef, type SortingState, type ColumnFiltersState,
  type RowSelectionState, type PaginationState, type FilterFn,
} from '@tanstack/react-table';
import { renderCell, renderAction, cellAlign, alignToFlex, HEAD_CELL, CELL_CLIP, type CellType, type BadgeColor, type Action } from './_cells';
import { Text } from './Text';
import { Title } from './Title';
import { Icon, type IconName } from './Icon';
import { TextInput } from './TextInput';
import { Select } from './Select';
import { Chip } from './Chip';
import { Checkbox } from './Checkbox';
import { Divider } from './Divider';
import { Pagination } from './Pagination';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

type Align = 'left' | 'center' | 'right';
export type ListColumn = {
  key: string;
  label: string;
  type: CellType;
  align?: Align;                          // override. 없으면 타입에서 자동(아래 autoAlign)
  sortable?: boolean;
  filter?: 'facet';                       // 데이터에서 옵션 자동 도출(단일 선택). primitive 열만.
  grow?: boolean;                         // 남은 폭 채움(길면 … 말줄임)
  maxWidth?: number | string;
  badgeColors?: Record<string, BadgeColor>;
};
export type ListRow = Record<string, unknown> & { id: string | number };

type Props = {
  columns: ListColumn[];
  data: ListRow[];
  title?: string;                         // 위젯 헤더(선택)
  primaryAction?: Action;
  search?: { fields?: string[]; placeholder?: string };
  selectable?: boolean;
  bulkActions?: Action[];
  pageSize?: number;                      // 기본 25
  onRowClick?: (row: ListRow) => void;
  emptyState?: { icon?: IconName; title: string; description?: string };
  status?: 'loading' | 'ready';
};

// 정렬·헤더밴드·클립은 _cells 단일 출처(DataTable과 공유 — 드리프트 차단). override(col.align)가 타입 자동(cellAlign)을 이김.
const PAD = 'var(--mantine-spacing-md)';
// 헤더 행 안정 밴드 — 이 행은 "컬럼 라벨 ↔ 벌크 바"로 전환(가변)하므로 높이를 *예약*한다.
// 두 상태가 같은 높이라 선택 토글에 표가 안 흔들림(reflow 0). sm 버튼(~30)이 편히 들어가는 40.
const HEADER_ROW_H = 40;

export function ListWidget({
  columns, data, title, primaryAction, search, selectable, bulkActions,
  pageSize = 25, onRowClick, emptyState, status = 'ready',
}: Props) {
  const colByKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  // 전역 검색: search.fields 지정 시 그 필드만(없으면 text 열 전체). TanStack globalFilter로 연결.
  const globalFilterFn: FilterFn<ListRow> = useMemo(() => (row, _colId, value) => {
    const q = String(value ?? '').toLowerCase().trim();
    if (!q) return true;
    const fields = search?.fields ?? columns.filter((c) => c.type === 'text').map((c) => c.key);
    return fields.some((f) => String((row.original as ListRow)[f] ?? '').toLowerCase().includes(q));
  }, [search, columns]);

  const columnDefs = useMemo<ColumnDef<ListRow>[]>(() => columns.map((c) => ({
    id: c.key,
    accessorKey: c.key,
    header: c.label,
    enableSorting: !!c.sortable,
    enableColumnFilter: c.filter === 'facet',
    filterFn: 'equals',
  })), [columns]);

  const table = useReactTable<ListRow>({
    data,
    columns: columnDefs,
    state: { sorting, globalFilter, columnFilters, rowSelection, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    globalFilterFn,
    enableRowSelection: !!selectable,
    getRowId: (r) => String(r.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const facetCols = columns.filter((c) => c.filter === 'facet');
  const activeFilters = table.getState().columnFilters;
  const selectedCount = table.getSelectedRowModel().rows.length;
  // 선택 활성 → 컬럼 헤더 행을 벌크 바로 전환(제자리·contained·reflow 0). 별도 바 삽입(밀어내림) 폐기.
  const bulkMode = !!selectable && !!bulkActions && bulkActions.length > 0 && selectedCount > 0;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();

  const hasGrow = columns.some((c) => c.grow);
  // grow 열: 남은 폭 흡수(길면 … 말줄임). 형제 열: grow가 있으면 nowrap로 자연폭 유지 —
  // 안 그러면 auto-layout이 형제를 min-content 이하로 짓눌러 세로 줄바꿈(담당자·날짜 구겨짐)이 난다.
  const cellStyle = (c: ListColumn): React.CSSProperties =>
    c.grow ? { width: '100%', maxWidth: 0, ...CELL_CLIP }
      : hasGrow ? { whiteSpace: 'nowrap' }
        : {};

  return (
    // 위젯 = raised 표면(surface-raised + elevation). 바닥(sunken) 위에 떠오름.
    <div style={{
      background: 'var(--surface-raised)', boxShadow: 'var(--elevation-raised)',
      borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden',
    }}>
      {/* zone1 — 위젯 헤더(선택) */}
      {(title || primaryAction) && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: PAD, padding: `var(--mantine-spacing-sm) ${PAD}` }}>
            {title && <Title variant="subheading">{title}</Title>}
            {primaryAction && <div style={{ marginLeft: 'auto' }}>{renderAction(primaryAction, 'pa', 'sm')}</div>}
          </div>
          <Divider />
        </>
      )}

      {/* zone2 — 필터 바(표면 안). 검색 + facet + 활성칩 + 건수 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mantine-spacing-sm)', flexWrap: 'wrap', padding: PAD }}>
        {search && (
          <div style={{ flex: 1, minWidth: 220 }}>
            <TextInput value={globalFilter} onChange={setGlobalFilter} placeholder={search.placeholder ?? '검색'} size="sm" />
          </div>
        )}
        {facetCols.map((c) => {
          const column = table.getColumn(c.key);
          const opts = column
            ? Array.from(column.getFacetedUniqueValues().keys())
                .filter((v) => v != null && v !== '')
                .map((v) => String(v))
                .sort()
                .map((v) => ({ label: v, value: v }))
            : [];
          const val = (column?.getFilterValue() as string | undefined) ?? null;
          return (
            <div key={c.key} style={{ minWidth: 150 }}>
              <Select options={opts} value={val} placeholder={c.label} size="sm"
                onChange={(v) => column?.setFilterValue(v ?? undefined)} />
            </div>
          );
        })}
        {activeFilters.map((f) => {
          const c = colByKey.get(f.id);
          return (
            <Chip key={f.id} color="info" selected onChange={() => table.getColumn(f.id)?.setFilterValue(undefined)}
              onRemove={() => table.getColumn(f.id)?.setFilterValue(undefined)}>
              {`${c?.label ?? f.id}: ${String(f.value)}`}
            </Chip>
          );
        })}
        <Text variant="caption" color="secondary">
          {`총 ${filteredCount.toLocaleString('ko-KR')}건${selectedCount > 0 ? ` · ${selectedCount}개 선택` : ''}`}
        </Text>
      </div>

      {/* zone3 — 표 (선택 시 헤더 행이 벌크 바로 전환) */}
      {status === 'loading' ? (
        <Center p="xl"><Spinner /></Center>
      ) : filteredCount === 0 ? (
        <EmptyState icon={emptyState?.icon} title={emptyState?.title ?? '데이터 없음'} description={emptyState?.description} />
      ) : (
        <div style={{ overflowX: 'auto', borderTop: 'var(--border-width) solid var(--border-default)' }}>
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover={!!onRowClick}>
            <Table.Thead>
              <Table.Tr>
                {selectable && (
                  <Table.Th style={{ width: 44, height: HEADER_ROW_H, verticalAlign: 'middle', ...HEAD_CELL }} onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={table.getIsAllPageRowsSelected()} onChange={() => table.toggleAllPageRowsSelected()} />
                  </Table.Th>
                )}
                {bulkMode ? (
                  // 헤더 행 라벨 → 벌크 바 오버레이(제자리, 같은 행 높이대라 reflow 0). 필터 바·건수는 위에 유지. GitHub/Linear 관용구.
                  <Table.Th colSpan={columns.length} style={{ ...HEAD_CELL, height: HEADER_ROW_H, paddingBlock: 0, verticalAlign: 'middle' }}>
                    <MGroup justify="space-between" align="center" wrap="nowrap">
                      <Text variant="body-strong">{`${selectedCount}개 선택`}</Text>
                      <MGroup gap="xs" align="center">{bulkActions!.map((a, i) => renderAction(a, i, 'sm'))}</MGroup>
                    </MGroup>
                  </Table.Th>
                ) : (
                  table.getHeaderGroups()[0].headers.map((header) => {
                    const c = colByKey.get(header.column.id)!;
                    const align = c.align ?? cellAlign(c.type);
                    const sorted = header.column.getIsSorted();
                    return (
                      <Table.Th key={header.id}
                        style={{ textAlign: align, cursor: c.sortable ? 'pointer' : 'default', verticalAlign: 'middle', height: HEADER_ROW_H, paddingBlock: 0, ...HEAD_CELL, ...cellStyle(c) }}
                        onClick={c.sortable ? header.column.getToggleSortingHandler() : undefined}>
                        <MGroup gap={4} align="center" justify={alignToFlex(align)} wrap="nowrap">
                          <Text variant="body-strong">{c.label}</Text>
                          {/* flex(center)가 이미 상자 중심을 맞춘다 — 옛 translateY 「보정 복원」은 오진이라 걷었다(2026-08-21 실측). */}
                          {c.sortable && (
                            <span style={{ display: 'inline-flex', opacity: sorted ? 1 : 0.35 }}>
                              <Icon name={sorted === 'desc' ? 'chevron-down' : 'chevron-up'} size="sm" color="secondary" />
                            </span>
                          )}
                        </MGroup>
                      </Table.Th>
                    );
                  })
                )}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id} onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                  {selectable && (
                    <Table.Td style={{ width: 44, verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={row.getIsSelected()} onChange={() => row.toggleSelected()} />
                    </Table.Td>
                  )}
                  {row.getVisibleCells().map((cell) => {
                    const c = colByKey.get(cell.column.id)!;
                    const align = c.align ?? cellAlign(c.type);
                    const content = renderCell(c.type, (row.original as ListRow)[c.key], { badgeColors: c.badgeColors });
                    return (
                      <Table.Td key={cell.id}
                        style={{ textAlign: align, verticalAlign: 'middle', ...cellStyle(c) }}
                        onClick={c.type === 'actions' || c.type === 'menu' ? (e) => e.stopPropagation() : undefined}>
                        {c.maxWidth != null ? <div style={{ ...CELL_CLIP, maxWidth: c.maxWidth }}>{content}</div> : content}
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}

      {/* zone4 — 푸터(건수 + 페이지네이션) */}
      {pageCount > 1 && (
        <>
          <Divider />
          <MGroup justify="space-between" align="center" p={PAD} wrap="nowrap">
            <Text variant="caption" color="secondary">{`총 ${filteredCount.toLocaleString('ko-KR')}건`}</Text>
            <Pagination total={pageCount} value={pagination.pageIndex + 1} onChange={(p) => table.setPageIndex(p - 1)} />
          </MGroup>
        </>
      )}
    </div>
  );
}
