'use client';
// MobileRecordList (유기체) — **표와 같은 데이터**를 폰에서 행으로 그린다.
//
//  kk가 요청한 형태는 표용 `cells`와 카드용 `title`/`badges`/`meta`/`trailing`을 **따로** 받는 것이었다.
//  그러면 소비처가 매핑을 두 번 쓰고, 둘이 어긋나는 사고(강조가 카드에만 걸리는 류)가 계약 차원에서 반복된다.
//  그래서 계약을 다시 썼다: **`DataTableColumn.listSlot` 하나만 붙이고 columns·rows를 그대로 받는다.**
//  표와 이 부품이 **같은 배열을 본다.** 파생이라 어긋날 수가 없다(06 §3-4 · Polaris `s-table`).
//
//  이 부품은 정렬·필터·페이징을 모른다 — 껍데기는 MobileList가 갖는다. 여기는 *행 하나의 기하*만 안다.
import { MobileListRow } from './MobileListRow';
import { Badge } from './Badge';
import { renderCell } from './_cells';
import type { DataTableColumn, DataTableRow } from './DataTable';

type Props = {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  // 행의 식별자 열. 없으면 인덱스 — 목록이 재정렬되면 React 키가 흔들리므로 웬만하면 준다.
  idKey?: string;
  onRowClick?: (row: DataTableRow) => void;
};

/** 슬롯별 첫 컬럼(primary·trailing은 하나) / 여럿 가능한 슬롯은 순서대로 전부. */
const pick = (cols: DataTableColumn[], slot: DataTableColumn['listSlot']) =>
  cols.filter((c) => c.listSlot === slot);

export function MobileRecordList({ columns, rows, idKey, onRowClick }: Props) {
  const primary = pick(columns, 'primary')[0];
  const secondary = pick(columns, 'secondary');
  const inline = pick(columns, 'inline');
  const kicker = pick(columns, 'kicker');
  const trailing = pick(columns, 'trailing')[0];

  return (
    <>
      {rows.map((row, i) => {
        const key = idKey ? String(row[idKey] ?? i) : String(i);
        // 제목이 없으면 행이 무엇인지 말할 수 없다 — 첫 컬럼으로 떨어진다(조용히 빈 행을 그리지 않는다).
        const titleCol = primary ?? columns[0];
        const title = titleCol ? String(row[titleCol.key] ?? '') : '';

        // 보조 줄 — secondary + inline을 가운뎃점으로 잇는다. 빈 값은 빠진다(점만 남지 않게).
        const meta = [...secondary, ...inline]
          .map((c) => row[c.key])
          .filter((v) => v != null && v !== '')
          .map(String)
          .join(' · ');

        return (
          <MobileListRow
            key={key}
            title={title}
            meta={meta || undefined}
            badges={
              kicker.length > 0 ? (
                <>
                  {kicker.map((c) => {
                    const v = row[c.key];
                    if (v == null || v === '') return null;
                    // badgeColors가 있으면 그 열은 상태다 — 없으면 중립(색을 지어내지 않는다).
                    return <Badge key={c.key} color={c.badgeColors?.[String(v)] ?? 'neutral'}>{String(v)}</Badge>;
                  })}
                </>
              ) : undefined
            }
            // 우측 값은 표의 셀 렌더러를 그대로 쓴다 — 금액·날짜 포맷이 표와 목록에서 갈리면
            // "같은 데이터"라는 이 부품의 전제가 깨진다.
            trailing={trailing ? renderCell(trailing.type, row[trailing.key], { badgeColors: trailing.badgeColors }) : undefined}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          />
        );
      })}
    </>
  );
}
