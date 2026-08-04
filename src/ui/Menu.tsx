'use client';
// Menu (분자) — Popover + Action[] 리스트(+선택적 header). 클릭 시 열리는 액션 메뉴.
//  · rule of three로 추출: AppShell 프로필·알림(슬롯) + Tree 노드 ⋯ 메뉴. Popover 토글은 분자가 내부 소유.
//  · 항목은 Action(label·icon?·variant?·onClick). 클릭 시 메뉴 닫고 onClick 실행. danger는 빨강.
//  · content 슬롯 우회는 Popover와 동일(부품만 조립 인지 + hex 린트). 닫힌 trigger/items만 노출.
//  · **폰에서도 시트로 안 바꾼다.** iOS 13은 메뉴를 아이폰에서 액션시트로 띄웠는데 iOS 14가 그걸 접었다 —
//    "배경을 어둡게 해 전환이 무겁고, 라벨이 짧은데 항목이 과하게 크다"는 게 Apple이 밝힌 이유다.
//    M3도 "메뉴 항목을 바텀시트에 넣는 건 권하지 않는다(선택지를 조작 지점 가까이 둔다)"고 적는다.
//    그래서 형태는 앵커 그대로 두고 **치수만** 폰 규격으로 올린다(controls.css `.erp-mobile .erpMenuItem`).
//    06 §5의 "액션 목록 시트는 안 만든다"가 이 두 정본과 같은 선이다.
//  · 항목 기하는 CSS(controls.css)가 갖는다 — 인라인이면 모바일 스코프가 못 덮는다(06 §1-9).
import { useState, type ReactNode } from 'react';
import { Popover } from './Popover';
import { Stack } from './Stack';
import { Divider } from './Divider';
import { Text } from './Text';
import { Icon } from './Icon';
import type { Action } from './_cells';
import './controls.css';

type Props = {
  trigger: ReactNode;                          // 보통 IconButton(dots-vertical) 등
  items: Action[];
  header?: ReactNode;                          // 선택: 메뉴 상단 신원/제목 블록(있으면 구분선 자동)
  width?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';          // 축 위 정렬(기본 center). start=트리거 시작모서리 flush(좌하단 프로필처럼 넷바 변에 맞출 때)
};

export function Menu({ trigger, items, header, width = 'sm', position = 'bottom', align = 'center' }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      opened={open}
      onChange={setOpen}
      width={width}
      position={position}
      align={align}
      content={
        <Stack gap="xxs">
          {/* 헤더는 항목과 *같은 내부 padding*을 갖는다 — 안 그러면 Stack gap이 위아래 같아도 항목의 padding-top만
              더해져 디바이더 여백이 비대칭(위 4 / 아래 10)이 되고, 가로도 헤더만 8px 튀어나온다.
              padding을 맞추면 대칭이 구조로 보장됨(값 보정 없이). 디바이더는 위아래 대칭 여백(xs)을 래퍼가 소유 —
              Divider는 orientation만 받는 닫힌 원자라 여백은 소비처인 Menu가 갖는다(공용 원자에 옵션 쌓지 않음). */}
          {header && (
            <>
              <div className="erpMenuHeader">{header}</div>
              <div style={{ margin: 'var(--mantine-spacing-xs) 0' }}><Divider /></div>
            </>
          )}
          {items.map((a, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              className="erpMenuItem"
              onClick={() => { setOpen(false); a.onClick(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(false); a.onClick(); } }}
            >
              {a.icon && <Icon name={a.icon} size="sm" color={a.variant === 'danger' ? 'danger' : 'secondary'} />}
              <Text variant="body" color={a.variant === 'danger' ? 'danger' : 'primary'}>{a.label}</Text>
            </div>
          ))}
        </Stack>
      }
    >
      {trigger}
    </Popover>
  );
}
