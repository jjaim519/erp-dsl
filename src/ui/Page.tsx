// Page 레이아웃 원자 — AppShell 아래 "모든" 화면의 공통 폭 규율(단일 캔버스).
//  · 콘텐츠 폭 천장(var(--page-max)=1200) + 중앙정렬. 폭에 관여하는 유일한 "페이지-층" 소유자.
//    (Container는 위젯/폼 내부의 좁은 읽기 컬럼용 하위 도구로 강등 — 페이지 최상위엔 Page만.)
//  · 가로 거터는 AppShell.Main의 padding이 준다(좁은 화면=거터, 넓은 화면=1200 캡+중앙). 세로 리듬은
//    각 페이지가 자기 Stack으로 소유 — Page는 폭/중앙만 책임지고 내부 배치엔 관여 안 한다(단일 책임).
//  · 규칙: 페이지별 폭 오버라이드 없음. 1200을 넘겨야 하는 넓은 콘텐츠(타임라인 등)는 페이지 폭을
//    깨지 말고 그 위젯 안에서 가로 스크롤(무스크롤·축 예약 지향과 정합).
import type { ReactNode } from 'react';

type Props = { children: ReactNode };

export function Page({ children }: Props) {
  return (
    <div style={{ width: '100%', maxWidth: 'var(--page-max)', marginInline: 'auto' }}>
      {children}
    </div>
  );
}
