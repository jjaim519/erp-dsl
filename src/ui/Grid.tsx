// Grid 프리미티브 — 격자(비율 분할). columns는 12의 약수만. 자식 span은 Grid.Col이 받음.
//  equalRows=true: Mantine flex-wrap 대신 CSS grid(grid-auto-rows:1fr)로 모든 행을 동일 높이로.
//   이때 자식은 카드를 직접 배치(Grid.Col 불필요). 비대칭 span은 기본(Mantine) 모드에서 Grid.Col로.
'use client';
import { Grid as M } from '@mantine/core';
import { createContext, useContext, type ReactNode } from 'react';

// equalRows일 때 Grid는 raw CSS grid로 그리는데 Grid.Col은 Mantine Grid 컨텍스트를 요구해서
//  `Grid component was not found in tree`로 **런타임에만** 터졌다(타입·빌드는 통과 — 소비처가 먼저 발견).
//  두 모드 중 어느 쪽인지 Col이 알아야 하므로 컨텍스트로 알린다. equalRows면 Col은 순수 div(span N).
const EqualRowsCtx = createContext(false);
type Columns = 1 | 2 | 3 | 4 | 6 | 12;
type Gap = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type GridProps = { columns?: Columns; gap?: Gap; equalRows?: boolean; children: ReactNode };
type ColProps = { span?: number; children: ReactNode }; // 1~12

function Grid({ columns = 12, gap = 'md', equalRows = false, children }: GridProps) {
  if (equalRows) {
    return (
      <EqualRowsCtx.Provider value>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: '1fr',
          gap: `var(--mantine-spacing-${gap})`,
        }}>
          {children}
        </div>
      </EqualRowsCtx.Provider>
    );
  }
  return <M columns={columns} gutter={gap}>{children}</M>;
}
function Col({ span = 1, children }: ColProps) {
  // equalRows면 부모가 raw CSS grid다 — Mantine Col을 쓰면 컨텍스트가 없어 런타임에 터진다.
  //  같은 span 의미를 grid-column으로 그대로 옮긴다(자식 입장에선 계약 동일).
  const equalRows = useContext(EqualRowsCtx);
  if (equalRows) return <div style={{ gridColumn: `span ${span}` }}>{children}</div>;
  return <M.Col span={span}>{children}</M.Col>;
}
Grid.Col = Col;
export { Grid };
