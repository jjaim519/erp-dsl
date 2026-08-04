'use client';
// DataTable 유기체 — 도메인 무관 표 껍데기. columns(표현 enum)·rows(데이터) 주입, "고객" 모름.
// 정렬·페이징 상태만 들고 실제 수행은 바깥(controlled). Pagination·EmptyState 조합.
import { Table, Group as MGroup, Center } from '@mantine/core';
import { renderCell, renderAction, HEAD_CELL, cellAlign as textAlignOf, cellJustify as justifyOf, CELL_CLIP as CLIP, type CellType, type BadgeColor, type Action } from './_cells';
import { Text } from './Text';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { Divider } from './Divider';
import { Checkbox } from './Checkbox';
import type { IconName } from './Icon';

export type DataTableColumn = {
  key: string;
  label: string;
  type: CellType;
  span?: number;          // text 열 폭(없으면 균등) — 비율은 구조에서
  // 열 폭 제어(table-layout:auto 유지 — 나머지 열은 내용에 맞춤). 둘 다 도메인이 선택:
  grow?: boolean;         // 이 열이 남은 폭을 채운다(유동 열). 내용이 길면 … 말줄임(보통 이름/제목 열 1개).
  maxWidth?: number | string; // 이 열의 최대 폭(px/%/CSS) 상한. 넘으면 … 말줄임. 내용이 짧으면 그만큼만 차지(상한일 뿐 고정 아님).
  sortable?: boolean;
  badgeColors?: Record<string, BadgeColor>;
  // 이 열이 **좁은 화면의 행 기하에서 갖는 역할**. 표에는 영향이 없다(DataTable은 이 값을 안 읽는다).
  //  왜 여기 사는가: 표용 컬럼과 카드용 매핑을 따로 받으면 소비처가 매핑을 두 번 쓰고,
  //  둘이 어긋나는 사고(강조가 카드에만 걸리는 류)가 계약 차원에서 반복된다.
  //  컬럼을 **한 번** 선언하고 역할을 닫힌 enum으로 붙이면 두 표현이 한 벌에서 파생돼 어긋날 수 없다
  //  (06 §3-4 · Polaris `s-table`의 그 방식).
  //   · primary   제목 줄(행마다 하나)      · secondary 제목 아래 보조 줄
  //   · kicker    제목 위 배지 줄            · trailing  우측 값(금액·상태)
  //   · inline    보조 줄에 이어 붙는 값     · none      좁은 화면에서 안 보임(기본)
  listSlot?: 'primary' | 'secondary' | 'kicker' | 'inline' | 'trailing' | 'none';
};
export type DataTableRow = Record<string, unknown>;
export type DataTableSort = { key: string; direction: 'asc' | 'desc' } | null;

type Props = {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  status?: 'loading' | 'empty' | 'ready';
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  page?: number;
  onPageChange?: (page: number) => void;
  totalPages?: number;
  totalCount?: number;                        // 푸터 좌측 "총 N건"(number만, 포맷은 부품 고정). 데이터가 결정.
  onRowClick?: (row: DataTableRow) => void;   // 행 클릭 이동(범용). actions 셀과 경쟁 안 하도록 보기 액션은 두지 않음.
  stickyHeader?: boolean;                     // 스크롤 컨테이너 안에서 헤더 고정(목록을 내부 스크롤에 얹을 때). 기본 false.
  emptyState?: { icon?: IconName; title: string; description?: string };
  // 행 선택(체크박스 열) — controlled. 액션 경계: 행/선택/컬럼 스코프=DataTable, 페이지 스코프(신규 생성 등)=ListPage.
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowId?: (row: DataTableRow) => string;      // 기본 row.id
  bulkActions?: Action[];                     // 선택된 행 대상(선택>0일 때 상단 툴바). 선택 무관 액션은 ListPage 몫.
};

// 정렬·헤더밴드·클립은 _cells 단일 출처(ListWidget과 공유 — 두 곳 드리프트 차단). 위 import 별칭으로 사용.

export function DataTable({
  columns, rows, status = 'ready', sort, onSortChange,
  page, onPageChange, totalPages, totalCount, onRowClick, stickyHeader, emptyState,
  selectable, selectedIds, onSelectionChange, rowId, bulkActions,
}: Props) {
  // 열 폭 규칙(table-layout auto 유지 — 도메인 폭 하드코딩 0). 각 셀의 *최소폭 = 자기 내용*(절대 안 짓눌림), 최대 = 스키마(maxWidth):
  //  · grow 열: width:100% + **max-width:0** → 남은 폭만 먹고(형제에게 공간 양보) 길면 … 말줄임. max-width:0이 없으면 형제를 min-content 이하로 짓눌러(배지가 자기 폭보다 작게 잘림) 버린다.
  //  · 나머지 열: nowrap → 내용 자연폭 유지(grow가 공간을 다 가져가도 안 줄어듦). 헤더도 한 줄.
  //  · maxWidth 열: 셀 내부 div가 상한(td의 max-width는 auto 레이아웃에서 무시) — 상한 안에서 자연폭, 넘으면 말줄임.
  const hasGrow = columns.some((c) => c.grow);
  const cellStyle = (c: DataTableColumn) =>
    c.grow ? { width: '100%' as const, maxWidth: 0, ...CLIP }
      : hasGrow ? { whiteSpace: 'nowrap' as const }
        : null;
  if (status === 'loading') return <Center p="xl"><Spinner /></Center>;
  if (status === 'empty')
    return <EmptyState icon={emptyState?.icon} title={emptyState?.title ?? '데이터 없음'} description={emptyState?.description} />;

  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    if (sort?.key === key) onSortChange({ key, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    else onSortChange({ key, direction: 'asc' });
  };

  // 선택 상태(controlled). id는 rowId 또는 row.id.
  const idOf = (row: DataTableRow) => (rowId ? rowId(row) : String(row.id ?? ''));
  const selected = new Set(selectedIds ?? []);
  const allSelected = !!selectable && rows.length > 0 && rows.every((r) => selected.has(idOf(r)));
  const toggleAll = () => onSelectionChange?.(allSelected ? [] : rows.map(idOf));
  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange([...next]);
  };

  return (
    // 외곽은 Fragment — 표↔푸터 간격은 Divider+푸터 패딩이 책임진다(Stack gap을 넣으면 마지막 행 아래 군더더기 유격).
    <>
      {/* 벌크 액션 툴바 — 선택>0 + bulkActions 있을 때만(선택 스코프 액션). 페이지 액션은 ListPage 헤더 몫(경계). */}
      {selectable && bulkActions && bulkActions.length > 0 && selected.size > 0 && (
        <MGroup justify="space-between" align="center" p="sm" mb="xs" wrap="nowrap"
          style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--mantine-radius-sm)' }}>
          <Text variant="body-strong">{`${selected.size}개 선택`}</Text>
          <MGroup gap="xs" align="center">{bulkActions.map((a, i) => renderAction(a, i, 'sm'))}</MGroup>
        </MGroup>
      )}
      {/* 데이터행 세로여백 = sm(12). 내용(텍스트 한 줄·작은 아바타) 대비 md(16)는 과해 낮춤. */}
      {/* highlightOnHover는 행이 이동(onRowClick)할 때만 — 비이동 행은 hover 강조 불필요(클릭 가능 신호). */}
      <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover={!!onRowClick} stickyHeader={stickyHeader}>
        {/* 헤더 밴드 — 회색 배경 + 본문보다 강조(body-strong·primary)로 "내용 위 한 단계"임을 시각화.
            ※ 배경·divider는 *셀(th)* 에 준다 — sticky <thead>/<tr>의 background·border는 페인트 안 됨(스크롤 시 회색·구분선 사라짐).
            HEAD_CELL: bg-secondary + boxShadow inset 하단 1px(= sticky에서도 그려지는 divider, 핀돼도 아래 내용과 구분). */}
        <Table.Thead>
          <Table.Tr>
            {selectable && (
              <Table.Th style={{ width: 44, verticalAlign: 'middle', ...HEAD_CELL }} onClick={(e) => e.stopPropagation()}>
                <Checkbox checked={allSelected} onChange={toggleAll} />
              </Table.Th>
            )}
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const arrow: IconName = active && sort?.direction === 'desc' ? 'chevron-down' : 'chevron-up';
              return (
                <Table.Th key={c.key} style={{ textAlign: textAlignOf(c.type), cursor: c.sortable ? 'pointer' : 'default', paddingBlock: 'var(--mantine-spacing-sm)', verticalAlign: 'middle', ...HEAD_CELL, ...cellStyle(c) }}
                  onClick={c.sortable ? () => toggleSort(c.key) : undefined}>
                  <MGroup gap={4} align="center" justify={justifyOf(c.type)} wrap="nowrap">
                    <Text variant="body-strong">{c.label}</Text>
                    {c.sortable && (
                      // 정렬 가능 열엔 항상 꺽쇠(비활성=opacity 0.35로 옅게). 라벨 옆 — 텍스트 정렬은 데이터 타입대로(우측밀착 강제 X).
                      // flex 안에선 Icon vertical-align 보정이 죽으므로 같은 토큰을 transform으로 복원(헤더 한정).
                      <span style={{ display: 'inline-flex', transform: 'translateY(calc(-1 * var(--icon-baseline-shift)))', opacity: active ? 1 : 0.35 }}>
                        <Icon name={active ? arrow : 'chevron-down'} size="sm" color="secondary" />
                      </span>
                    )}
                  </MGroup>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, ri) => {
            const id = idOf(row);
            return (
              <Table.Tr key={ri} onClick={onRowClick ? () => onRowClick(row) : undefined} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {selectable && (
                  <Table.Td style={{ width: 44, verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(id)} onChange={() => toggleOne(id)} />
                  </Table.Td>
                )}
                {columns.map((c) => {
                  const content = renderCell(c.type, row[c.key], { badgeColors: c.badgeColors });
                  return (
                    <Table.Td key={c.key} style={{ textAlign: textAlignOf(c.type), verticalAlign: 'middle', ...cellStyle(c) }}
                      onClick={c.type === 'actions' || c.type === 'menu' ? (e) => e.stopPropagation() : undefined}>
                      {c.maxWidth != null ? <div style={{ ...CLIP, maxWidth: c.maxWidth }}>{content}</div> : content}
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
      {(() => {
        const hasPagination = typeof page === 'number' && typeof totalPages === 'number' && !!onPageChange;
        const hasCount = typeof totalCount === 'number';
        if (!hasPagination && !hasCount) return null;
        // 둘 다면 "총 N건"(좌) + 페이지(우), 하나뿐이면 그것만(페이지는 중앙).
        const justify = hasPagination && hasCount ? 'space-between' : hasCount ? 'flex-start' : 'center';
        return (
          <>
            {/* 표↔페이지네이션 경계 구분선 — 목록 하단 표준 구성. Stack gap=0이라 마지막 행 바로 아래 밀착. */}
            <Divider />
            <MGroup justify={justify} align="center" p="md" wrap="nowrap">
              {hasCount && <Text variant="caption" color="secondary">{`총 ${(totalCount as number).toLocaleString('ko-KR')}건`}</Text>}
              {hasPagination && <Pagination total={totalPages as number} value={page as number} onChange={onPageChange!} />}
            </MGroup>
          </>
        );
      })()}
    </>
  );
}
