'use client';
// MobileField (분자) — 모바일 폼의 한 칸. 데스크탑 FormField의 짝이자, 모바일에서 그걸 **대체**한다.
//
//  이 부품은 **칸의 크롬만** 소유한다: [작은 라벨] / [값 슬롯] / [에러 메시지].
//  **칸 자신은 아무 경계도 그리지 않는다.** 경계는 값 슬롯에 든 *입력 원자*가 자기 면으로 말하고,
//  그 면은 셸 스코프가 깐다(mobileshell.css 입력칸 어휘 절).
//
//  왜 칸이 아니라 원자에 붙나 — 이 칸에는 입력 원자가 아닌 것도 들어온다:
//   · 분류 = MobileChoice 칩 줄(칩마다 이미 pill 윤곽 + 좌우 스크롤)
//   · 수신자 = 펼침 트리거(펼치면 조직도 트리가 같은 칸 안에서 열린다)
//  칸에 면·윤곽을 그리면 이것들까지 "입력칸처럼" 보이고, 칩 줄에선 윤곽이 2중이 되며 상자가 있지도 않은
//  스크롤 끝을 그린다. 원자에 붙이면 원자만 정확히 표시된다.
//  → **밑줄은 칸 단위로 성립하고, 면·윤곽은 원자 단위로만 성립한다.** 이 비대칭이 부착 지점을 정한다(06 §3-2).
//
//  · **라벨은 위에 둔다.** Baymard는 모바일에서 inline(좌측) 라벨을 *쓰지 말라*고 못박고
//    — 좁은 폭에서 입력칸이 쪼그라들고 오류가 는다 — 상단 라벨이 완료 시간을 최대 50% 줄인다는
//    아이트래킹 결과(Wroblewski)가 NN/Baymard의 공통 권고다. 그러니 "iOS 설정처럼 좌측 라벨"은 오답이다.
//  · 포커스는 원자가 자기 윤곽으로 말한다(WCAG 2.4.13 (b) 방법). 칸은 관여하지 않는다.
//  · 에러는 `--field-border` 통로로 원자 윤곽을 danger로 켜고, 메시지만 칸이 그린다(FormField와 같은 역할 변수).
//
//  ※ 이전 판은 **밑줄 필드**였다(칸 아래 헤어라인이 경계). 두 가지가 틀렸다:
//    ① 그 헤어라인이 --border-default라 MobileListRow 구분선과 **같은 색**이었다 — 입력칸이 정적 행처럼
//       보였고 대비는 1.27:1이었다.
//    ② 밑줄만 쓰는 형태는 M3 filled에서 *면만 뺀* 것이라, 어포던스가 선 하나에 전부 걸렸다.
//       폰의 지배적 어휘는 밑줄이 아니라 채워진 라운드 박스다(iOS 입력 필드, M3 filled).
//       레포가 이미 corner-shape: superellipse(2) + radius.md 16을 깔아둔 것도 면 어휘를 전제한다.
import type { ReactNode } from 'react';
import './mobilelist.css';

type Props = {
  label: string;
  required?: boolean;       // 별표 *표시*만 — 필수 검증은 스키마(FormField와 같은 경계)
  error?: string;
  children: ReactNode;      // 입력 원자 또는 값 슬롯
};

export function MobileField({ label, required = false, error, children }: Props) {
  return (
    <div className="mfd" data-error={error ? '' : undefined}>
      <span className="mfd-l">
        {label}
        {required && <span className="mfd-req" aria-hidden>*</span>}
      </span>
      <div className="mfd-c">{children}</div>
      {error && <span className="mfd-e">{error}</span>}
    </div>
  );
}
