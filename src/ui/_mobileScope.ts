'use client';
// 모바일 타이포 스코프 — **문서 루트**에 mobileTypoVars를 깐다.
//
//  왜 엘리먼트가 아니라 문서 루트인가:
//   포털(Drawer·Modal·Popover·Menu)은 DOM상 `document.body` 밑에 붙어 셸 엘리먼트(.ms) 밖이다.
//   엘리먼트 스코프면 같은 `var(--typo-body-size)`가 **자리에 따라 다른 값으로 풀린다** —
//   시트·경고·메뉴 안 글자만 조용히 데스크탑 값(body 14 / 모바일 17)이 된다.
//   실제로 MobileAttachmentViewer·MobileDecisionBar의 오버플로 메뉴가 여러 릴리스 동안 그 상태였다.
//
//  왜 셸이 아니라 별도 훅인가:
//   **스코프가 셸 크롬에 붙어 있으면 안 된다.** 크롬(내비바·탭바)을 안 쓰고 부품만 띄우는 자리
//   (dev 캔버스의 bare 데모)에서 스케일이 통째로 사라진다. 크롬과 스케일은 다른 관심사다.
//   한 문서는 데스크탑이거나 모바일이지 둘 다일 수 없으므로(06 §1-5, 경계 768) 문서 단위가 맞다.
//
//  값의 단일 출처는 theme.ts다 — 여기는 *어디에 까느냐*만 안다(숫자를 다시 적지 않는다).
import { useEffect } from 'react';
import { mobileTypoVars } from './theme';

export function useMobileTypoScope() {
  useEffect(() => {
    const el = document.documentElement;
    for (const [k, v] of Object.entries(mobileTypoVars)) el.style.setProperty(k, v);
    return () => { for (const k of Object.keys(mobileTypoVars)) el.style.removeProperty(k); };
  }, []);
}
