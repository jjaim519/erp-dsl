'use client';
// Anchor 원자 — **«글 안에 박힌 이동».** 색+밑줄 링크 스타일 고정.
//
//  **자리가 하나뿐이라는 게 이 부품의 정체다.** 우리 시스템에서 이동은 대부분 다른 통로가 맡는다 —
//  메뉴는 `AppShell.onNavigate` · 행은 `DataTable.onRowClick` · 경로는 `Breadcrumb` · 계층은 `Tree`.
//  남는 것은 **안내문·게시글 본문·설명 텍스트 «안»의 링크** 하나고, 그 자리는 Button이 못 메운다:
//   ① 문장 흐름을 깬다(버튼은 블록·알약) ② **우클릭 새 탭·주소 복사가 안 된다**
//   ③ 스크린리더가 「버튼」으로 읽는다 — 「누르면 뭔가 일어난다」와 「저기로 간다」는 다른 약속이다.
//
//  ⚠ **`href`만으로는 SPA에서 못 쓴다(v0.93까지의 결함).** `<a href>`는 전체 문서 재로드라,
//   Next 소비처가 이 부품을 쓰면 라우팅이 안 붙고 페이지가 통째로 다시 뜬다. 그래서 실사용이
//   부품 안 한 자리(`_cells`의 `link` 셀)와 dev 도구뿐이었다 — **있는데 쓰면 느려지니 안 쓴 것.**
//   → `onNavigate`를 열어 **클릭만 가로챈다.** 태그는 여전히 `<a href>`라 새 탭·복사·낭독이 다 산다.
//     소비처가 `next/link`로 감싸게 통로를 여는 길(다)은 안 골랐다 — 감싸는 법이 화면마다 갈린다.
//
//  ⚠ **보조키·가운데 클릭은 가로채지 않는다.** ⌘/Ctrl/Shift/Alt + 클릭과 휠 클릭은 브라우저에
//   넘긴다(그게 「새 탭으로 열기」다). 이걸 안 지키면 위 ②를 지키려고 만든 부품이 스스로 ②를 깬다.
import { Anchor as MantineAnchor } from '@mantine/core';
import type { MouseEvent, ReactNode } from 'react';

type AnchorProps = {
  href: string;
  children: ReactNode;
  /** 주면 좌클릭을 가로채 소비처 라우터로 넘긴다(SPA 이동). 안 주면 평범한 문서 이동. */
  onNavigate?: (href: string) => void;
  /**
   * 바깥으로 나가는 링크. `target=_blank` + `rel=noopener noreferrer` + 표식(↗)이 **함께** 붙는다.
   *  셋을 따로 두지 않는 이유: 지금은 호출처가 라벨에 「↗」를 손으로 적고 있어(`캔버스만 열기 ↗`)
   *  표식이 화면마다 갈린다. 외부 여부는 하나의 사실이므로 축도 하나다.
   */
  external?: boolean;
};

export function Anchor({ href, children, onNavigate, external = false }: AnchorProps) {
  const intercept = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate || external) return;
    // 보조키·가운데 클릭 = 「새 탭으로」. 브라우저에 그대로 넘긴다.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(href);
  };

  return (
    <MantineAnchor
      href={href}
      onClick={intercept}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
      c="primary"
      underline="always"
      fz="var(--typo-body-size)"
    >
      {children}
      {/* 표식은 부품이 붙인다 — 라벨에 적으면 「↗」가 검색·낭독에 글자로 섞이고 화면마다 갈린다.
          `aria-hidden`이라 낭독은 안 되고, 「새 창에서 열림」은 위 rel/target이 브라우저에 알린다. */}
      {external && <span aria-hidden style={{ marginInlineStart: '0.15em' }}>↗</span>}
    </MantineAnchor>
  );
}
