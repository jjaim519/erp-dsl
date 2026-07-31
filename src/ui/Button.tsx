import { Button as MantineButton } from '@mantine/core';
import type { ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────
// 우리 라이브러리의 Button. (C++ 의 안전한 문법에 해당)
//
// 바깥 세계가 보는 것은 아래 ButtonProps 뿐이다.
// color / radius / px / className / style 같은 "열린 문"은 노출하지 않는다.
// → 임의 색·임의 크기·임의 스타일을 넣을 길 자체가 없다.
//
// 핵심: 이 Props는 우리가 손으로 쓴 순수 타입이라 (string & {}) 탈출구가 없다.
//       그래서 variant="rainbow" 는 진짜 컴파일 에러가 난다. (그물 1)
//       Mantine 타입을 상속(extends)하지 않는 게 의도다 — 상속하면 열린 타입이 딸려온다.
// ─────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  // 접근성 이름 — children이 있어도 *맥락*이 필요한 버튼용("보기"가 어느 행의 보기인가).
  //  · className/style과 성격이 다르다: 스타일 우회 통로가 아니라 접근성 계약이라 열어도 닫힘이 안 샌다.
  //  · 아이콘 전용 버튼은 여전히 IconButton(label 필수)이다 — 이건 텍스트가 *있는데* 모호한 경우.
  ariaLabel?: string;
};

// variant → 실제 스타일 매핑. 이 "정책"을 우리가 100% 소유한다.
// 색은 hex가 아니라 토큰 역할 이름만 쓴다 (theme.ts가 실제 색을 답한다).
// 무테 지향(지향 tenet): 분리는 톤·음영 우선, 윤곽은 최후. secondary는 *tonal fill*(light — 옅은 톤 채움·무테)로
//  "버튼처럼 보이되 테두리 없음". 윤곽이 필요한 보조 동작은 ghost(subtle) 또는 소비처가 의도적으로.
const VARIANT: Record<ButtonVariant, { color: string; mantineVariant: string }> = {
  primary:   { color: 'primary', mantineVariant: 'filled' },
  secondary: { color: 'neutral', mantineVariant: 'light' },
  danger:    { color: 'danger',  mantineVariant: 'filled' },
  ghost:     { color: 'neutral', mantineVariant: 'subtle' },
};

// 내부 공유 베이스 — 공개 배럴(index.ts)엔 노출하지 않는다(Button만 re-export).
// IconButton이 이걸 재사용해 "Button 원자를 아이콘 전용·정사각으로 고정한 분자"(01 §4-C)를
// *같은 primitive·같은 variant 정책*으로 구현한다(ActionIcon 별도 primitive 쓰던 불일치 해소).
type BaseProps = ButtonProps & {
  iconOnly?: boolean;   // 정사각·패딩0 (아이콘 전용)
  ariaLabel?: string;   // 텍스트 없는 아이콘 버튼의 의미 보존
};

export function ButtonBase({
  variant = 'primary',
  size = 'md',
  children,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  iconOnly = false,
  ariaLabel,
}: BaseProps) {
  const policy = VARIANT[variant];

  // 이 파일 안에서는 Mantine의 열린 API를 직접 만져도 된다.
  // 닫힘은 "이 파일 안"이 아니라 "이 파일이 바깥에 노출하는 경계(ButtonProps)"에서 일어난다.
  return (
    <MantineButton
      color={policy.color}
      variant={policy.mantineVariant}
      size={size}
      radius="sm"        // radius는 정책으로 고정. 바깥에서 못 바꾼다.
      aria-label={ariaLabel}
      leftSection={leftIcon}
      rightSection={rightIcon}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      type={type}
      onClick={onClick}
      px={iconOnly ? 0 : undefined}
      styles={iconOnly ? { root: { aspectRatio: '1 / 1', paddingInline: 0 }, label: { display: 'inline-flex' } } : undefined}
    >
      {children}
    </MantineButton>
  );
}

export function Button(props: ButtonProps) {
  return <ButtonBase {...props} />;
}
