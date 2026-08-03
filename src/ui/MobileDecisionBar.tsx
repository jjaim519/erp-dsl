'use client';
// MobileDecisionBar (분자) — 결재·승인 화면의 하단 결정 바. MobileShell의 `bottom` 슬롯에 꽂는다.
//
//  왜 부품인가: 결재는 "읽고 → 결정"이 한 화면에서 끝나고, 그 결정 버튼이 **문서 길이와 무관하게 같은 자리**에
//   있어야 한다(06 §2-3 위치 불변성). 연속 20건을 처리할 때 그 불변성이 곧 속도다.
//   MobileComposer가 같은 슬롯에 사는 형제다 — 그건 입력, 이건 결정.
//
//  구조가 규율을 강제한다(주석으로 적힌 상한은 지켜지지 않는다 — MobileShell.actions에서 배운 것):
//   · `primary` 하나뿐 = **강조 버튼은 페이지당 1개**(SAP 명문 · 06 §4). 타입에 둘째 강조 자리가 없다.
//   · `secondary` 하나 = 인라인은 최대 둘. 06 §4의 "인라인 액션 상한 3"보다 더 좁게 잡았다 —
//     폰 하단 한 줄에 셋을 나란히 두면 각 표적이 44pt 아래로 내려간다.
//   · 나머지는 `more` → ⋯ 메뉴. Workday 모바일이 Approve만 하단에 두고 Deny·Send Back을 More로 내린 형태.
//
//  **액션 시트를 쓰지 않는다** — 버튼만 든 시트는 만들지 않기로 확정했다(06 §2-2). 오버플로는 Menu다.
import { Menu } from './Menu';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { Icon } from './Icon';
import type { Action } from './_cells';
import './mobilelist.css';

type Props = {
  primary: Action;        // 커밋(승인·제출). 강조 1개는 여기서 소진된다.
  secondary?: Action;     // 대안(반려·보류). 강조가 아니다.
  more?: Action[];        // ⋯ 메뉴. 인라인에 셋째를 두지 않는다.
  moreLabel?: string;     // 메뉴 트리거의 접근성 이름(기본 '더보기')
  disabled?: boolean;     // 처리 중 등 — 결정 전체를 잠근다(부분 잠금은 안 연다: 애매한 상태를 만든다)
};

export function MobileDecisionBar({ primary, secondary, more, moreLabel = '더보기', disabled = false }: Props) {
  return (
    <div className="mdb">
      {secondary && (
        <Button variant="secondary" size="md" fullWidth disabled={disabled} onClick={secondary.onClick}>
          {secondary.label}
        </Button>
      )}
      {/* 강조는 항상 우측 — 손이 닿는 쪽에 커밋을 둔다. 좌우 순서를 소비처가 못 바꾼다(경쟁 경로 방지). */}
      <Button variant="primary" size="md" fullWidth disabled={disabled} onClick={primary.onClick}>
        {primary.label}
      </Button>
      {more && more.length > 0 && (
        <Menu
          position="top"
          align="end"
          trigger={<IconButton icon="dots-vertical" label={moreLabel} variant="ghost" size="md" onClick={() => {}} />}
          items={more}
        />
      )}
    </div>
  );
}
