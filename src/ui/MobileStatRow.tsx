'use client';
// MobileStatRow (분자) — 모바일 KPI 행. 지표 2~4개를 균등 분할하고 세로 헤어라인으로 나눈다.
//  · 데스크탑 `Stat`·`SummaryCard`는 *카드 면* 위에 얹히는 물건이라 모바일 체계(면·그림자 없음)에 못 쓴다.
//    여기선 묶음을 만드는 게 면이 아니라 선이다 — 항목 사이 세로선 하나가 전부.
//  · 값은 포맷된 문자열을 받는다(패키지는 숫자 포맷·통화 규칙을 모른다 — 도메인은 소비처).
//  · onClick을 주면 그 칸만 눌린다(보통 해당 조건으로 걸러진 목록으로 이동). 안 주면 정적 표시.
//  · 항목 수는 2~4 권장 — 폰 폭 375에서 4칸이면 칸당 ~90px이라 값이 길면 줄바꿈된다(소비처가 추려서 준다).
import './mobilelist.css';

export type MobileStatItem = {
  label: string;
  value: string;                                          // 포맷된 표시값
  sub?: string;                                           // 델타·보조("전월 대비 +12%")
  tone?: 'neutral' | 'success' | 'warning' | 'danger';    // sub 색 역할(기본 neutral)
  onClick?: () => void;
};

type Props = { items: MobileStatItem[] };

export function MobileStatRow({ items }: Props) {
  return (
    <div className="mst">
      {items.map((it, i) => {
        const inner = (
          <>
            <span className="mst-label">{it.label}</span>
            <span className="mst-value">{it.value}</span>
            {it.sub && <span className="mst-sub" data-tone={it.tone ?? 'neutral'}>{it.sub}</span>}
          </>
        );
        return it.onClick ? (
          <button key={i} type="button" className="mst-item" onClick={it.onClick}>{inner}</button>
        ) : (
          <div key={i} className="mst-item">{inner}</div>
        );
      })}
    </div>
  );
}
