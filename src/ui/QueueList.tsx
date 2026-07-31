'use client';
// QueueList (유기체) — 평평한 목록 + *선택 상태*. 2-pane 좌측(큐)의 표준 골격.
//
//  왜 신설인가(기존 부품이 못 하는 것):
//   · ListWidget — 표(table) 골격이고 `selectedId`가 없다. `selectable`은 벌크 처리용 다중 체크지
//     "지금 보고 있는 한 행"의 표현이 아니라 2-pane 좌측이 못 된다.
//   · StatusRow  — 골격이 [라벨 + 상태배지 + 액션]으로 고정. 여긴 [mark + 제목 + 우측 메타 다중]이다.
//   · MobileListRow — 모바일 계열(헤어라인 체계·chevron="다른 화면으로"). 선택 상태가 없다.
//   즉 "평면 목록 + 선택"이 DSL의 빈칸이었다. 이 부품은 그 데스크탑 짝이다.
//
//  도메인 무지(헌법 1): 무엇이 'B2C'인지 'A안'인지 모른다 — 라벨 문자열과 *무게*만 안다.
//   그래서 mark/meta를 raw ReactNode로 열지 않았다. 열면 소비처가 자기 CSS로 배지를 그리게 되고,
//   그건 "구분자를 부품이 넣어야 한다"(색·간격이 갈리니까)와 정확히 같은 이유로 막아야 한다.
//
//  부품이 소유(노출 안 함): mark 슬롯 폭 · 구분선 인셋(자동 계산) · '·' 구분자 · 선택/hover/focus 표현 ·
//   행 최소높이 · 스켈레톤 기하. 선택 표현은 prop으로 못 바꾼다 — 근거는 queuelist.css 주석(WCAG 이중 단서).
//
//  selectionMark="radio"의 점은 **Radio 원자와 같은 프리미티브**(Mantine Radio + color="primary")가 그린다.
//   · 왜 `Radio` 원자를 그대로 못 쓰나: 그 원자는 *그룹 전체의 레이아웃까지 소유*한다(options[] → Stack).
//     여기서 한 '옵션'은 [점 + 제목 + 메타 + 배지]로 된 행이라 원자 안에 넣을 수 없다.
//   · 그렇다고 점을 손으로 그리면(초판이 그랬다) 같은 컨트롤이 화면마다 달라진다 — 지름·테두리 굵기·
//     포커스 링·다크모드가 전부 갈린다. 격리 구역이라 베이스 프리미티브를 직접 쓸 수 있고(헌법 7),
//     그게 "우리 부품으로 조립한다"의 올바른 이행이다(01 §4-D: 아톰이 못 맞출 때만 raw, 그전에 아톰부터).
//   · 행을 <label>로 감싸 진짜 <input type=radio>를 담는다 → 행 전체 클릭·화살표 키 이동·"3 중 2 선택됨"
//     낭독이 전부 네이티브로 붙는다(button+role=radio 흉내로는 못 얻는 것들).
import { useId, type CSSProperties } from 'react';
import { Radio as MantineRadio } from '@mantine/core';
import type { IconName } from './Icon';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Card } from './Card';
import type { BadgeColor } from './_cells';
import './queuelist.css';

/** 행 좌측 고정폭 표식 — 무게 사다리. 도메인 어휘는 label 문자열로만 들어온다. */
export type QueueMark = {
  label: string;
  weight?: 'quiet' | 'outline' | 'solid';   // 기본 outline
};

/** 우측 메타 한 조각. 사이 '·'는 부품이 넣는다(소비처가 문자열로 이으면 색·간격이 갈린다). */
export type QueueMeta = {
  text: string;
  tone?: 'default' | 'strong' | 'warning' | 'danger';
  icon?: IconName;
};

export type QueueItem = {
  id: string;
  mark?: QueueMark;
  title: string;
  titleMuted?: string;                              // 제목 뒤 흐린 꼬리("· 현장 미정"). 없으면 미조립
  meta?: QueueMeta[];
  badge?: { label: string; color: BadgeColor };     // 행 끝 상태 알약(계약 완료 등)
  disabled?: boolean;
};

type Props = {
  items: QueueItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** 'fill'=이 행을 보고 있다(내비게이션) / 'radio'=여럿 중 하나를 고른다(선택). 옵션이 아니라 두 의미다. */
  selectionMark?: 'fill' | 'radio';
  status?: 'ready' | 'loading' | 'empty';
  skeletonRows?: number;
  emptyState?: { icon?: IconName; title: string; description?: string };
};

const MARK_W = 46;   // px — 고정폭. 3글자가 숨 쉬고, 2글자여도 제목 시작점이 정렬된다.
const ROW_H = 44;    // px — Apple HIG 최소 터치타깃.
const RADIO_W = 20;  // px — Mantine Radio(md) 실측 지름. 인셋 계산용이며 컨트롤 크기는 프리미티브가 정한다.

export function QueueList({
  items,
  selectedId,
  onSelect,
  selectionMark = 'fill',
  status = 'ready',
  skeletonRows = 4,
  emptyState,
}: Props) {
  const radio = selectionMark === 'radio';
  const groupName = useId();   // 같은 name을 공유해야 네이티브 라디오 그룹(화살표 이동)이 성립한다
  // 구분선 좌측 인셋 = 좌패딩(sm 12) + [표식 폭 + gap(xs 8)]. 표식이 없으면 저절로 짧아진다.
  const leadW = radio ? RADIO_W + 8 : items.some((i) => i.mark) ? MARK_W + 8 : 0;
  const vars = {
    '--ql-mark': `${MARK_W}px`,
    '--ql-row': `${ROW_H}px`,
    '--ql-inset': `calc(var(--mantine-spacing-sm) + ${leadW}px)`,
  } as CSSProperties;
  const empty = status === 'empty' || items.length === 0;

  return (
    <Card variant="elevated" padding="none">
      <div className="ql" style={vars} role={radio && status === 'ready' && !empty ? 'radiogroup' : undefined}>
        {status === 'loading'
          ? Array.from({ length: skeletonRows }).map((_, i) => (
              // 실제 행과 같은 골격(높이 44·패딩·gap)이라 데이터가 오는 순간 레이아웃이 안 흔들린다.
              // 폭 변주(줄마다 다른 길이 — 실제 목록처럼 보이게)는 CSS가 :nth-child로 준다. TSX에 px를 안 박는다.
              <div key={i} className="ql-row ql-sk">
                <span className="ql-sk-mark"><Skeleton variant="block" size="sm" radius="sm" /></span>
                <span className="ql-sk-title"><Skeleton variant="text" lines={1} /></span>
                <span className="ql-sk-meta"><Skeleton variant="text" lines={1} /></span>
              </div>
            ))
          : empty
            ? <EmptyState
                icon={emptyState?.icon ?? 'list'}
                title={emptyState?.title ?? '항목이 없습니다'}
                description={emptyState?.description}
              />
            : items.map((item) => {
                const selected = item.id === selectedId;
                const clickable = !item.disabled && onSelect != null;
                const inner = (
                  <>
                    {radio
                      ? (
                        <span className="ql-radio">
                          {/* Radio 원자와 같은 프리미티브·같은 color. 라벨은 우리 행이 그리므로 안 넘긴다. */}
                          <MantineRadio
                            name={groupName}
                            value={item.id}
                            checked={selected}
                            disabled={item.disabled}
                            color="primary"
                            onChange={() => onSelect?.(item.id)}
                          />
                        </span>
                      )
                      : item.mark && (
                          <span className="ql-mark" data-weight={item.mark.weight ?? 'outline'}>{item.mark.label}</span>
                        )}
                    <span className="ql-title">
                      {item.title}
                      {item.titleMuted && <span className="ql-title-muted"> {item.titleMuted}</span>}
                    </span>
                    {item.meta && item.meta.length > 0 && (
                      <span className="ql-meta">
                        {item.meta.map((m, i) => (
                          <span key={i} style={{ display: 'contents' }}>
                            {i > 0 && <span className="ql-sep" aria-hidden>·</span>}
                            <span className="ql-meta-item" data-tone={m.tone ?? 'default'}>
                              {m.icon && <Icon name={m.icon} size="sm" />}
                              {m.text}
                            </span>
                          </span>
                        ))}
                      </span>
                    )}
                    {item.badge && <Badge color={item.badge.color}>{item.badge.label}</Badge>}
                  </>
                );
                const attrs = {
                  className: 'ql-row',
                  'data-selected': selected ? '' : undefined,
                  'data-disabled': item.disabled ? '' : undefined,
                };
                // 라디오 모드는 행이 <label>이다 — 진짜 input을 담아야 그룹 이동·낭독이 네이티브로 붙는다.
                //  (input은 interactive content라 <button> 안에 못 들어간다 — 흉내가 아니라 구조가 갈리는 지점.)
                if (radio) return <label key={item.id} {...attrs}>{inner}</label>;
                return clickable ? (
                  <button
                    key={item.id}
                    type="button"
                    {...attrs}
                    aria-current={selected ? true : undefined}
                    onClick={() => onSelect!(item.id)}
                  >
                    {inner}
                  </button>
                ) : (
                  <div key={item.id} {...attrs}>{inner}</div>
                );
              })}
      </div>
    </Card>
  );
}
