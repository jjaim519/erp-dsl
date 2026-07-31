'use client';
// ListDetail (배치 부품) — 평평한 목록 + 프리뷰 2-pane.
//
//  계층은 HierarchyExplorer(좌 트리), 정보+폼은 DetailPage(좌 정보/우 폼)가 이미 있고,
//  **평면 목록 + 상세**만 빈칸이었다. 계약이 {list, detail, collapsed}뿐이라 이건 도메인 골격(템플릿)이
//  아니라 *배치*다 — 그래서 "템플릿 층 동결"(v0.54.0) 방침과 부딪히지 않는다.
//
//  비율은 **Grid 프리미티브**가 만든다(12열 중 5:7). 「01」이 못박은 규율 그대로다 —
//   "정연한 비율 분할을 임의 폭으로 짜면 그건 금지된 값이고, 비율은 구조(columns/span)에서 도출한다."
//   (초판이 `.82fr 1.18fr`을 raw grid로 박았다. 목업 수치를 옮긴 것이었지만 12열로는 5:7 = 41.7:58.3이라
//    차이가 0.7%p — 눈으로 구분 못 하는 값 때문에 닫힌 격자를 버릴 이유가 없었다.)
//
//  이 부품이 진짜 소유하는 것은 폭이 아니라 **"목록은 흐르고 상세는 붙어 있다"**는 규칙이다.
//   sticky는 어떤 프리미티브도 노출하지 않아 여기 raw로 남는다(부품 존재 이유이자 유일한 raw).
//   ※ Grid.Col은 행 높이만큼 늘어난다(stretch) — 그래야 상세가 붙어 있을 *구간*이 생긴다.
//     초판은 여기에 align-items:start를 줘서 칸 높이=내용 높이가 됐고, sticky가 조용히 무력화돼 있었다.
import type { ReactNode } from 'react';
import { Grid } from './Grid';

type Props = {
  list: ReactNode;
  detail: ReactNode;
  /** 목록이 0건일 때 true — 상세를 접고 목록이 폭 전체를 쓴다. 고를 게 없는데 "고르세요"를 띄우지 않는다. */
  collapsed?: boolean;
};

export function ListDetail({ list, detail, collapsed = false }: Props) {
  return (
    <Grid columns={12} gap="lg">
      {/* 목록이 한 줄 행이라 좁아도 되고, 상세는 근거 블록이 쌓여 더 넓어야 한다 → 5 : 7. */}
      <Grid.Col span={collapsed ? 12 : 5}>{list}</Grid.Col>
      {!collapsed && (
        <Grid.Col span={7}>
          <div style={{ position: 'sticky', top: 0 }}>{detail}</div>
        </Grid.Col>
      )}
    </Grid>
  );
}
