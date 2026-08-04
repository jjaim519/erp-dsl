// Badge 원자 — 표시 전용(행동 없음). primary 제외(브랜드색은 상태 아님).
//  상태 사다리의 **3단**이다(면 있음). 1·2단(면 없음)은 StatusLabel이 맡는다 — 그쪽 주석에 사다리 전문.
//  이 부품은 *드물게 나타나는 것*에 쓴다. 모든 행에 배지가 달리면 배지가 신호이길 그만둔다.
import { Badge as MantineBadge } from '@mantine/core';

type BadgeColor = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

// 강약 축 — 알약끼리도 위계가 있어야 한다.
//  이 축이 없어서 실제로 무슨 일이 있었나: Badge가 light 하나로 못박혀 있으니 솔리드가 필요해진
//  게시판이 board.css 안에 .board-notice·.board-must·.board-new 세 클래스를 따로 팠다(v0.72.0에서 회수).
//  같은 신호를 다른 화면이 내려면 또 파야 했다 — 축 하나를 안 열어서 생긴 값이다.
//   · weak(기본) — 톤만. 평상시.  · fill — 반전. "여기 좀 봐"(필독·공지·NEW).
type BadgeStrength = 'weak' | 'fill';

type BadgeProps = {
  color?: BadgeColor;
  strength?: BadgeStrength;
  children: string;
};

const VARIANT: Record<BadgeStrength, string> = { weak: 'light', fill: 'filled' };

export function Badge({ color = 'neutral', strength = 'weak', children }: BadgeProps) {
  // Mantine 루트는 width:fit-content + overflow:hidden — 좁은 칸(예: grow 열 옆 표 셀)에서 자기 내용보다 작게 줄며 잘린다.
  //  min-width:max-content로 *내용폭 밑으로는 안 줄게* 한다(상태 배지는 짧아 항상 전체 노출이 맞음 → 표가 열 min-content를 제대로 계산).
  return (
    <MantineBadge color={color} variant={VARIANT[strength]} radius="sm" style={{ minWidth: 'max-content' }}>
      {children}
    </MantineBadge>
  );
}
