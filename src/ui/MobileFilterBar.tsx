'use client';
// MobileFilterBar (유기체) — **축이 둘 이상인** 필터. 축마다 버튼 하나, 값 고르기는 시트에서.
//
//  MobileList.filters(칩 줄)와의 경계는 **축의 개수**다(kk r2 §1-1 합의):
//   · 축 하나  → `MobileList.filters` 칩 줄. 드롭다운을 쓰면 한 번 더 눌러야 한다.
//   · 축 둘 이상 → 이 부품. 칩을 깔면 줄이 축 수만큼 늘어난다.
//  칩 줄을 이 부품이 내지 않는 이유도 같다 — 조사가 수렴으로 본 칩(Jira·Drive·ClickUp·Asana)은
//  *활성 필터를 보여주는* 칩이고, 여기 요구는 *고르는* 컨트롤이다. 두 물건이다.
//
//  **상태를 갖지 않는다.** 내부 상태는 "지금 열린 축" 하나뿐이다. 무엇이 걸러졌는지는 소비처가 쥔다.
//  **축의 성격을 모른다** — 무엇을 거르는 축인지는 rows가 전부 말한다(헌법 1).
//  **바의 높이는 값 개수와 무관하다** — 값은 시트 안에 있고 바에는 축 버튼만 선다.
import { useState, type ReactNode } from 'react';
import { MobileBottomSheet } from './MobileBottomSheet';
import { MobileListRow } from './MobileListRow';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';
import type { CalendarColorRole } from './CalendarPage';
import type { Action } from './_cells';
import './mobilefilter.css';

// 값 왼쪽의 표식 — "이 값이 화면에서 어떻게 생겼는가"를 미리 보여준다.
//  swatch는 CalendarColorRole을 그대로 쓴다: 자유 hex를 받으면 열린 스칼라가 되고(헌법 5),
//  무엇보다 이 표식의 뜻은 "달력에서 이 색으로 그려진다"라 **같은 인코딩 어휘여야** 거짓말이 아니다.
export type FilterMarker =
  | { kind: 'swatch'; color: CalendarColorRole }
  | { kind: 'initial'; text: string }              // 색으로 못 가르는 값(사람·거래처) — 글자가 구분자다
  | { kind: 'emphasis'; value: 'solid' | 'dashed' };

export type FilterRow = {
  // **바 전체에서 유일해야 한다.** 부품이 축 id를 접두사로 붙여주지 않는다 —
  //  그러면 키 공간이 둘(원본/접두사)이 되어 hiddenKeys에 어느 쪽을 넣는지가 흐려진다.
  key: string;
  label: string;
  count?: number;
  marker?: FilterMarker;
};

export type FilterAxis = {
  id: string;
  label: string;
  rows: FilterRow[];
  // 값이 아니라 *동작*(예: "전부 보기"가 아닌 "새 담당 추가"). 목록 끝에 경계와 함께 선다.
  action?: Action;
};

type Props = {
  axes: FilterAxis[];
  // **숨긴 키**의 집합이다(고른 키가 아니다). 극성이 중요하다:
  //  데이터에 새 값이 생기면 hiddenKeys에 없으므로 **자동으로 보인다.**
  //  selected였다면 새 값이 기본 숨김이 되어 소비처가 눈치채지 못한 채 누락된다.
  hiddenKeys: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onReset: () => void;
  resetLabel?: string;
};

/** 축 하나의 버튼 라벨 — 전부 보이면 축 이름, 일부만 보이면 "축 N". */
function axisSummary(axis: FilterAxis, hiddenKeys: ReadonlySet<string>) {
  const shown = axis.rows.filter((r) => !hiddenKeys.has(r.key));
  if (shown.length === axis.rows.length) return { text: axis.label, active: false };
  // 값 이름을 이어 붙이지 않는다 — 길이를 세서 자르는 순간 부품이 글자수를 알게 된다(요약 상한 prop이 그래서 없다).
  //  개수는 길이가 안 변해서 바 폭이 값에 따라 출렁이지 않는다.
  return { text: `${axis.label} ${shown.length}`, active: true };
}

function markerNode(m: FilterMarker): ReactNode {
  if (m.kind === 'swatch') return <span className="mfb-mk" data-swatch={m.color} />;
  if (m.kind === 'initial') return <span className="mfb-mk" data-initial>{m.text}</span>;
  return <span className="mfb-mk" data-emphasis={m.value} />;
}

export function MobileFilterBar({ axes, hiddenKeys, onToggle, onReset, resetLabel = '초기화' }: Props) {
  const [openAxis, setOpenAxis] = useState<string | null>(null);
  const axis = axes.find((a) => a.id === openAxis) ?? null;
  const anyHidden = axes.some((a) => a.rows.some((r) => hiddenKeys.has(r.key)));

  return (
    <>
      {/* 바 — 축이 많으면 가로 스크롤. 줄바꿈하지 않는다: 바 높이가 축 개수에 따라 변하면
          아래 본문이 밀려 "필터를 건드렸더니 목록이 움직였다"가 된다. */}
      <div className="mfb">
        {axes.map((a) => {
          const s = axisSummary(a, hiddenKeys);
          return (
            <button
              key={a.id}
              type="button"
              className="mfb-ax"
              data-active={s.active ? '' : undefined}
              aria-haspopup="dialog"
              onClick={() => setOpenAxis(a.id)}
            >
              <span className="mfb-ax-t">{s.text}</span>
              <Icon name="chevron-down" size="sm" />
            </button>
          );
        })}
        {/* 초기화는 걸린 게 있을 때만 — 늘 있으면 "누를 게 있다"는 신호가 죽는다. */}
        {anyHidden && (
          <button type="button" className="mfb-reset" onClick={onReset}>{resetLabel}</button>
        )}
      </div>

      {/* 값 고르기 — 시트다(06 §2-2가 시트를 생성·편집·**피커**로 열어둔 그 자리).
          축 하나만 열리므로 시트도 하나다. */}
      <MobileBottomSheet opened={axis != null} onClose={() => setOpenAxis(null)} title={axis?.label}>
        {axis && (
          <>
            {axis.rows.map((r) => (
              <MobileListRow
                key={r.key}
                title={r.label}
                leading={r.marker ? markerNode(r.marker) : undefined}
                trailing={r.count != null ? <Text variant="caption" color="secondary">{String(r.count)}</Text> : undefined}
                selectable
                selected={!hiddenKeys.has(r.key)}
                onSelectedChange={() => onToggle(r.key)}
              />
            ))}
            {axis.action && (
              <div className="mfb-act">
                <Button variant="ghost" leftIcon={axis.action.icon ? <Icon name={axis.action.icon} size="sm" /> : undefined}
                  onClick={axis.action.onClick}>
                  {axis.action.label}
                </Button>
              </div>
            )}
          </>
        )}
      </MobileBottomSheet>
    </>
  );
}
