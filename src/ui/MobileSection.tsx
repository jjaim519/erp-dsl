'use client';
// MobileSection (분자) — 모바일 화면의 내용 묶음. 제목(선택) + 자유 슬롯 + 위아래 헤어라인 경계.
//  · 면·그림자를 쓰지 않는다(MobileShell 체계). 묶음은 *카드*가 아니라 *경계선*이 만든다.
//    근거: iOS HIG가 inset grouped(둥근 카드 묶음)를 "compact 폭, 특히 현지화 콘텐츠에서 텍스트
//    줄바꿈을 유발한다"며 말리고, TDS도 `Border`를 코어 부품으로 두고 ListRow/ListHeader로 세웠다.
//  · children은 raw ReactNode 슬롯 — 안에 뭐가 들었는지 모른다(Modal children·BoardView content 동형).
//    텍스트·아이콘·배지 뭘 넣든 소비처가 조립한다.
//  · flush: 행(MobileListRow)처럼 좌우 끝까지 닿아야 하는 내용이면 켠다. 기본은 여백 있음(자유 콘텐츠 기준).
import type { ReactNode } from 'react';
import './mobilelist.css';

type Props = {
  title?: string;      // 섹션 제목(TDS ListHeader 자리). 없으면 제목 줄 자체를 렌더하지 않는다.
  action?: ReactNode;  // 제목 우측 보조(‘전체보기’ 등). 텍스트 CTA 자리가 아니다 — CTA는 셸 하단 고정.
  flush?: boolean;     // true=본문 좌우 여백 0(행이 끝까지 닿음). 기본 false=여백 있음(자유 콘텐츠).
  children: ReactNode;
};

export function MobileSection({ title, action, flush = false, children }: Props) {
  return (
    <section className="mls">
      {(title || action) && (
        <div className="mls-hd">
          {title && <span className="mls-hd-t">{title}</span>}
          {action && <span className="mls-hd-a">{action}</span>}
        </div>
      )}
      <div className={flush ? 'mls-body flush' : 'mls-body'}>{children}</div>
    </section>
  );
}
