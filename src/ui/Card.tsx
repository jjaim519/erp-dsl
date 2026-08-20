// Card 레이아웃 원자 — 그릇. variant로 elevated/outlined/flat 닫음. padding 토큰. 자식 받음.
//
//  ⚠ **elevated는 `--elevation-raised`를 쓴다(Mantine shadows.md 아님).** 여기 오기 전까지 카드가
//    `shadow="md"`였는데 theme.ts는 그 값을 «모달용»이라 못박아 뒀다 — 즉 **카드가 모달 그림자를 입고
//    Modal·Popover와 같은 높이로 떠 있었다.** 그림자 체계가 두 벌(Mantine shadows / 우리 elevation 2축)인데
//    위젯들은 elevation을 쓰고 Card만 옛 쪽에 남아 있던 드리프트다(02 §surface·elevation 2축).
//    실측 차이: 코너 잘린 영역이 md면 #e9eaed, raised면 #ebecee(페이지 #f1f2f4 대비) — md가 눈에 띄게 더 진하다.
import { Paper } from '@mantine/core';
import type { ReactNode } from 'react';
type CardVariant = 'elevated' | 'outlined' | 'flat';
const V: Record<CardVariant, { withBorder: boolean; elevation?: string }> = {
  elevated: { withBorder: false, elevation: 'var(--elevation-raised)' },
  outlined: { withBorder: true },
  flat: { withBorder: false },
};
type CardProps = { variant?: CardVariant; padding?: 'none' | 'sm' | 'md' | 'lg'; fill?: boolean; children: ReactNode };
export function Card({ variant = 'outlined', padding = 'md', fill = false, children }: CardProps) {
  const v = V[variant];
  return (
    <Paper withBorder={v.withBorder} p={padding === 'none' ? 0 : padding} radius="md"
      bg="var(--bg-primary)" style={{
        borderColor: 'var(--border-default)', overflow: 'hidden',
        ...(v.elevation ? { boxShadow: v.elevation } : {}),
        ...(fill ? { height: '100%' } : {}),
      }}>
      {children}
    </Paper>
  );
}
