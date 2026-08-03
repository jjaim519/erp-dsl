'use client';
// MobileSection (분자) — 모바일 화면의 내용 묶음. 제목(선택) + 자유 슬롯 + 위아래 헤어라인 경계.
//  · 면·그림자를 쓰지 않는다(MobileShell 체계). 묶음은 *카드*가 아니라 *경계선*이 만든다.
//    근거: **M3**가 "여백·구분선으로 더 단순한 위계가 되면 카드에 넣지 마라 / compact에서는 카드를
//    리스트로"라고 명문화했고, TDS도 `Border`를 코어 부품으로 두고 ListRow/ListHeader로 세웠다.
//    ⚠ 이전 판의 "iOS HIG가 inset grouped를 말린다"는 **현행 HIG에서 확인 실패**해 철회한다(근거만 교체).
//  · children은 raw ReactNode 슬롯 — 안에 뭐가 들었는지 모른다(Modal children·BoardView content 동형).
//    텍스트·아이콘·배지 뭘 넣든 소비처가 조립한다.
//  · flush: 행(MobileListRow)처럼 좌우 끝까지 닿아야 하는 내용이면 켠다. 기본은 여백 있음(자유 콘텐츠 기준).
//  · 내용이 없으면 **본문을 아예 안 그린다** — 제목+액션만 있는 섹션(예: 첨부 0건)이 빈 여백 블록을
//    남기면 "여기 뭔가 있어야 하는데 비었다"로 읽힌다. 빈 상태는 EmptyState가 *말할 때* 쓰는 것이고,
//    아무 말도 없을 땐 자리 자체가 없는 게 맞다.
import { Children, type ReactNode } from 'react';
import './mobilelist.css';

type Props = {
  title?: string;      // 섹션 제목(TDS ListHeader 자리). 없으면 제목 줄 자체를 렌더하지 않는다.
  headingLevel?: 2 | 3; // 제목의 heading 단계. 기본 3 — 화면 제목(MobileTop)이 h2 자리를 갖는 전제.
                        //  스크린리더 사용자는 heading을 타고 화면을 훑는다. 제목이 <span>이면 그 목록에
                        //  아무것도 안 잡혀 **제목 탐색이 통째로 죽는다**(06 §1, 접근성 구멍).
                        //  단계를 닫힌 두 값으로만 연다 — 열어두면 소비처마다 계층이 어긋난다(헌법 5).
  action?: ReactNode;  // 제목 우측 보조(‘전체보기’·‘＋ 첨부’ 등). CTA 자리는 아니다 — CTA는 셸 하단 고정.
                       //  액션이 있으면 헤더가 *대칭 행*으로 바뀐다(아래 data-action):
                       //  캡션 헤더의 기본 여백은 위 lg(24)/아래 xs(8)로 일부러 비대칭인데(자기 본문에 붙으라고),
                       //  거기 44px 컨트롤이 들어가면 그 비대칭을 뒤집어써 위18/아래9로 보인다(실화면 지적).
  flush?: boolean;     // true=본문 좌우 여백 0(행이 끝까지 닿음). 기본 false=여백 있음(자유 콘텐츠).
  children: ReactNode;
};

export function MobileSection({ title, action, flush = false, headingLevel = 3, children }: Props) {
  // 빈 배열·false·null은 "내용 없음"이다(조건부 렌더의 흔한 산출물). 그때는 본문 div 자체를 안 만든다.
  const hasBody = Children.toArray(children).length > 0;
  const H = (headingLevel === 2 ? 'h2' : 'h3') as 'h2' | 'h3';
  return (
    <section className="mls">
      {(title || action) && (
        <div className="mls-hd" data-action={action ? '' : undefined}>
          {/* 시맨틱은 heading, 생김새는 캡션 그대로(.mls-hd-t가 크기·굵기·색을 정한다).
              브라우저 기본 h3 여백은 CSS에서 0으로 눕힌다 — 형태는 하나도 안 바뀐다. */}
          {title && <H className="mls-hd-t">{title}</H>}
          {action && <span className="mls-hd-a">{action}</span>}
        </div>
      )}
      {hasBody && <div className={flush ? 'mls-body flush' : 'mls-body'}>{children}</div>}
    </section>
  );
}
