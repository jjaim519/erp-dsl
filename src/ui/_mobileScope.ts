'use client';
// 모바일 스코프 — **문서 루트**에 모바일 규격을 건다(06 §1-9).
//
//  거는 것 둘:
//   ① `erp-mobile` 클래스 — mobileshell.css의 규격 규칙이 이걸 본다.
//      44/48px 터치 높이(`--input-height-*`) · iOS 자동 확대 봉인(input 16px 하한) ·
//      입력 **면 어휘**(`--field-border: transparent` + surface-input + radius 16 + 2px) · InputGroup 일습.
//   ② 타이포 스케일(`mobileTypoVars`) — body 17 등. 값의 단일 출처는 theme.ts다.
//
//  왜 엘리먼트(.ms)가 아니라 문서 루트인가:
//   포털(Drawer·Modal·Popover·Menu)은 DOM상 `document.body` 밑이라 셸 엘리먼트 밖이다.
//   `.ms` 스코프면 **포털 안이 통째로 규격 밖으로 나간다** — 시트 안 입력칸이 데스크탑 윤곽 필드로
//   되돌아가고, iOS 확대 봉인도 안 걸려 포커스 때 화면이 확대된다. 실제로 그 상태였다.
//   한 문서는 데스크탑이거나 모바일이지 둘 다일 수 없으므로(§1-5, 경계 768) 문서 단위가 맞다.
//
//  왜 셸이 아니라 별도 훅인가:
//   **규격이 셸 크롬에 붙어 있으면 안 된다.** 크롬(내비바·탭바) 없이 부품만 띄우는 자리에서
//   규격까지 같이 사라진다. 크롬과 규격은 다른 관심사다 — `MobileShell`은 이 훅을 *부르기만* 한다.
import { useEffect } from 'react';
import { mobileTypoVars } from './theme';

export function useMobileScope() {
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add('erp-mobile');
    for (const [k, v] of Object.entries(mobileTypoVars)) el.style.setProperty(k, v);
    return () => {
      el.classList.remove('erp-mobile');
      for (const k of Object.keys(mobileTypoVars)) el.style.removeProperty(k);
    };
  }, []);
}
