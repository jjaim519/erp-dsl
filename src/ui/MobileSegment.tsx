'use client';
// MobileSegment (분자) — 화면 *안*의 뷰 전환. 결재함 5탭(대기/예정/처리/완료/전체) 같은 자리.
//
//  왜 MobileChoice(칩 줄)로 안 되나: 둘은 같은 형태로 보이지만 다른 말을 한다.
//   · 칩 줄 = **값 선택**. 고르면 목록이 *걸러진다*. 안 고른 상태(전체)가 자연스럽다.
//   · 세그먼트 = **뷰 전환**. 항상 하나가 켜져 있고, 고르면 목록이 *다른 것으로 바뀐다*.
//  "필터냐 폼 값이냐는 데이터의 차이지 컨트롤의 차이가 아니다"(MobileChoice)와 달리, 여기선 *컨트롤*이 다르다:
//  켜짐이 반드시 하나라는 것, 그리고 그게 "지금 보고 있는 화면"이라는 것을 밑줄이 말한다(알약 채움이 아니라).
//
//  왜 하단 탭바(MobileShell.tabs)와 다른가: 그건 앱 전체의 척추이고 이건 한 화면 안의 갈래다.
//   같은 화면에 둘이 공존하므로 신호가 겹치면 안 된다 — 탭바는 아이콘+틴트 알약, 여기는 텍스트+밑줄.
//
//  **균등/스크롤을 prop으로 열지 않는다.** 개수로 결정한다(M3 규정 그대로):
//   3개 이하 = 균등 분할(고정), 4개 이상 = 가로 스크롤. 결재함 5탭에 카운트까지 붙으면 375px에
//   균등으로 안 들어가 라벨이 뭉개진다 — 그 경우가 정확히 스크롤이 필요한 경우다.
//   소비처가 고를 일이 아니라 항목 수가 이미 답을 알고 있다(헌법 5 — 열 축이 없으면 안 연다).
import { CountBadge } from './CountBadge';
import './mobilelist.css';

export type MobileSegmentItem = {
  value: string;
  label: string;
  count?: number;      // 있으면 라벨 옆 카운트. 0 이하는 CountBadge가 알아서 안 그린다.
};

type Props = {
  items: MobileSegmentItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export function MobileSegment({ items, value, onChange, ariaLabel }: Props) {
  // 4개부터 스크롤 — 위 헤더 주석의 근거(M3 fixed 2~3 / scrollable 4+).
  const scroll = items.length > 3;
  return (
    <div className="mseg" data-scroll={scroll ? '' : undefined} role="tablist" aria-label={ariaLabel}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={on}
            className="mseg-item"
            data-on={on ? '' : undefined}
            onClick={() => onChange(it.value)}
          >
            <span className="mseg-label">{it.label}</span>
            {/* 카운트는 정보성이다 — 행동요구(빨강)가 아니라 neutral. 빨간 숫자 배지는 멘션급 전용이다(06 §3-5). */}
            {it.count != null && <CountBadge count={it.count} tone="neutral" />}
          </button>
        );
      })}
    </div>
  );
}
