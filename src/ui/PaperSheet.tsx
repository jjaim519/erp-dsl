'use client';
// PaperSheet (원자) — **종이 한 장.** 손으로 그린 문서를 `DocModal`에 넣을 때 각 장을 이걸로 감싼다.
//  · 하는 일은 «한 장 = 시트 하나»라는 인쇄 계약을 소비처가 **클래스 문자열을 베끼지 않고** 지키게 하는 것뿐이다.
//    `.erpPaperSheet`가 부품 안에만 있으면 소비처는 그 이름을 복사할 수밖에 없고, 그 순간 클래스 이름이
//    사실상 공개 API가 되어 우리가 못 바꾼다. 그래서 **이름 대신 부품을 내보낸다.**
//  · 시트가 소유하는 것: 폭·높이(A4 캔버스) · 안쪽 여백 · 바탕 · 그림자 · **쪽 나눔**(paper.css의 break-after).
//    소비처가 소유하는 것: 그 안을 어떻게 그리나. 이 경계가 `PaperDoc`(서식으로 그린 장)과 정확히 같아서
//    **두 종류의 문서가 같은 인쇄 경로를 탄다.**
//  · 방향은 보통 `DocModal`이 문맥으로 흘려준다 — 장마다 다시 적게 하지 않는다(한 문서 안에서 방향이
//    갈리면 `@page` 하나로는 못 찍는다). 문서 전용 라우트처럼 모달 밖에서 쓸 때만 직접 적는다.
import './paper.css';
import { createContext, useContext, type ReactNode } from 'react';
import { PAPER_CANON, PAPER_MARGIN, type PaperOrientation } from '../schema/paper';

/** DocModal → PaperSheet. 공개 API가 아니라 **한 문서 안의 방향**을 나르는 통로다. */
export const PaperSheetContext = createContext<PaperOrientation>('portrait');

type Props = {
  /** 문맥(DocModal)이 정한 방향을 덮어쓴다. 모달 밖에서 쓸 때만 적는다. */
  orientation?: PaperOrientation;
  children?: ReactNode;
};

export function PaperSheet({ orientation, children }: Props) {
  const ctx = useContext(PaperSheetContext);
  const canon = PAPER_CANON[orientation ?? ctx];
  return (
    <div
      className="erpPaperSheet"
      /* 여백을 **인라인이 아니라 여기서** 주는 이유: 값의 주인이 schema(PAPER_MARGIN)라
         서식으로 그린 장(PaperDoc의 격자 inset)과 한 수를 쓴다 — 회사 서류의 여백이 한 값이 된다. */
      style={{ width: canon.w, height: canon.h, padding: PAPER_MARGIN }}
    >
      {children}
    </div>
  );
}
