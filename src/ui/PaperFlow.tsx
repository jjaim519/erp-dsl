'use client';
// PaperFlow (레이아웃 원자) — **길이가 데이터로 정해지는 서류.** `PaperSheet`의 형제다.
//
//  · 시트는 «장을 소비처가 나눈다»가 전제다(높이가 A4로 고정이라 넘치면 흐르는 게 아니라 잘린다).
//    그런데 계약서(약관 N개)·정산 명세서(품목 N행)처럼 **장을 셀 수 없는** 문서가 있다.
//    여기서는 폭·여백만 잡고 **높이를 내용에 맡긴다** — 쪽 나눔은 브라우저가 한다.
//
//  · ⚠ **여백이 이 부품의 전부다.** 흐르는 요소에 `padding`을 주면 여백은 «흐름 전체»의 위아래,
//    즉 첫 장 위와 마지막 장 아래에만 걸린다 — **2쪽부터 글이 종이 가장자리에 붙는다**(실측: 위 0px).
//    `@page { margin }`으로 주면 쪽마다 걸리지만 그 자리가 곧 브라우저 머리말·꼬리말 자리라
//    URL·날짜·쪽번호가 인쇄된다(실측: 찍힌다. 가구 발주서가 모달을 떠난 이유가 이것이다).
//    **쪽마다 반복되는 것은 표의 머리·꼬리 그룹뿐이다.** 그래서 내용을 표 한 칸에 담고
//    빈 `thead`/`tfoot`으로 위아래 자리를 예약한다(실측: 1쪽 60px · 2쪽 59px · 머리말 없음).
//    좌우는 표 바깥의 `padding`이 맡는다 — 가로 여백은 쪽이 바뀌어도 같은 상자라 그냥 걸린다.
//
//  · 표가 한 겹 들어가지만 소비처는 그 안을 모른다. **보이는 계약은 `<PaperFlow>` 하나**다.
import './paper.css';
import { useContext, type ReactNode } from 'react';
import { PAPER_CANON, PAPER_MARGIN, type PaperOrientation } from '../schema/paper';
import { PaperSheetContext } from './PaperSheet';

type Props = {
  /** 문맥(DocModal)이 정한 방향을 덮어쓴다. 모달 밖에서 쓸 때만 적는다. */
  orientation?: PaperOrientation;
  /**
   * 종이 안쪽 여백. 기본 15mm(`PAPER_MARGIN` — 서식 문서와 같은 값).
   * 수는 인쇄 좌표계 px(794×1123 캔버스), 문자열은 CSS 길이(`'10mm'`).
   * **화면 px과 인쇄 mm이 같은 자다** — 캔버스가 96dpi라 210mm = 794px이 정확히 성립한다.
   */
  margin?: number | string;
  children?: ReactNode;
};

export function PaperFlow({ orientation, margin = PAPER_MARGIN, children }: Props) {
  const ctx = useContext(PaperSheetContext);
  const canon = PAPER_CANON[orientation ?? ctx];
  const m = typeof margin === 'number' ? `${margin}px` : margin;
  return (
    <div
      className="erpPaperFlow"
      /* minHeight — 짧은 문서도 화면에선 «한 장»으로 보이게. 인쇄에선 푼다(빈 장이 붙는다). */
      style={{ width: canon.w, minHeight: canon.h, paddingInline: m }}
    >
      <table>
        {/* 쪽마다 반복되는 빈 자리 = 위아래 여백. 내용은 딱 한 칸에 들어간다. */}
        <thead><tr><td style={{ height: m }} /></tr></thead>
        <tbody><tr><td>{children}</td></tr></tbody>
        <tfoot><tr><td style={{ height: m }} /></tr></tfoot>
      </table>
    </div>
  );
}

/**
 * 쪽 경계에서 **쪼개지면 안 되는 덩어리**(조항 한 개·서명란·작은 표).
 * 표의 `tr`과 이미지는 `PaperFlow`가 이미 기본으로 안 쪼갠다 — 여기 감쌀 건 그 밖의 덩어리다.
 * ⚠ 남발하면 쪽 끝에 큰 빈자리가 생긴다(덩어리가 통째로 다음 장으로 밀린다).
 */
export function PaperKeep({ children }: { children?: ReactNode }) {
  return <div className="erpPaperKeep">{children}</div>;
}
