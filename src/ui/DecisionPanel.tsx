'use client';
// DecisionPanel (유기체) — "한 건을 다음 단계로 넘긴다" 화면의 우측 패널. **하단 고정 액션 바를 소유한다.**
//
//  왜 신설인가: DetailPage는 [좌 정보 / 우 폼] 2분할이고, Card+Stack으로 조립하면 **액션 바 위치를
//   소비처가 소유**하게 된다 — 탭이 셋인데 버튼 자리가 셋 다 같아야 "다음 단계로 넘긴다"는 정체성이 성립하므로,
//   그 자리를 소비처가 매번 조립하면 반드시 갈린다. 자리를 부품이 갖는 것이 이 부품의 존재 이유다.
//
//  도메인 무지(헌법 1): 섹션 children은 raw 슬롯(Modal children 동형 — 이미 인정된 경계)이고,
//   부품은 그 안이 견적안인지 메모인지 모른다. 아는 것은 [머리 / 섹션들 / 바] 세 구획의 기하뿐이다.
//
//  잠금 CTA: `disabled`를 받되 **disabled 속성으로 렌더하지 않는다**(포커스를 못 받아 사유가 도달 안 함).
//   눌리되 넘어가지 않고 `disabledReason`을 액션 바 안내 자리에 danger로 띄운다 — 그 자리는 상시 예약이라
//   기하가 안 흔들린다(축 예약 지향). OptionSetPicker의 잠금 규율과 같은 판단.
import { useState, type ReactNode } from 'react';
import { Title } from './Title';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { Stack } from './Stack';
import { Group } from './Group';
import { Divider } from './Divider';
import { renderAction, type Action } from './_cells';
import './decisionpanel.css';

export type DecisionSection = {
  key: string;
  label?: string;          // 없으면 라벨 줄 자체를 안 만든다(빈 캡션 자리 금지)
  labelExtra?: ReactNode;  // 라벨 우측 보조(＋ 새 안 등)
  children: ReactNode;
};

type Props = {
  title: string;
  subtitle?: string;
  sections: DecisionSection[];
  primaryAction: Action & { disabled?: boolean; disabledReason?: string };
  secondaryActions?: Action[];   // 주 CTA **왼쪽에 붙어서** 선다(격자로 벌리지 않는다)
  actionNote?: string;           // 액션 바 좌측 안내. 잠금 사유가 이 자리를 빌린다
};

export function DecisionPanel({
  title, subtitle, sections, primaryAction, secondaryActions, actionNote,
}: Props) {
  const [blocked, setBlocked] = useState(false);
  const locked = primaryAction.disabled === true;
  const note = blocked && locked
    ? (primaryAction.disabledReason ?? '아직 이 단계로 넘길 수 없습니다')
    : actionNote;

  return (
    <div className="dp">
      <div className="dp-head">
        {/* 제목↔부제는 한 덩어리(xxs) — 초판은 여기에 margin-top:3px을 박았다(토큰 밖 매직넘버). */}
        <Stack gap="xxs">
          <Title variant="subheading">{title}</Title>
          {subtitle && <span className="dp-sub"><Text variant="body" color="secondary">{subtitle}</Text></span>}
        </Stack>
      </div>
      <Divider />

      {sections.map((s, i) => (
        <div key={s.key}>
          {i > 0 && <Divider />}
          <div className="dp-sec">
            {(s.label || s.labelExtra) && (
              <div className="dp-sec-h">
                {/* 오버라인 캡션(제목 티어가 아니라 구획의 이름표) — CompositionOutline 섹션 라벨과 같은 어휘.
                    SectionHeader는 subheading 티어라 여기선 근거 블록들이 서로 제목처럼 경쟁하게 된다. */}
                <span className="dp-sec-t">{s.label}</span>
                {s.labelExtra}
              </div>
            )}
            {s.children}
          </div>
        </div>
      ))}

      {/* 바의 상단 선만 Divider가 아니라 CSS다 — sticky로 떠 있는 요소가 자기 선을 갖고 있어야 하고,
          흐름에 놓인 Divider는 스크롤과 함께 위로 흘러가 버린다. */}
      <div className="dp-bar">
        <Group justify="between" gap="xs">
          {/* 자리는 항상 있고 내용만 바뀐다 — 사유가 뜰 때 버튼이 밀리지 않는다. */}
          <span className="dp-note">
            {note && <Text variant="caption" color={blocked && locked ? 'danger' : 'secondary'}>{note}</Text>}
          </span>
          <Group gap="xs">
            {/* 보조는 우리 secondary(tonal fill·무테). 목업의 "투명 배경 + 테두리 ghost"를 그대로 쓰지 않는 이유는
                무테 지향(윤곽은 구조 구분선·입력칸에만) — 버튼 셋이 나란한 바에서 윤곽 셋은 특히 시끄럽다. */}
            {secondaryActions?.map((a, i) => renderAction({ ...a, variant: a.variant ?? 'secondary' }, `s${i}`, 'sm'))}
            <span>
              {/* 잠금은 *Button의 어휘*로 표현한다 — primary(지금 할 일) → secondary(지금은 주 행동이 아님).
                  바깥 CSS로 primary 버튼을 회색으로 덮으면 부품 계약이 깨진다. disabled 속성은 여전히 안 쓴다
                  (포커스를 못 받아 사유가 도달 안 함) — 눌리되 안 넘어가고 사유를 note 자리에 말한다. */}
              <Button
                variant={locked ? 'secondary' : (primaryAction.variant ?? 'primary')}
                leftIcon={primaryAction.icon ? <Icon name={primaryAction.icon} size="sm" /> : undefined}
                onClick={() => {
                  if (locked) { setBlocked(true); return; }   // 넘어가지 않되 사유를 말한다
                  setBlocked(false);
                  primaryAction.onClick();
                }}
                ariaLabel={locked ? `${primaryAction.label} — ${primaryAction.disabledReason ?? '지금은 진행할 수 없습니다'}` : undefined}
              >
                {primaryAction.label}
              </Button>
            </span>
          </Group>
        </Group>
      </div>
    </div>
  );
}
