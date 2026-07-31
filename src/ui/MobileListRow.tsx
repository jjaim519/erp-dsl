'use client';
// MobileListRow (분자) — 모바일 목록의 행 하나. 누르면 *다른 화면으로 이동*하는 탐색형.
//  · 구분은 행 하단 헤어라인 하나뿐(면·그림자 없음 — MobileShell 체계). 마지막 행의 선은 섹션이 지운다.
//  · onClick을 주면 버튼이 되고 우측에 chevron(iOS disclosure indicator 관습)이 붙는다.
//    안 주면 정적 행 — 눌리는 것처럼 보이지 않는다(거짓 어포던스 금지).
//  · 최소 높이 44px — Apple HIG 최소 터치타깃 44×44pt. 내용이 짧아도 이 아래로 안 내려간다.
//  · badges/leading/trailing은 raw 슬롯 — 어떤 배지를 쓸지, 우측에 무엇을 둘지는 도메인이라 소비처가 정한다.
//    (이 부품은 "발주"도 "공지"도 모른다 — 헌법 1)
//  · 펼침형(그 자리에서 열림)은 이 부품이 아니다 — 행동이 다르므로 별도 named 부품으로 간다.
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import './mobilelist.css';

type Props = {
  title: string;
  meta?: string;         // 아래 줄 보조 정보(작성자·날짜 등 — 포맷은 소비처)
  leading?: ReactNode;   // 좌측 슬롯(아바타·아이콘·썸네일)
  badges?: ReactNode;    // 제목 위 배지 줄
  trailing?: ReactNode;  // 우측 값(금액·상태 등). chevron과 함께 놓인다.
  onClick?: () => void;  // 있으면 버튼 + chevron
  emphasis?: boolean;    // 제목 강조 — "아직 안 본 것"(안 읽은 글·새 알림). 아래 참조
};

// emphasis: 목록에서 *아직 처리·확인하지 않은 행*을 굵기로 들어올린다(메일·게시판의 안 읽음 관습).
//  색이 아니라 굵기인 이유: 폰 목록은 이미 배지·태그로 색이 붐비고, 굵기는 그 위에 겹쳐도 안 싸운다.
//  기본 false — 안 주면 모든 행이 같은 무게다(강조가 기본이면 강조가 아니게 된다).
export function MobileListRow({ title, meta, leading, badges, trailing, onClick, emphasis = false }: Props) {
  const inner = (
    <>
      {leading && <span className="mlr-lead">{leading}</span>}
      <span className="mlr-body">
        {badges && <span className="mlr-badges">{badges}</span>}
        <span className="mlr-title" data-emphasis={emphasis ? '' : undefined}>{title}</span>
        {meta && <span className="mlr-meta">{meta}</span>}
      </span>
      {trailing && <span className="mlr-trail">{trailing}</span>}
      {onClick && <span className="mlr-chev"><Icon name="chevron-right" size="sm" color="secondary" /></span>}
    </>
  );

  return onClick ? (
    <button type="button" className="mlr" onClick={onClick}>{inner}</button>
  ) : (
    <div className="mlr">{inner}</div>
  );
}
