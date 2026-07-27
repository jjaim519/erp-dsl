'use client';
// MobileTop (분자) — 화면 제목 영역. 데스크탑 PageHeader에서 *우측 CTA를 뗀* 자리.
//  · 셸이 아니라 *화면*이 소유한다. 상단이 두 층이라는 TDS 구분을 그대로 따른다:
//    Navigation(셸 크롬 — 뒤로·아이콘 액션) / Top(화면 제목).
//  · **보조 설명 슬롯은 두지 않는다.** 화면 제목 밑에 붙는 설명문은 거의 항상 군더더기라
//    자리를 열어두면 채우게 된다. 설명이 필요한 내용이면 본문 섹션이 갖는다(제목의 일이 아니다).
//  · action은 *진입* 액션 자리다(‘글쓰기’처럼 다른 화면으로 가는 것). 화면의 **커밋 액션**(등록·요청)은
//    여전히 셸 하단 고정이 받는다 — 둘은 역할이 달라 경쟁 경로가 아니다. 그래서 여기 텍스트 버튼을 두면서도
//    하단 CTA는 그대로 둔다. 전용 행을 만들지 않고 제목 줄에 얹는 이유: 진입 하나에 한 행을 쓰면 낭비다.
import { Title } from './Title';
import { renderAction, type Action } from './_cells';
import './mobilelist.css';

type Props = {
  title: string;
  action?: Action;   // 진입 액션(보통 primary 텍스트 버튼). 커밋 액션은 셸 하단이 받는다.
};

export function MobileTop({ title, action }: Props) {
  return (
    <div className="mtop">
      <Title variant="heading">{title}</Title>
      {action && <span className="mtop-action">{renderAction(action, 0, 'sm')}</span>}
    </div>
  );
}
