'use client';
// MobileTop (분자) — 화면 제목 영역. 데스크탑 PageHeader에서 *우측 CTA를 뗀* 자리.
//  · 셸이 아니라 *화면*이 소유한다. 상단이 두 층이라는 TDS 구분을 그대로 따른다:
//    Navigation(셸 크롬 — 뒤로·아이콘 액션) / Top(화면 제목). 그래서 이 부품엔 액션 슬롯이 없다.
//    행동이 필요하면 셸의 하단 고정 CTA가 받는다(모바일에서 CTA는 헤더 우측이 아니다).
//  · **제목뿐이다 — 보조 설명 슬롯을 두지 않는다.** 화면 제목 밑에 붙는 설명문은 거의 항상 군더더기라
//    자리를 열어두면 채우게 된다. 설명이 필요한 내용이면 본문 섹션이 갖는다(제목의 일이 아니다).
import { Title } from './Title';
import './mobilelist.css';

type Props = { title: string };

export function MobileTop({ title }: Props) {
  return (
    <div className="mtop">
      <Title variant="heading">{title}</Title>
    </div>
  );
}
