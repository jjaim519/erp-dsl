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
import { renderAction, type Action } from './_cells';
import './mobilelist.css';

type Props = {
  title: string;
  meta?: string;         // 아래 줄 보조 정보(작성자·날짜 등 — 포맷은 소비처)
  leading?: ReactNode;   // 좌측 슬롯(아바타·아이콘·썸네일)
  badges?: ReactNode;    // 제목 위 배지 줄
  trailing?: ReactNode;  // 우측 값(금액·상태 등). chevron과 함께 놓인다.
  onClick?: () => void;  // 있으면 버튼 + chevron
  emphasis?: boolean;    // 제목 강조 — "아직 안 본 것"(안 읽은 글·새 알림). 아래 참조
  // 안 읽음 점. **emphasis와 합치지 않는다** — 항상 같이 켜지지 않기 때문이다:
  //  게시판은 공지 행을 굵게(emphasis) 두면서 점은 안 찍는다(공지는 이미 다른 신호를 갖는다).
  //  둘을 하나로 묶으면 그 구분을 표현할 수 없다.
  //  · 모양은 부품이 소유한다(전엔 소비처가 leading에 raw로 점을 넣어 목록마다 갈릴 수 있었다).
  //  · 이건 축이 다르다: 진행·대기·완료는 *대상의 상태*고, 안 읽음은 *나와 대상의 관계*다.
  //    사람마다 다르게 보이고 누르는 순간 사라진다 — 그래서 자리도 trailing이 아니다(06 §3-7).
  unread?: boolean;
  // ── 일괄 처리(선택 모드) ──
  //  **모드의 주인은 화면(소비처)이다.** 행은 자기가 선택됐는지만 안다 — 선택 모드가 켜졌는지,
  //  몇 개 골랐는지, 무엇을 실행하는지는 전부 화면의 일이다(행이 알면 목록마다 규칙이 갈린다).
  //  · selectable이 켜지면 좌측에 체크가 서고 **chevron은 사라진다** — 이제 행을 눌러도 안 들어가고
  //    선택만 되기 때문이다. 같은 표적이 두 가지로 동작하면 손가락이 어느 쪽인지 알 수 없다.
  //  · 노출 조건을 부품이 정하지 않는다: 소비처가 켜고 끈다(길게 누르기든 상단 '선택' 액션이든).
  //    다만 **제스처가 유일 경로여선 안 된다**(06 §1-4) — 상단 액션을 반드시 함께 두는 건 화면의 책임이다.
  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (next: boolean) => void;
  // ── 그 자리 액션 ──
  //  selectable(일괄, 나중에 한꺼번에)과 다르다 — 이건 *이 행 하나*를 지금 처리한다.
  //  **상한 2를 타입에 못박는다**(MobileShell.actions와 같은 판단): 제목·메타가 이미 폭을 쓰므로
  //  행 안에서는 2가 실질 상한이고, 주석으로 적은 상한은 지켜지지 않는다.
  //  기제는 MobileFileRow.onOpen이 v0.67.0에서 쓴 것과 같다 — 버튼 안에 버튼을 못 넣으므로
  //  행이 컨테이너가 되고 [본체 | 액션]이 형제로 선다(data-split). 두 행 부품이 같은 CSS를 쓴다.
  //  · selectable이 켜지면 액션은 사라진다. 그 순간 행의 일은 "지금 처리"가 아니라 "고르기"다.
  //  · **chevron도 사라진다.** 진입 표적이 본체로 좁아졌는데 꺽쇠를 오른쪽 끝에 두면
  //    액션 버튼 너머를 가리켜 아무 데도 안 데려간다(거짓 어포던스 금지 — 이 부품 머리말).
  actions?: readonly [Action] | readonly [Action, Action];
};

// emphasis: 목록에서 *아직 처리·확인하지 않은 행*을 굵기로 들어올린다(메일·게시판의 안 읽음 관습).
//  색이 아니라 굵기인 이유: 폰 목록은 이미 배지·태그로 색이 붐비고, 굵기는 그 위에 겹쳐도 안 싸운다.
//  기본 false — 안 주면 모든 행이 같은 무게다(강조가 기본이면 강조가 아니게 된다).
export function MobileListRow({
  title, meta, leading, badges, trailing, onClick, emphasis = false, unread = false,
  selectable = false, selected = false, onSelectedChange, actions,
}: Props) {
  // 액션은 선택 모드에 자리를 내준다 — 고르는 중에 개별 처리를 열어두면 두 흐름이 겹친다.
  const acts = !selectable && actions && actions.length > 0 ? actions : null;
  // 점은 자리가 둘이다: leading이 있으면 그 모서리, 없으면 제목 앞. 선택 모드에선 안 찍는다
  //  — 그 순간 행의 일은 "읽기"가 아니라 "고르기"고, 체크 옆의 점은 선택 상태로 오독된다.
  const showDot = unread && !selectable;
  // 두 자리 모두 **같은 요소**를 쓴다 — 자리마다 다른 요소로 그리면 낭독 문구가 둘로 갈린다.
  //  role="img"가 있어야 aria-label이 읽힌다(라벨만 붙인 span은 낭독기가 건너뛴다).
  const dot = <span className="mlr-dot" role="img" aria-label="안 읽음" />;
  const inner = (
    <>
      {/* 선택 모드에서는 체크가 leading 자리를 대신한다 — 둘을 나란히 두면 좌측이 붐비고
          "무엇을 누르는 행인지"가 흐려진다(썸네일은 선택 중 잠시 안 보여도 정보를 안 잃는다). */}
      {selectable ? (
        <span className="mlr-check" data-on={selected ? '' : undefined} aria-hidden>
          {selected && <Icon name="check" size="sm" />}
        </span>
      ) : (
        leading && <span className="mlr-lead">{leading}{showDot && dot}</span>
      )}
      <span className="mlr-body">
        {badges && <span className="mlr-badges">{badges}</span>}
        <span className="mlr-title" data-emphasis={emphasis ? '' : undefined}>
          {/* leading이 없으면 점이 제목 *안에* 산다 — 밖의 슬롯이면 예약(빈 칸)이냐
              미예약(정렬 깨짐)이냐를 골라야 한다. 제목 안이면 둘 다 안 생긴다. */}
          {showDot && !leading && dot}
          {title}
        </span>
        {meta && <span className="mlr-meta">{meta}</span>}
      </span>
      {trailing && <span className="mlr-trail">{trailing}</span>}
      {/* chevron은 *진입*의 신호다. 선택 모드에선 행이 진입을 안 하므로 지우고,
          액션이 있으면 진입 표적이 본체로 좁아져 오른쪽 끝의 꺽쇠가 아무 데도 안 데려간다. */}
      {onClick && !selectable && !acts && <span className="mlr-chev"><Icon name="chevron-right" size="sm" color="secondary" /></span>}
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className="mlr"
        role="checkbox"
        aria-checked={selected}
        data-selected={selected ? '' : undefined}
        onClick={() => onSelectedChange?.(!selected)}
      >
        {inner}
      </button>
    );
  }

  // 액션이 있으면 행이 *컨테이너*가 된다 — 버튼 안에 버튼을 넣을 수 없기 때문.
  //  [본체(진입) | 액션]이 형제로 서고 패딩은 각자가 갖는다. MobileFileRow.onOpen과 같은 기제·같은 CSS.
  if (acts) {
    return (
      <div className="mlr" data-split>
        {onClick
          ? <button type="button" className="mlr-main" onClick={onClick}>{inner}</button>
          : <span className="mlr-main">{inner}</span>}
        <span className="mlr-acts">{acts.map((a, i) => renderAction(a, i, 'sm'))}</span>
      </div>
    );
  }

  return onClick ? (
    <button type="button" className="mlr" onClick={onClick}>{inner}</button>
  ) : (
    <div className="mlr">{inner}</div>
  );
}
