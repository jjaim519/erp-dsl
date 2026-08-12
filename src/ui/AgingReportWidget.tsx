'use client';
// AgingReportWidget (유기체) — **채권 연령 매트릭스**. 행=거래처(펼치면 청구건) × 열=연령 버킷 + 합계.
//  업계 형태를 그대로 가져온다(Odoo Aged Receivable · Xero AR Aging · SAP "AR Aging Grid"):
//  **버킷은 필터가 아니라 열**이다. 한 거래처의 돈이 어느 연령대에 얼마씩 깔려 있는지는
//  가로로 읽어야 보이고, 어느 연령대가 회사 전체에서 두꺼운지는 세로로 읽어야 보인다.
//  버킷을 상단 필터 밴드로 접으면 그 두 읽기가 모두 사라진다(첫 목업에서 그렇게 만들었다가 되돌렸다).
//
// ── 이 부품이 **안 하는** 것: 행동 ────────────────────────────────────────────
//  행에 「수금」 버튼이 없다. 이건 회계가 *읽는* 리포트고, 영업이 *처리하는* 작업 큐는 다른 부품이다
//  (같은 데이터를 두 부품이 다르게 보는 건 정상 — DataTable/DataSheet 선례).
//  드릴은 `onRowClick`으로 신호만 보낸다(모달 비소유 — Calendar 선례).
//
// ── 버킷을 주입받는 이유 ─────────────────────────────────────────────────────
//  30/60/90은 관행이지 표준이 아니다(Xero 90+, Odoo 120+, 국내 여신 규정마다 다름).
//  구간을 부품이 정하면 그 회사 회계와 숫자가 안 맞는다 — `buckets`는 **필수 주입**이다.
import { HEAD_CELL, type Action, renderAction } from './_cells';
import { Money } from './Money';
import { Text } from './Text';
import { Icon } from './Icon';
import { EmptyState } from './EmptyState';
import type { IconName } from './Icon';
import './aging.css';

/** 버킷 정의. `tone`은 연령이 올라갈수록 escalate — 색은 데이터가 아니라 *구간*에 붙는다. */
export type AgingBucket = {
  key: string;
  label: string;
  /** 열 머리의 색 띠. 안 주면 순서대로 neutral→danger로 부품이 매긴다. */
  tone?: 'neutral' | 'warning' | 'danger';
};

/** 한 행 = 거래처(또는 그 아래 청구건). `amounts`의 키는 buckets[].key. */
export type AgingRow = {
  id: string;
  label: string;
  sublabel?: string;
  amounts: Record<string, number>;
  /** 있으면 트위스티가 생긴다(펼치면 청구건 줄). */
  children?: AgingRow[];
};

type Props = {
  /** 필수 주입 — 30/60/90은 우리가 정할 값이 아니다. */
  buckets: AgingBucket[];
  rows: AgingRow[];

  // ── A층: 데이터·콜백 유무 ──
  /** 기준일. 있으면 헤더 캡션에 붙는다 — 연령 리포트는 "언제 기준"이 없으면 못 읽는다. */
  asOf?: string;
  /** 하단 합계행의 총액. 없으면 열 합계에서 파생한다. */
  total?: number;
  onRowClick?: (row: AgingRow) => void;
  /** 펼침은 controlled — 어느 거래처를 열어 뒀는지는 화면의 상태다. */
  expandedIds?: string[];
  onExpandChange?: (ids: string[]) => void;

  // ── B층: 배열 길이 ──
  actions?: Action[];

  // ── C층: 스위치 ──
  /** 만기 기준(기본) / 발행일 기준. 숫자가 통째로 달라지므로 화면에 *표기*한다. */
  basis?: 'due' | 'issue';
  /** 하단 구성비 행. */
  showRatio?: boolean;

  emptyState?: { icon?: IconName; title: string; description?: string };
};

const AUTO_TONE = (i: number, n: number): 'neutral' | 'warning' | 'danger' =>
  (i === 0 ? 'neutral' : i >= n - 1 ? 'danger' : i >= Math.ceil((n - 1) / 2) ? 'warning' : 'neutral');

const sumRow = (r: AgingRow, buckets: AgingBucket[]) =>
  buckets.reduce((s, b) => s + (r.amounts[b.key] ?? 0), 0);

export function AgingReportWidget({
  buckets, rows, asOf, total, onRowClick,
  expandedIds, onExpandChange, actions, basis = 'due', showRatio, emptyState,
}: Props) {
  const colTotals = buckets.map((b) => rows.reduce((s, r) => s + (r.amounts[b.key] ?? 0), 0));
  const grand = total ?? colTotals.reduce((s, v) => s + v, 0);
  const expanded = new Set(expandedIds ?? []);
  const leafCount = rows.reduce((s, r) => s + (r.children?.length ?? 1), 0);

  const toggle = (id: string) => {
    if (!onExpandChange) return;
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    onExpandChange([...next]);
  };

  const caption = [
    asOf && `기준일 ${asOf}`,
    basis === 'due' ? '만기 기준' : '발행일 기준',
    `${rows.length}개 거래처`,
    `${leafCount}건`,
  ].filter(Boolean).join(' · ');

  const cell = (key: string, v: number | undefined, tone: 'neutral' | 'warning' | 'danger') => (
    <td key={key} className={`is-num tone-${tone}`}>
      <Money value={v ?? 0} zero="dash" symbol={false} emphasis={tone !== 'neutral' && (v ?? 0) > 0} />
    </td>
  );

  // 툴바 존 — Fiori: 좌=건수·기준 캡션 / 우=표 전체 액션. 제목은 PageHeader의 자리라 여기 없고,
  //  총액도 여기 없다 — tfoot 합계행이 이미 같은 수를 말한다.
  const toolbar = (
    <div className="erpAgingBar">
      <Text variant="caption" color="secondary">{caption}</Text>
      <div className="erpAgingSpacer" />
      {actions?.map((x, i) => renderAction(x, i, 'sm'))}
    </div>
  );

  if (rows.length === 0)
    return (
      <div className="erpAging">
        {toolbar}
        <EmptyState icon={emptyState?.icon} title={emptyState?.title ?? '미수 채권 없음'} description={emptyState?.description} />
      </div>
    );

  const rowTr = (r: AgingRow, opts: { child?: boolean } = {}) => {
    const openable = Boolean(r.children?.length && onExpandChange);
    const isOpen = expanded.has(r.id);
    return (
      <tr key={r.id}
        className={[opts.child ? 'is-child' : 'is-parent', onRowClick ? 'is-clickable' : ''].filter(Boolean).join(' ')}
        onClick={onRowClick ? () => onRowClick(r) : undefined}>
        <td className="is-grow">
          {openable ? (
            <button type="button" className="erpAgingTw" aria-expanded={isOpen}
              aria-label={isOpen ? '접기' : '펼치기'}
              onClick={(e) => { e.stopPropagation(); toggle(r.id); }}>
              <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size="sm" color="secondary" />
            </button>
          ) : !opts.child && rows.some((x) => x.children?.length) ? <span className="erpAgingTw is-empty" /> : null}
          <span className="erpAgingLabel">{r.label}</span>
          {r.sublabel && <span className="l2">{r.sublabel}</span>}
        </td>
        {buckets.map((b, i) => cell(b.key, r.amounts[b.key], b.tone ?? AUTO_TONE(i, buckets.length)))}
        <td className="is-num erpAgingTot"><Money value={sumRow(r, buckets)} zero="dash" symbol={false} emphasis={!opts.child} /></td>
      </tr>
    );
  };

  return (
    <div className="erpAging">
      {toolbar}

      <div className="erpAgingScroll">
        <table className="erpAgingTable">
          <thead>
            <tr>
              <th style={HEAD_CELL} className="is-grow">거래처</th>
              {buckets.map((b, i) => (
                <th key={b.key} style={HEAD_CELL} className={`is-num tone-${b.tone ?? AUTO_TONE(i, buckets.length)}`}>
                  <i className="erpAgingBand" />{b.label}
                </th>
              ))}
              <th style={HEAD_CELL} className="is-num erpAgingTot">합계</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => [
              rowTr(r),
              ...(expanded.has(r.id) ? (r.children ?? []).map((c) => rowTr(c, { child: true })) : []),
            ])}
          </tbody>
          <tfoot>
            <tr className="erpAgingSum">
              <td>합계</td>
              {colTotals.map((v, i) => (
                <td key={buckets[i].key} className="is-num"><Money value={v} zero="dash" symbol={false} /></td>
              ))}
              <td className="is-num erpAgingTot"><Money value={grand} symbol={false} /></td>
            </tr>
            {showRatio && (
              <tr className="erpAgingRatio">
                <td>구성비</td>
                {colTotals.map((v, i) => (
                  <td key={buckets[i].key} className="is-num">{grand ? `${((v / grand) * 100).toFixed(1)}%` : '—'}</td>
                ))}
                <td className="is-num erpAgingTot">100%</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
}
