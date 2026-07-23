'use client';
// Popover 원자 — 클릭하면 떠오르는 플로팅 패널. Tooltip(hover·텍스트)의 형제이나
//  trigger가 클릭이고 content가 슬롯(부품)이라는 점이 다르다.
//  · content는 raw ReactNode 슬롯 — Modal children과 동형(방식 A: Popover는 안이 뭔지 모름).
//    안의 스타일 우회는 인지(부품만 조립)로 막고 hex는 eslint가 차단(강제 3층).
//  · position은 닫힌 enum(top/bottom/left/right, 기본 bottom). auto 제외 — "명시 top"과
//    "auto가 고른 top"이 경쟁 경로라서. 화면 끝 자동 뒤집기(flip)는 position과 별개 동작이라 상시 ON.
//  · width는 sm/md/lg/xl 토큰(Container 동형, px는 내부 매핑·잠정값) 또는 auto(내용폭 — 컬럼 수 따라 늘고 줆). 그림자·radius·화살표 고정.
//  · controlled(opened/onChange) 전용 — 상태 주인은 하나(횡단규칙 2와 동형).
import { Popover as M, type FloatingPosition } from '@mantine/core';
import type { ReactNode } from 'react';

type Position = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';
type Width = 'sm' | 'md' | 'lg' | 'xl' | 'auto';   // auto=내용폭(다단 컬럼이 컬럼 수만큼 늘고, 1컬럼이면 좁게)

type PopoverProps = {
  children: ReactNode;          // trigger(감쌀 대상)
  content: ReactNode;           // 떠오르는 패널 내용(@/ui 부품 — raw 슬롯, Modal children 동형)
  opened: boolean;              // controlled
  onChange: (opened: boolean) => void;
  position?: Position;          // 기본 bottom
  align?: Align;                // 축 위 정렬(기본 center). start=트리거 시작모서리에 맞춤(드롭다운형: bottom-start)
  width?: Width;                // 기본 md
  // 재배치 정책(기본 flip). 'fixed'=flip 끄고 shift만(화면 안 유지) → content 크기 변해도 화면 밖으로 안 나감.
  //  'anchored'=flip·shift 둘 다 끔 → 좌상단 앵커가 *완전 고정*, 내용은 오른쪽·아래로만 성장(점프 0). 다단 컬럼 증식용.
  reposition?: 'flip' | 'fixed' | 'anchored';
  // 트리거 폭. 기본 false=inline-flex(내용폭). true=block(width:100%·min-width:0) → 소비처 컨테이너 폭에 맞춰
  //  줄어들어 트리거 안 말줄임이 작동(예: MillerColumns 완료 브레드크럼). 다른 소비처는 기본값이라 불변.
  block?: boolean;
};

// width 토큰 → px(잠정값, 화면 검증에서 조정). Container SIZE와 같은 구조. auto는 내용폭(undefined → Mantine이 content 크기로).
const WIDTH_PX: Record<Exclude<Width, 'auto'>, number> = { sm: 200, md: 280, lg: 360, xl: 600 };

export function Popover({
  children, content, opened, onChange, position = 'bottom', align = 'center', width = 'md', reposition = 'flip', block = false,
}: PopoverProps) {
  // align=center면 측면 그대로(bottom), 아니면 '{측면}-{정렬}'(bottom-start 등) — 드롭다운형은 start로 시작모서리 정렬.
  const mPos = (align === 'center' ? position : `${position}-${align}`) as FloatingPosition;
  const mWidth = width === 'auto' ? undefined : WIDTH_PX[width];   // auto=내용폭(컬럼 수 따라 동적), 나머지=고정 px.
  // 재배치: fixed=flip off·shift on(화면 안 유지). anchored=flip·shift 둘 다 off(앵커 완전 고정, 오른쪽·아래로만 성장). 기본=Mantine flip+shift.
  const middlewares =
    reposition === 'fixed' ? { flip: false, shift: true }
      : reposition === 'anchored' ? { flip: false, shift: false }
        : undefined;
  return (
    <M
      opened={opened}
      onChange={onChange}
      position={mPos}
      middlewares={middlewares}
      width={mWidth}
      withArrow
      shadow="md"
      radius="md"
      withinPortal
    >
      <M.Target>
        {/* Target은 ref 가능한 단일 자식이 필요 → span으로 감싼다.
            controlled 모드에선 우리가 클릭으로 직접 토글한다(onChange). 바깥 클릭/ESC 닫기는
            Mantine이 onChange(false)로 알린다. */}
        <span
          role="button"
          onClick={() => onChange(!opened)}
          style={block
            ? { display: 'flex', width: '100%', minWidth: 0, cursor: 'pointer' }   // 소비처 폭에 맞춰 줄어듦(트리거 말줄임용)
            : { display: 'inline-flex', cursor: 'pointer' }}
        >
          {children}
        </span>
      </M.Target>
      {/* 반응형 상한 — 좁은 뷰포트에선 토큰 폭을 넘지 않고 화면에 맞춰 줄어든다(모바일 화면별 튜닝 0).
          폭-적응 부품 원리와 동형: 소비처·개별 화면은 모르고, 프리미티브가 뷰포트를 흡수한다. */}
      <M.Dropdown p="md" style={{ maxWidth: 'calc(100vw - 2rem)' }}>{content}</M.Dropdown>
    </M>
  );
}
