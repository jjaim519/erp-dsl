// StatusLabel 원자 — **면 없는** 상태 표기. Badge(면 있음)의 아래 칸이다.
//
//  상태 표현은 세 칸의 사다리다(06 §3-5). 위로 갈수록 무겁고, 그래서 아껴 쓴다:
//    1단  텍스트 + 색          StatusLabel (icon 없음)   — 값이 *모든 항목에* 있을 때
//    2단  심볼 + 텍스트         StatusLabel (icon 있음)   — 종류가 많거나 색만으로 못 가를 때
//    3단  알약 weak / fill      Badge                     — *드물게* 나타나는 것(지연·반려·필독·공지)
//
//  왜 Badge에 "면 없음"을 넣지 않고 부품을 갈랐나:
//   · 면이 없으면 알약이 아니다 — 이름과 실물이 어긋난다.
//   · **줄 높이를 안 민다.** Badge는 padding을 가져 문장 속에 넣으면 행간이 튄다.
//     StatusLabel은 글자라서 문장·표 셀·헤더 어디에나 섞인다. 이건 Badge가 못 하는 일이다.
//   · iOS가 정확히 이 형태다(SwiftUI Label = "an image and text in one simple component").
//     HIG엔 상태 알약 컴포넌트가 아예 없고, 상태는 심볼+텍스트+시맨틱 색으로 말한다.
//
//  아이콘을 함께 두는 이유는 장식이 아니다: 색만으로 뜻을 나르면 WCAG 1.4.1(색만으로 정보 전달 금지)에
//  걸린다. 종류가 다섯을 넘으면 색으로는 못 가르므로 2단이 기본값이 되어야 한다.
import type { CSSProperties } from 'react';
import { Icon, type IconName } from './Icon';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

// weak Badge의 *글자색*과 같은 통로를 쓴다 — 1·2·3단이 같은 색 계열로 묶여야
// 사다리를 오르내려도 "같은 상태"로 읽힌다. -light-color는 Mantine이 모드별로 바꿔준다(다크 안전).
const TONE_COLOR: Record<StatusTone, string> = {
  neutral: 'var(--text-secondary)',                       // 회색은 상태색이 아니라 텍스트 위계라 역할 변수
  success: 'var(--mantine-color-success-light-color)',
  warning: 'var(--mantine-color-warning-light-color)',
  danger: 'var(--mantine-color-danger-light-color)',
  info: 'var(--mantine-color-info-light-color)',
};

type StatusLabelProps = {
  tone?: StatusTone;
  icon?: IconName;       // 주면 2단(심볼+텍스트), 안 주면 1단(텍스트+색)
  children: string;
};

export function StatusLabel({ tone = 'neutral', icon, children }: StatusLabelProps) {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--mantine-spacing-xxs)',
    color: TONE_COLOR[tone],
    // 크기를 스스로 정하지 않는다 — 놓인 자리의 글자 크기를 따른다(문장 속에선 본문, 행 우측에선 caption).
    //  이게 "타이포처럼 다룬다"의 실제 구현이고, 자리마다 size prop을 받는 것보다 축이 하나 적다.
    fontSize: 'inherit',
    fontWeight: 'var(--typo-body-strong-weight)' as unknown as number,
    whiteSpace: 'nowrap',   // 상태어는 짧다 — 줄바꿈되면 값이 아니라 문장으로 읽힌다
  };
  // Icon에 color를 안 준다 → currentColor를 따라 글자와 한 색으로 묶인다(SF Symbols의 hierarchical과 같은 수법).
  return (
    <span style={style}>
      {icon && <Icon name={icon} size="sm" />}
      {children}
    </span>
  );
}
