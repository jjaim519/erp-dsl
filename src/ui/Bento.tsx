'use client';
// Bento (배치 프리미티브) — 페이지 본문을 닫힌 격자로. 위젯(템플릿·유기체)이 정수 칸을 점유한다.
//  · 페이지 본문 ≡ bento: chrome은 AppShell+PageHeader 둘뿐, 그 아래 모든 배치는 이 격자. 템플릿에 종속되지 않는
//    순수 배치 도구(Stack·Group·Grid와 같은 층) — 어떤 페이지든 위젯을 직접 깔 수 있다.
//  · 창립 은유의 공간판(00 설계원리: iOS 홈 화면 = 유한한 틀 안의 선택) / 베이스 패턴 = Bento grid.
//  · **Bento의 본질 = 높이는 내용이 못 정한다.** 높이의 주인은 상수(흐름) 또는 뷰포트(작업면)이며, 위젯은 자기
//    본성에 맞는 닫힌 n×n footprint를 colSpan·rowSpan으로 *선택*한다. 그 선택만이 가변이고, 내용 증감·펼침/접힘은
//    격자를 1px도 못 움직인다(jitter 0).
//  · 2기하 체제(2026-07-27 확정): ① 흐름(기본) — 페이지가 세로 스크롤, 셀 높이 = ROW_UNIT 상수.
//    ② 작업면(fill) — 페이지 스크롤 0, 격자가 부모 잔여고(100%)를 받아 행을 minmax(0,1fr) 등분. 고정 px는
//    "화면 꽉 맞음"을 두 화면 크기에서 동시 만족 못 하므로, 템플릿이 갖던 viewport-fit 기하를 이 모드가 승계한다.
//    fill의 높이 공급은 바깥 배관(페이지 flex) 몫 — 부모가 auto면 내용 높이로 자연 강등된다.
//  · 내용이 footprint를 넘치면 위젯이 *내부에서* 처리(스크롤/요약) — Tile은 overflow:hidden으로 셀을 고정한다.
//  · [백로그] 흐름 모드 rowSpan 4~6 확장·ROW_UNIT 실측·모바일 reflow. raw CSS grid는 Calendar 7열과 동류의 명시 예외.
import type { ReactNode } from 'react';

type Columns = 2 | 3 | 4 | 6 | 12;
type Gap = 'sm' | 'md' | 'lg';
type GridProps = { columns?: Columns; gap?: Gap; fill?: boolean; children: ReactNode };
type TileProps = { colSpan?: number; rowSpan?: 1 | 2 | 3; children: ReactNode };

const ROW_UNIT = 140; // 흐름 모드 셀 한 칸 높이(px, 잠정 — 화면 검증 후 조정). 고정이라 내용으로 늘지 않는다.

function Bento({ columns = 12, gap = 'lg', fill = false, children }: GridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      ...(fill
        ? { gridAutoRows: 'minmax(0, 1fr)', height: '100%', minHeight: 0 }  // 작업면 — 행이 잔여고 등분
        : { gridAutoRows: `${ROW_UNIT}px` }),                               // 흐름 — 상수 셀
      gap: `var(--mantine-spacing-${gap})`,
    }}>
      {children}
    </div>
  );
}

// Tile은 footprint를 고정한다(overflow:hidden) — 내용이 넘치면 위젯이 내부에서 스크롤/요약.
function Tile({ colSpan = 1, rowSpan = 1, children }: TileProps) {
  return <div style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>{children}</div>;
}

Bento.Tile = Tile;
export { Bento };
