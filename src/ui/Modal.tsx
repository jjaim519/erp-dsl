'use client';
// Modal 유기체 — 도메인 무관 껍데기. 본문(children)에 도메인 폼이 오되 Modal은 모름(방식 A).
// 헤더(제목+X)는 Mantine 내부에 위임하지 않고 우리 Group으로 직접 조립한다.
//  → 정렬 보장이 Mantine이 아니라 우리 프리미티브에서 나온다(서드파티 내부 레이아웃 불신).
// 푸터: actions를 variant 보고 배치 고정(primary/danger 맨 오른쪽, 순서 무관).
//
// 스크롤 구조(헤더·푸터 고정 + 본문만 스크롤): Mantine 본문 패딩을 끄고(padding=0)
//  우리가 3영역(헤더/본문/푸터)을 flex 세로로 직접 조립한다. 헤더·푸터는 flex:none(고정),
//  본문은 flex:1 + overflowY:auto(긴 내용일 때만 스크롤). 컨테이너 maxHeight=85vh로 캡.
//  ※ 이 flex/overflow/maxHeight는 Stack 프리미티브가 노출하지 않는 표현이라 raw style이 된다
//    (격리 구역이므로 헌법 7 위반 아님 — 단 "직접 조립" 따름정리의 적용 여부는 검토 대상).
import { Modal as M } from '@mantine/core';
import type { ReactNode } from 'react';
import { Group } from './Group';
import { Title } from './Title';
import { Icon } from './Icon';
import type { Action } from './_cells';
import { renderAction } from './_cells';

type Props = {
  opened: boolean;
  onClose: () => void;
  title: string;
  actions?: Action[];
  // 폭. sm/md/lg/xl=Mantine 네이티브 폭 토큰 / full='거의 꽉 찬 wide'(95vw·90vh — 풀스크린 아님, radius·여백 유지).
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  children: ReactNode;
};

const isPrimaryEnd = (v?: string) => v === 'primary' || v === 'danger';

export function Modal({
  opened, onClose, title, actions, size = 'md', closeOnOverlayClick = true, children,
}: Props) {
  const ordered = actions
    ? [...actions].sort((a, b) => Number(isPrimaryEnd(a.variant)) - Number(isPrimaryEnd(b.variant)))
    : [];
  const full = size === 'full';            // 풀스크린 대신 95vw/90vh — 큰 폼·표 편집용(여백·radius는 유지).
  const mSize = full ? '95vw' : size;      // sm/md/lg/xl은 Mantine 토큰 그대로, full만 vw로 분기.

  return (
    <M
      opened={opened}
      onClose={onClose}
      size={mSize}
      centered
      closeOnClickOutside={closeOnOverlayClick}
      radius="md"
      /* 그림자는 elevation 2축의 overlay — Mantine shadows.md와 값이 겹쳐 카드와 구분이 안 됐다(02 §2축) */
      styles={{ content: { boxShadow: 'var(--elevation-overlay)' } }}
      withCloseButton={false}  /* 기본 헤더 끔 — 우리가 직접 조립 */
      padding={0}              /* 본문 패딩 끔 — 패딩 주인을 우리 3영역으로 이관 */
    >
      {/* 3영역 flex 세로 컨테이너 — maxHeight로 캡(full은 90vh로 더 키움), 넘치면 본문만 스크롤 */}
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: full ? '90vh' : '85vh' }}>
        {/* 헤더(고정) — 우리 Group으로 조립. flex:none이라 스크롤 안 됨. */}
        <div style={{ flex: 'none', padding: 'var(--mantine-spacing-md)', borderBottom: `var(--border-width) solid var(--border-default)` }}>
          <Group justify="between" align="center">
            <Title variant="heading">{title}</Title>
            <span role="button" aria-label="닫기" onClick={onClose} style={{ display: 'inline-flex', cursor: 'pointer' }}>
              <Icon name="x" color="secondary" />
            </span>
          </Group>
        </div>

        {/* 본문(스크롤) — flex:1 + overflowY:auto. 짧으면 안 늘고 스크롤도 없음. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--mantine-spacing-md)' }}>
          {children}
        </div>

        {/* 푸터(고정) — actions 있을 때만. flex:none. */}
        {ordered.length > 0 && (
          <div style={{ flex: 'none', padding: 'var(--mantine-spacing-md)', borderTop: `var(--border-width) solid var(--border-default)` }}>
            <Group justify="end" gap="xs">
              {ordered.map((a, i) => renderAction(a, i))}
            </Group>
          </div>
        )}
      </div>
    </M>
  );
}
