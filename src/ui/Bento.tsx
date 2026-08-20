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

// colSpan은 **12의 약수가 아니어도 된다.** 그 제한은 `Grid`(균등 분할) 규칙을 여기에 잘못 옮긴 것이었다 —
//  Bento는 명시 좌표 모델이라 «똑같이 나누기»가 아니고, 8이 12를 안 나눠도 `8+4`로 완결된다.
//  그리고 8+4(본문+사이드 레일)·9+3(목록+필터)은 업무 화면에서 제일 흔한 쌍인데 약수 집합엔 없었다.
//  **닫힘은 격자가 아니라 «위젯이 선언하는 footprint 부분집합»에서 일어난다**(05 §2-1 `WidgetDef.footprints`).
//  즉 «어떤 폭이 존재하나」는 격자가 아니라 위젯이 정한다 — 여기 1~12는 그 선언이 놓일 좌표계일 뿐이다.
//  (Grafana도 같은 짜임이다: 격자는 w 1~24를 다 열고, 무엇을 쓸지는 패널이 정한다.)
type Span = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type TileProps = { colSpan?: Span; rowSpan?: 1 | 2 | 3; children: ReactNode };

// 흐름 모드 셀 한 칸 높이. **정의: 가장 작은 «자기완결 위젯»의 자연 높이를 8px 스냅한 값.**
//  (그래서 1×1이 «위젯 하나»라는 뜻을 갖는다 — Grafana식 30px 눈금과 갈리는 지점이다.)
//
//  **실측(2026-08-20, `/dev/grid` 실험대 · 12열 span3):**
//    SummaryCard 124px → 128 · SummaryCard(금액 없음) 99 → 104 · **Stat 139 → 144**
//  1×1은 이 중 «가장 큰 최소 위젯»을 담아야 하므로 **144**다. 140은 Stat과 1px 차이라 여유가 없었다.
//
//  ⚠ **px가 아니라 rem이다.** 폰트 스케일(루트 전역 줌)에서 위젯 내용은 rem이라 커지는데 칸이 px면
//    안 따라와서 **잘린다** — 「아주크게」(125%)에서 Stat이 173px이 되어 140px 칸을 33px 넘겼고,
//    Tile이 overflow:hidden이라 델타 칩이 잘려 나갔다(헤드리스 캡처로 확인). 9rem이면 144→180으로
//    같은 비율로 따라온다. `fontscale.css`가 "고정 높이 밴드는 텍스트보다 충분히 커 안 잘린다"고
//    적어 둔 가정의 첫 반례다.
//
//  실험대가 후보를 갈아 끼울 수 있게 **CSS 변수로 한 겹 뺀다** — 공개 prop은 안 연다(헌법 5).
//  소비처엔 이 변수가 존재하지 않는 것과 같다.
const ROW_UNIT = '9rem';   // 144px @ 루트 16

function Bento({ columns = 12, gap = 'lg', fill = false, children }: GridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      ...(fill
        ? { gridAutoRows: 'minmax(0, 1fr)', height: '100%', minHeight: 0 }  // 작업면 — 행이 잔여고 등분
        : { gridAutoRows: `var(--bento-row, ${ROW_UNIT})` }),             // 흐름 — 상수 셀
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
