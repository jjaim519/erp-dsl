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
//   정본이 같은 구분을 다른 이름으로 갖는다 — iOS: "탭 바는 '앱의 어디에 있나', 세그먼티드 컨트롤은
//   '이 화면의 어느 버전인가'에 답한다" / M3: primary tabs(앱 목적지) vs **secondary tabs**(콘텐츠 영역 내 갈래).
//   우리 하단 탭바가 primary니까 여기는 secondary tabs 자리다. 같은 화면에 둘이 공존하므로 신호가
//   겹치면 안 된다 — 탭바는 아이콘+틴트 알약, 여기는 텍스트+밑줄.
//
//  **왜 iOS 세그먼티드 컨트롤(채운 알약)이 아닌가**: 그 컨트롤은 카운트 배지를 달 수 없다.
//   결재함은 "대기 3 / 처리 12"가 핵심 정보다. M3 탭은 배지를 명시적으로 지원한다 → 밑줄 탭이 맞다.
//
//  **균등/스크롤을 prop으로도, 개수로도 정하지 않는다 — 내용이 정한다.**
//   전에는 "3개 이하 균등 / 4개 이상 스크롤"로 개수 분기를 했는데 그게 임의 판단이었다.
//   M3의 실제 기준은 개수가 아니라 **라벨 길이**다("4 with short labels"까지 고정 허용).
//   결재함 라벨은 2글자라 375px에 5개도 들어간다. → flex-grow는 열되 flex-shrink를 막으면
//   들어갈 땐 나눠 갖고 넘칠 땐 스크롤한다(CSS 한 줄이 판정한다. 매직넘버 0).
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
  return (
    <div className="mseg" role="tablist" aria-label={ariaLabel}>
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
