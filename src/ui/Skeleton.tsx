'use client';
// Skeleton 원자 — 콘텐츠 로드 전 자리표시(레이아웃 유지). Spinner(점 하나)와 달리 '형태'를 보존한다.
//  · **쓰는 자리를 좁힌다: 구조가 굳은 곳에서만.** 스켈레톤은 실제 배치를 복제하므로 부품이 바뀔 때마다
//    어긋난다(드리프트). 그리고 체감 성능 이득도 통념만큼 확실하지 않다 — Viget 2017 실험에선
//    스피너·빈 화면보다 *체감 대기가 나빴고*, NN/g 2025는 "빈 공간보다 나은 건 500ms 초과일 때뿐"이라 한다.
//  · 그래서 로딩 표시의 기본은 **Spinner**다(DataTable·ListPage·MobileBoardList 전부 그렇다).
//    스켈레톤은 배치가 확정된 자리에 *의도적으로* 넣을 때만 쓴다. 전역 로딩 어휘는 06 §1-7.
//  · 자유 배치로 띄우지 말 것 — 실제 구조와 무관한 스켈레톤은 아무것도 예고하지 못한다.
//  · 닫힌 props: variant(text/block/circle)·lines·size·radius. 임의 px 노출 안 함(부모 레이아웃이 크기 결정,
//    circle/block 크기만 size 토큰으로 단계화). 내부 px는 격리 구역(Modal maxHeight와 동류).
//  · Mantine Skeleton 격리 래핑(헌법 7).
import { Skeleton as S } from '@mantine/core';
import { Stack } from './Stack';

type Props = {
  variant?: 'text' | 'block' | 'circle';
  lines?: number;                  // text 전용(기본 3). 마지막 줄은 짧게(문단 끝 흉내).
  size?: 'sm' | 'md' | 'lg';       // circle 지름 / block 높이 단계
  radius?: 'sm' | 'md';
};

const CIRCLE = { sm: 32, md: 40, lg: 56 } as const;
const BLOCK_H = { sm: 80, md: 140, lg: 220 } as const;

export function Skeleton({ variant = 'text', lines = 3, size = 'md', radius = 'sm' }: Props) {
  if (variant === 'circle') return <S circle height={CIRCLE[size]} />;
  if (variant === 'block') return <S height={BLOCK_H[size]} radius={radius} />;
  return (
    <Stack gap="xs">
      {Array.from({ length: lines }).map((_, i) => (
        <S key={i} height={12} radius={radius} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </Stack>
  );
}
