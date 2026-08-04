'use client';
// MobileList (유기체) — 모바일 목록 화면의 **껍데기**. 필터·검색·로딩/빈 상태·계층·더보기를 한 계약으로 묶는다.
//
//  왜 필요한가: 이 계약은 전부터 있었지만 `MobileBoardList` 안에만 있었다. 항목 타입이 `BoardPost`로
//   고정돼 다른 목록이 쓸 수 없었고, 그 결과 v0.68.0에서 정한 **로딩 규율이 게시판 화면에서만 지켜졌다**
//   (400ms 지연 스피너 · 이미 행이 있으면 지우지 않음). 화면마다 useState+EmptyState+Button으로
//   다시 조립하면 그 규율이 매번 갈린다. → 껍데기를 여기 한 벌 두고 `MobileBoardList`가 그 위에 얹힌다.
//
//  · **계층은 축이다**(평면 / 섹션 / 섹션+그룹). 별도 부품으로 가르지 않는다 —
//    가르면 status·필터·더보기 계약이 두 벌이 되고, 그게 정확히 위 문제의 부품 층 재현이다.
//  · **정렬을 하지 않는다.** `items`를 정렬된 상태로 받는다. 정렬 규칙은 화면마다 다르고 그건 데이터의 일이다
//    (헌법 1). 부품이 "우선순위·마감" 같은 걸 알기 시작하면 도메인 무지가 깨진다.
//  · 필터는 **축이 하나일 때**의 자리다(칩 줄). 축이 둘 이상이면 `MobileFilterBar`를 쓴다 —
//    축 하나에 드롭다운을 쓰면 한 번 더 눌러야 하고, 축이 여럿인데 칩을 깔면 줄이 늘어난다.
import type { ReactNode } from 'react';
import { MobileSection } from './MobileSection';
import { MobileChoice } from './MobileChoice';
import { InputGroup } from './InputGroup';
import { TextInput } from './TextInput';
import { EmptyState } from './EmptyState';
import { Spinner } from './Spinner';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { useDelayedFlag } from './_useDelayedFlag';
import { fmtNumber } from './_cells';
import './mobilelist.css';

/** 섹션 — 위에서부터 순서대로 판정한다. 0건이어도 헤더는 남는다(구조가 흔들리지 않게). */
export type MobileListSection<T> = {
  key: string;
  title: string;
  match: (item: T) => boolean;
};

type Props<T> = {
  items: T[];                          // **정렬된 상태로** 받는다
  getKey: (item: T) => string;
  renderRow: (item: T) => ReactNode;

  // ── 계층(선택) ──
  sections?: MobileListSection<T>[];
  groupBy?: (item: T) => string;                    // 섹션 안에서 한 번 더 묶는다
  renderGroupHeader?: (items: T[]) => ReactNode;
  /** 그룹 크기 **≥ 2에서만** 렌더한다 — 한 건짜리 그룹에 일괄 액션은 뜻이 없다(노출 판정은 부품 소관). */
  renderGroupAction?: (items: T[]) => ReactNode;

  // ── 걸러내기(선택) ──
  filters?: { value: string; label: string }[];
  filter?: string;
  onFilterChange?: (v: string) => void;
  filterLabel?: string;                             // 칩 줄의 접근성 이름
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;

  // ── 상태(선택) ──
  status?: 'loading' | 'empty' | 'ready';
  emptyState?: { icon?: IconName; title: string; description?: string };
  onLoadMore?: () => void;
  loadMoreLabel?: string;
  totalCount?: number;
};

export function MobileList<T>({
  items, getKey, renderRow,
  sections, groupBy, renderGroupHeader, renderGroupAction,
  filters, filter, onFilterChange, filterLabel = '필터',
  searchQuery, onSearchChange, searchPlaceholder = '검색',
  status = 'ready', emptyState, onLoadMore, loadMoreLabel = '더보기', totalCount,
}: Props<T>) {
  // 이미 보여줄 게 있으면 지우지 않는다 — 재조회 때 목록을 비우고 스피너를 띄우면 체감이 더 나빠지고
  //  사용자는 화면이 사라진 걸 오류로 읽는다. 스피너는 *처음 채울 때*만 자리를 갖는다.
  const firstLoad = status === 'loading' && items.length === 0;
  // 표시는 늦게 켠다(NN/g: 1초 미만엔 루프 표시를 쓰지 마라). 끄는 건 즉시.
  const showSpinner = useDelayedFlag(firstLoad);

  const hasFilterBar = Boolean(onSearchChange) || Boolean(filters?.length && filter != null && onFilterChange);
  // 더보기는 *데이터가 결정*한다 — totalCount를 주면 아직 안 불러온 게 있을 때만 뜬다.
  const hasMore = onLoadMore != null && (totalCount == null || items.length < totalCount);

  /** 한 묶음을 그린다 — groupBy가 없으면 행을 그대로, 있으면 그룹 머리 + 액션을 얹는다. */
  const renderBucket = (bucket: T[]) => {
    if (!groupBy) return bucket.map((it) => <div key={getKey(it)}>{renderRow(it)}</div>);

    // 순서는 items가 이미 정한다 — 여기서 다시 정렬하지 않는다(첫 등장 순).
    const order: string[] = [];
    const byKey = new Map<string, T[]>();
    for (const it of bucket) {
      const k = groupBy(it);
      if (!byKey.has(k)) { byKey.set(k, []); order.push(k); }
      byKey.get(k)!.push(it);
    }
    return order.map((k) => {
      const group = byKey.get(k)!;
      return (
        <div key={k} className="mlist-group">
          {(renderGroupHeader || renderGroupAction) && (
            <div className="mlist-group-hd">
              {renderGroupHeader && <span className="mlist-group-t">{renderGroupHeader(group)}</span>}
              {/* 한 건짜리 그룹엔 액션을 안 그린다 — 일괄이 뜻을 갖는 건 둘부터다. */}
              {renderGroupAction && group.length >= 2 && (
                <span className="mlist-group-a">{renderGroupAction(group)}</span>
              )}
            </div>
          )}
          {group.map((it) => <div key={getKey(it)}>{renderRow(it)}</div>)}
        </div>
      );
    });
  };

  return (
    <>
      {hasFilterBar && (
        <MobileSection>
          {onSearchChange && (
            <InputGroup leftAddon={<Icon name="search" size="sm" />}>
              <TextInput value={searchQuery ?? ''} onChange={onSearchChange} placeholder={searchPlaceholder} />
            </InputGroup>
          )}
          {filters && filters.length > 0 && filter != null && onFilterChange && (
            <div className="mlist-filters">
              <MobileChoice options={filters} value={filter} onChange={onFilterChange} ariaLabel={filterLabel} />
            </div>
          )}
        </MobileSection>
      )}

      {firstLoad ? (
        // 지연 전에는 아무것도 안 그리되 **자리는 잡아둔다** — 스피너가 뜰 때 화면이 튀지 않게.
        <div className="mlist-loading" role="status" aria-live="polite">
          {showSpinner && <Spinner />}
        </div>
      ) : status === 'empty' || items.length === 0 ? (
        <MobileSection>
          <EmptyState
            icon={emptyState?.icon ?? 'file-text'}
            title={emptyState?.title ?? '항목이 없습니다'}
            description={emptyState?.description}
          />
        </MobileSection>
      ) : (
        <>
          {sections
            ? sections.map((s) => (
                // 섹션 키를 밖으로 노출한다 — 소비처가 특정 구획만 다르게 칠할 수 있게(예: 공지 구획 틴트).
                //  raw 슬롯을 여는 대신 닫힌 훅 하나만 준다.
                <div key={s.key} className="mlist-sec" data-section={s.key}>
                  <MobileSection title={s.title || undefined} flush>
                    {renderBucket(items.filter(s.match))}
                  </MobileSection>
                </div>
              ))
            : <MobileSection flush>{renderBucket(items)}</MobileSection>}

          {/* 더보기·총계 — 목록의 *연장*이지 커밋 행동이 아니다(커밋은 셸 하단 고정이 받는다).
              그래서 채운 버튼을 쓰지 않고 TDS ListFooter 어법(파란 텍스트 + 들여쓴 구분선)으로 간다.
              separator="none": 구분선을 섹션이 아니라 .mlist-more가 그린다(행 구분선과 같은 인셋). */}
          {(hasMore || totalCount != null) && (
            <MobileSection separator="none" flush>
              {hasMore && (
                <button type="button" className="mlist-more" onClick={onLoadMore}>{loadMoreLabel}</button>
              )}
              {totalCount != null && (
                <div className="mlist-total"><Text variant="caption" color="secondary">총 {fmtNumber(totalCount)}건</Text></div>
              )}
            </MobileSection>
          )}
        </>
      )}
    </>
  );
}
