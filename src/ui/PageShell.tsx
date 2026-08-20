'use client';
// PageShell — AppShell 아래 «모든 화면»의 공통 골격. `AppShell + PageShell + Bento` 삼단의 가운데.
//
//  **왜 만드나 — 지금 페이지 층에 주인이 없는 것이 셋이다:**
//   ① 세로 배관 — `AppShell.Main`은 `minHeight:100vh` + 문서 스크롤이라 **잔여고를 못 흘린다.**
//     그래서 작업면(`Bento fill`) 화면은 소비처가 `height: calc(…)`를 손으로 잡아야 했다.
//   ② 세로 리듬 — `Page` 주석이 *"세로 리듬은 각 페이지가 자기 Stack으로 소유"*라고 위임해 둬서
//     페이지마다 gap이 갈릴 수 있었다.
//   ③ **「page 위엔 widget만」이 규율로만 있고 구조가 아니었다.** 지금 `<Page>` 안엔 `Card`든 뭐든 온다.
//
//  **왜 children이 아니라 `tiles` 배열인가 — children으론 «못 막는다».**
//   `<PageShell><Card/></PageShell>`을 타입으로 막으려고 `ReactElement<TileProps>`도,
//   원소 종류까지 지정한 `ReactElement<TileProps, typeof Tile>`도 시험해 봤는데 **둘 다 통과했다.**
//   JSX 표현식의 타입이 `JSX.Element = ReactElement<any, any>`라 무엇에든 대입되기 때문이다
//   (헌법 6이 말하는 «타입은 지도, 래퍼와 린트가 그물»의 정확한 사례 — 일부러 틀린 걸 넣어 확인했다, 02 §9-1).
//   배열은 다르다: 각 원소가 `{colSpan, rowSpan, content}`라 **본문에 타일 아닌 것이 설 자리가 없다.**
//   그리고 이게 「05 LayoutSpec」이 가려던 방향(`WidgetInstance[]`)의 한 걸음이기도 하다 —
//   좌표(x,y)와 위젯 타입 레지스트리는 아직 안 만든다(03 실용 경고: 화면을 다 알기 전에 프레임워크를 짜면 틀린다).
//
//  **`content`가 `ReactNode`인 것은 구멍이 아니다** — Modal `children`과 동형(방식 A)이다.
//   껍데기는 «타일 하나 = 위젯 하나»만 강제하고, 그 안이 무엇인지는 모른다. 규칙이 겨누는 것은
//   «페이지 본문의 구조»지 타일 속 내용물이 아니다(SummaryCard도 안이 Card다).
//
//  **탈출구는 안 만든다.** `PageShell.Free` 같은 예외 슬롯을 열면 모두가 그리로 가고 규칙이 다시
//   문서 문장으로 돌아간다 — 유동성은 «풍부한 닫힌 어휘»로 얻지 탈출구로 얻지 않는다.
//   격자로 표현이 안 되는 본문이 나오면 그건 **위젯을 잘못 나눴다는 신호**로 읽는다(03 §11-3).
//   `Page`(폭만 잡는 레이아웃 원자)는 폐기하지 않고 **전환 통로**로 남긴다 — 아직 안 옮긴 화면의 자리이고,
//   **새 화면은 PageShell만** 쓴다.
import type { ReactNode } from 'react';
import { Bento, type BentoColumns, type BentoGap, type BentoSpan, type BentoRowSpan } from './Bento';
import { PageHeader, type HeaderMeta } from './PageHeader';
import type { Action } from './_cells';

export type PageTile = {
  /** 배치가 바뀌어도 위젯 상태가 안 섞이게 하는 안정 키. 안 주면 순서가 키가 된다(재배치 시 상태 유실). */
  id?: string;
  colSpan?: BentoSpan;
  rowSpan?: BentoRowSpan;
  /** 위젯 하나. 껍데기는 안이 뭔지 모른다(Modal children 동형·방식 A). */
  content: ReactNode;
};

type PageShellProps = {
  title: string;
  meta?: HeaderMeta[];
  actions?: Action[];
  /** 컨트롤 스트립 — 검색·필터·전환탭. **격자 밖**이고 높이는 내용이 정한다(02 화면 해부도의 그 자리). */
  controls?: ReactNode;
  columns?: BentoColumns;
  gap?: BentoGap;
  /** 작업면 — 스크롤 0. 본문이 뷰포트 잔여고를 받는다(2-pane 저작 화면 등). */
  fill?: boolean;
  tiles: PageTile[];
};

export function PageShell({
  title, meta, actions, controls,
  columns = 12, gap = 'lg', fill = false, tiles,
}: PageShellProps) {
  return (
    <div
      style={{
        // 폭 — `Page`가 갖던 규율 그대로(1200 캡 + 중앙). 페이지별 오버라이드 없음.
        width: '100%', maxWidth: 'var(--page-max)', marginInline: 'auto',
        // 세로 리듬 — 헤더/스트립/본문 사이 간격을 **여기가** 소유한다(페이지마다 안 갈리게).
        display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-lg)',
        // 세로 배관 — 작업면일 때만. `--page-chrome`은 셸이 위아래로 먹는 여백(AppShell.Main padding)이고
        //  AppShell이 자기 값으로 깐다. 셸 밖에서 쓰면 기본 3rem(= lg×2)으로 근사한다.
        ...(fill ? { height: 'calc(100dvh - var(--page-chrome, 3rem))', minHeight: 0 } : null),
      }}
    >
      <PageHeader title={title} meta={meta} actions={actions} />
      {controls}
      {/* 본문 ≡ bento. 작업면이면 이 칸이 잔여고를 다 먹고 Bento가 그걸 행으로 등분한다. */}
      <div style={fill ? { flex: 1, minHeight: 0 } : undefined}>
        <Bento columns={columns} gap={gap} fill={fill}>
          {tiles.map((t, i) => (
            <Bento.Tile key={t.id ?? i} colSpan={t.colSpan} rowSpan={t.rowSpan}>
              {t.content}
            </Bento.Tile>
          ))}
        </Bento>
      </div>
    </div>
  );
}
