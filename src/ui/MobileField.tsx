'use client';
// MobileField (분자) — 모바일 폼의 한 칸. 데스크탑 FormField의 짝이자, 모바일에서 그걸 **대체**한다.
//
//  왜 따로 있나: FormField는 입력 원자에 상자(윤곽)를 두르는 데스크탑 어휘다. 모바일 계열은 면·윤곽을
//   안 쓰고 헤어라인으로만 나누는데, 그렇다고 상자만 벗기면 **어포던스가 통째로 사라진다** —
//   "공지 ⌄"가 컨트롤이 아니라 그냥 글자로 떠 있게 된다(실화면에서 그 상태였다).
//   iOS grouped list가 성립하는 이유는 *행*이 배경·헤어라인·꺽쇠를 갖기 때문이지 상자가 없어서가 아니다.
//
//  그래서 이 부품은 **밑줄 필드**다: [작은 라벨] / [값·입력] / [아래 헤어라인].
//   · 헤어라인이 곧 "여기가 입력칸"이라는 신호이자 칸과 칸의 경계다 — 모바일 계열의 유일한 구분 수단과 같은 것.
//     (Material의 filled 필드가 밑줄로 같은 일을 하고, 국내 앱 다수가 이 형태다.)
//   · **라벨은 위에 둔다.** Baymard는 모바일에서 inline(좌측) 라벨을 *쓰지 말라*고 못박고
//     — 좁은 폭에서 입력칸이 쪼그라들고 오류가 는다 — 상단 라벨이 완료 시간을 최대 50% 줄인다는
//     아이트래킹 결과(Wroblewski)가 NN/Baymard의 공통 권고다. 그러니 "iOS 설정처럼 좌측 라벨"은 오답이다.
//   · 포커스는 **밑줄 색**으로 말한다(상자 아웃라인 금지 — 그러면 벗긴 상자가 포커스 때만 되살아난다).
//   · 에러는 밑줄 + 메시지. `--field-border` 통로를 그대로 쓴다(FormField와 같은 역할 변수).
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
