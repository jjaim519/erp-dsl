'use client';
// OpenItemListWidget (유기체) — **미결 항목 목록**(SAP의 open item management). 한 줄 = 아직 안 끝난 돈 한 건:
//  원금액 / 수납 / 잔액. 매출채권(수금)과 매입채무(지급)가 **부호만 반대인 같은 물건**이라 labels로 갈린다.
//
// ── AgingReport와 갈리는 선 ───────────────────────────────────────────────────
//  거기는 **매트릭스**(행=거래처 × 열=연령 버킷)라 회계가 *읽는다*. 여기는 **평면 목록 + 행동**이라
//  담당자가 *처리한다*. 같은 데이터를 두 부품이 다르게 보는 건 정상이다(DataTable/DataSheet 선례).
//
// ── 이 부품이 지키는 불변식 ───────────────────────────────────────────────────
//  **잔액 = 원금액 − 수납.** 소비처가 세 번째 열을 손으로 만들지 않는다. 하단 합계도 여기서 나온다.
//  (소비처 화면이 이 뺄셈을 매번 다시 하고 있었고, 그래서 목록마다 다른 수가 나왔다.)
//
// ── 위젯이다 ────────────────────────────────────────────────────────────────
//  페이지 위에 바로 올라가므로 **raised 표면 + 그림자**를 자기가 갖는다(02 elevation 2축).
//  제목·설명은 여전히 `PageHeader`의 자리다. 하지만 **표 전체를 조작하는 액션은 표 툴바가 갖는다** —
//  Fiori가 표 툴바를 "표 전체에 영향을 주는 주요 액션"의 자리로 규정하고, 좌측에 건수를 둔다.
//  (필터·검색은 툴바에 안 온다 — 그건 스코프 존의 일이고 이 부품은 스코프를 안 갖는다.)
//  **총계는 하단 합계행**이다(AgingReportWidget tfoot과 같은 규율).
//
//  ⚠ **목록과 원장을 한 화면에 같이 놓지 말 것.** 좁은 Drawer도, 2-pane도 안 된다 —
//  1200px을 5:7로 갈라도 좌측은 대상 이름이, 우측은 적요가 잘린다(둘 다 화면에서 확인하고 되돌렸다).
//  업계가 하는 것도 분할이 아니라 **이동**이다: SAP는 List Report → Object Page, Odoo·Xero는 목록 → 상세 폼.
//  (Flexible Column Layout은 상세가 *폼*일 때 쓰는 것이지 7열 원장을 담는 자리가 아니다.)
//
// ── 행에 경로는 **하나**다 ───────────────────────────────────────────────────
//  `onSelect`를 주면 **행 전체가 클릭 대상**이다(DataTable·ListWidget과 같은 규율).
//  행 안에 버튼·링크·chevron을 두지 않는다 — 그건 이미 `DataTable`이 주석으로 못박아 둔 규칙이고
//  ("actions 셀과 경쟁 안 하도록 보기 액션은 두지 않음") 어겼더니 `stopPropagation` 해킹이 필요했다.
//  첫 셀에 링크를 걸었더니 그 순간 액션 열이 갈 곳을 잃었다 — 같은 행에서 두 경로가 같은 곳을 가리키니까.
//  행 단위 액션이 꼭 필요한 화면이면 그건 이 부품이 아니다(행 클릭을 포기하고 `DataTable`을 쓴다).
//
// ── 한 건은 한 줄이다 ────────────────────────────────────────────────────────
//  보조 정보를 둘째 줄로 내리면 행 높이가 들쭉날쭉해지고, 옆 칸의 버튼·글리프가 세로로 안 맞는다
//  (화면에서 확인했다). 열로 올릴 것은 열로 올리고, 부제는 **같은 줄에** 흐린 글자로 붙인다.
import { HEAD_CELL, renderAction, type Action, type BadgeColor } from './_cells';
import { Money } from './Money';
import { Text } from './Text';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import type { IconName } from './Icon';
import './openitem.css';

/** 미결 한 건. `gross`·`received`만 받고 **잔액은 부품이 뺀다**. */
export type OpenItem = {
  id: string;
  label: string;              // 현장·거래처·청구번호 — 무엇을 여기 넣을지는 소비처가 정한다
  /** 같은 줄에 붙는 흐린 보조(거래처·계약일). **둘째 줄로 안 내린다** — 행 높이가 흔들린다. */
  sublabel?: string;
  owner?: string;             // 담당. 있으면 그 열이 열린다
  gross: number;              // 계약금액·청구액
  received: number;           // 지금까지 받은 것
  due?: string;               // 만기(표시용 문자열)
  age?: { label: string; tone?: BadgeColor };  // 연령 알약 — 구간 판단은 소비처(부품은 라벨·톤만)
};

type Props = {
  items: OpenItem[];

  // ── A층: 데이터·콜백 유무 ──
  /** 주면 **행 전체가 클릭 대상**이 된다. 무엇을 띄울지는 페이지가 정한다(표면 비소유). */
  onSelect?: (item: OpenItem) => void;
  /** 2-pane에서 지금 열려 있는 행 표시. */
  selectedId?: string | null;
  status?: 'loading' | 'ready';
  skeletonRows?: number;

  // ── B층: 배열 길이 ──
  /** 표 툴바 우측 — **위젯이 둘 이상인 페이지에서만** 쓴다.
   *  Fiori가 표 툴바에 액션을 두는 건 한 페이지에 표가 여럿일 때 "어느 표의 액션인가"를 가려야 해서다.
   *  위젯 하나짜리 페이지면 그 구분이 사용자에게 안 보이고 액션 존만 두 개 쌓인다 — **`PageHeader`로 보낸다.**
   *  안 주면 툴바 존 자체가 없다(건수만으로는 행을 만들지 않는다). */
  actions?: Action[];

  // ── C층: 스위치 ──
  /** 채권/채무 어휘. 기본 = 채권(수금). */
  labels?: { subject?: string; gross?: string; received?: string; balance?: string; total?: string };

  emptyState?: { icon?: IconName; title: string; description?: string };
};

export function OpenItemListWidget({
  items, onSelect, selectedId, status = 'ready', skeletonRows = 4, actions, labels, emptyState,
}: Props) {
  const L = {
    subject: labels?.subject ?? '대상',
    gross: labels?.gross ?? '계약금액',
    received: labels?.received ?? '수납',
    balance: labels?.balance ?? '잔액',
    total: labels?.total ?? '합계',
  };

  const balanceOf = (it: OpenItem) => it.gross - it.received;
  const grand = items.reduce((s, it) => s + balanceOf(it), 0);
  const hasOwner = items.some((it) => it.owner);
  const hasAge = items.some((it) => it.age || it.due);

  const toolbar = actions && actions.length > 0 ? (
    <div className="erpOilBar">
      <Text variant="caption" color="secondary">{items.length}건</Text>
      <div className="erpOilSpacer" />
      {actions.map((a, i) => renderAction(a, i, 'sm'))}
    </div>
  ) : null;

  if (status === 'loading')
    return (
      <div className="erpOil">
        {toolbar}
        <div className="erpOilSkel">
          {Array.from({ length: skeletonRows }, (_, i) => <Skeleton key={i} variant="text" lines={1} />)}
        </div>
      </div>
    );

  if (items.length === 0)
    return (
      <div className="erpOil">
        {toolbar}
        <EmptyState icon={emptyState?.icon} title={emptyState?.title ?? '미결 건이 없습니다'} description={emptyState?.description} />
      </div>
    );

  return (
    <div className="erpOil">
      {toolbar}
      <div className="erpOilScroll">
        <table className="erpOilTable">
          <thead>
            <tr>
              <th style={HEAD_CELL} className="is-grow">{L.subject}</th>
              {hasOwner && <th style={HEAD_CELL} className="w-owner">담당</th>}
              <th style={HEAD_CELL} className="is-num w-money">{L.gross}</th>
              <th style={HEAD_CELL} className="is-num w-money">{L.received}</th>
              <th style={HEAD_CELL} className="is-num w-bal">{L.balance}</th>
              {hasAge && <th style={HEAD_CELL} className="w-age">만기</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              return (
                <tr key={it.id}
                  className={[onSelect ? 'is-clickable' : '', selectedId === it.id ? 'is-selected' : ''].filter(Boolean).join(' ')}
                  onClick={onSelect ? () => onSelect(it) : undefined}>
                  <td className="is-grow">
                    {it.label}
                    {it.sublabel && <span className="sub">{it.sublabel}</span>}
                  </td>
                  {hasOwner && <td className="w-owner">{it.owner}</td>}
                  <td className="is-num"><Money value={it.gross} symbol={false} /></td>
                  <td className="is-num"><Money value={it.received} symbol={false} zero="dash" /></td>
                  {/* 잔액은 파생 — 소비처가 준 값이 아니라 부품이 뺀 값이다. */}
                  <td className="is-num erpOilBal"><Money value={balanceOf(it)} symbol={false} emphasis /></td>
                  {hasAge && (
                    <td className="w-age">
                      {it.due}
                      {it.age && <span className="sub"><Badge color={it.age.tone ?? 'neutral'}>{it.age.label}</Badge></span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="is-grow">{L.total}</td>
              {hasOwner && <td />}
              <td className="is-num"><Money value={items.reduce((t, i) => t + i.gross, 0)} symbol={false} /></td>
              <td className="is-num"><Money value={items.reduce((t, i) => t + i.received, 0)} symbol={false} /></td>
              <td className="is-num erpOilBal"><Money value={grand} symbol={false} /></td>
              {hasAge && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
