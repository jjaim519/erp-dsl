'use client';
// Repeater 위젯 — 저작 툴킷의 척추. 가변 레코드 목록(추가/삭제/펼침)의 크롬만 소유한다.
//  · 각 레코드의 필드 레이아웃(renderItem)·접이 헤더(renderHeader)는 raw 슬롯 — 소비처가 우리 원자로 조립
//    (Modal children 동형). 슬롯은 소비처 클로저라 상위 필드 접근이 자유 → 교차 바인딩(예: 하위 컨트롤이
//    상위 레벨 값을 편집)이 특별 API 없이 성립한다.
//  · 도메인 무지(헌법 1): "옵션/치수/값"을 모른다 — 레코드 컬렉션을 더하고 지우고 접을 뿐. dimensions·options·
//    values·categories·items 전부 이걸로(중첩 = Repeater 안 Repeater).
//  · collapsible: renderHeader를 주면 접이(헤더+본문 접힘), 없으면 평면(본문 상시 + 우측 삭제).
//  · onReorder는 예약(주면 후속 dnd 배선) — 현재 소비처(견적 BOM)엔 재정렬 없어 미배선.
import { useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { EmptyState } from './EmptyState';
import './repeater.css';

type Props<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;        // 본문(펼친 상태의 필드 레이아웃)
  renderHeader?: (item: T, index: number) => ReactNode;     // 접이 헤더의 제목·뱃지(주면 collapsible)
  onAdd: () => void;
  onRemove: (index: number) => void;
  onReorder?: (from: number, to: number) => void;           // 예약(이 면 미사용)
  addLabel: string;
  itemKey?: (item: T, index: number) => string | number;    // 행 open 상태 안정 키(기본 index)
  collapsible?: boolean;                                     // 기본 = renderHeader 유무
  defaultOpen?: boolean;                                     // collapsible 초기 펼침(기본 false)
  min?: number;                                              // 이하로 삭제 불가(remove 숨김)
  max?: number;                                              // 이상 추가 불가(add 숨김)
  emptyState?: { icon?: IconName; title: string; description?: string };
};

export function Repeater<T>({
  items, renderItem, renderHeader, onAdd, onRemove,
  addLabel, itemKey, collapsible, defaultOpen = false, min = 0, max, emptyState,
}: Props<T>) {
  const isCollapsible = collapsible ?? Boolean(renderHeader);
  const canRemove = items.length > min;
  const canAdd = max == null || items.length < max;

  return (
    <div className="erpRep">
      {items.length === 0 && emptyState ? (
        <div className="erpRep-empty">
          <EmptyState icon={emptyState.icon} title={emptyState.title} description={emptyState.description} />
        </div>
      ) : (
        items.map((item, i) => (
          <RepeaterRow
            key={itemKey ? itemKey(item, i) : i}
            collapsible={isCollapsible}
            defaultOpen={defaultOpen}
            header={renderHeader?.(item, i)}
            removable={canRemove}
            onRemove={() => onRemove(i)}
          >
            {renderItem(item, i)}
          </RepeaterRow>
        ))
      )}
      {canAdd && (
        <div>
          <Button variant="ghost" size="sm" leftIcon={<Icon name="plus" size="sm" />} onClick={onAdd}>
            {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

// 한 레코드 — open 상태는 행이 소유(추가/삭제로 인덱스가 밀려도 itemKey로 안정).
function RepeaterRow({
  collapsible, defaultOpen, header, removable, onRemove, children,
}: {
  collapsible: boolean;
  defaultOpen: boolean;
  header: ReactNode;
  removable: boolean;
  onRemove: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // 삭제 버튼 — 헤더 클릭(토글)과 경쟁하지 않도록 stopPropagation.
  const removeBtn = removable ? (
    <span className="erpRep-del" onClick={(e) => e.stopPropagation()}>
      <IconButton icon="trash" label="삭제" variant="ghost" size="sm" onClick={onRemove} />
    </span>
  ) : null;

  if (!collapsible) {
    // 평면 모드 — 본문 상시 표시 + 우측 삭제.
    return (
      <div className="erpRep-rec erpRep-flat">
        <div className="erpRep-flatbody">{children}</div>
        {removeBtn}
      </div>
    );
  }

  // 접이 모드 — 헤더(chevron + 도메인 헤더 + 삭제) / 본문 접힘.
  return (
    <div className="erpRep-rec">
      <div
        className="erpRep-head"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); } }}
      >
        <span className="erpRep-chev" data-open={open || undefined}>
          <Icon name="chevron-right" size="sm" color="secondary" />
        </span>
        <span className="erpRep-htitle">{header}</span>
        {removeBtn}
      </div>
      {open && <div className="erpRep-body">{children}</div>}
    </div>
  );
}
