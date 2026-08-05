'use client';
// IconButton (분자) — Button 원자를 "아이콘 전용·정사각"으로 고정한 named 분자(01 §4-C).
//  · ActionIcon이 아니라 우리 Button(ButtonBase)을 재사용 → 같은 variant 정책·radius·primitive(교리 일치).
//  · 아이콘 색: Icon이 color 미지정 시 currentColor(버튼 대비색) 상속 → filled 위 흰색 자동.
//    danger=윤곽 없는 빨강(ghost 배경 + Icon danger), ghost=secondary 아이콘.
//  · aria-label 필수(텍스트 없으므로). 정사각은 ButtonBase iconOnly가 고정.
import { ButtonBase } from './Button';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
type Props = {
  icon: IconName;
  label: string;            // aria-label(필수)
  variant?: Variant;
  size?: 'sm' | 'md';
  disabled?: boolean;
  onClick?: () => void;
};

// IconButton variant → (Button variant, Icon 색). primary/secondary는 currentColor 상속(색 생략).
//  accent는 danger와 같은 짜임이다 — 배경은 안 깔고(ghost) 글리프에만 색을 준다. 아이콘 뒤에 틴트를
//  깔면 상시 노출되는 헤더 액션이 화면에서 제일 무거운 물건이 된다(06 §2 강조 예산).
const MAP: Record<Variant, { btn: Variant; iconColor?: 'primary' | 'secondary' | 'danger' }> = {
  primary:   { btn: 'primary' },
  secondary: { btn: 'secondary' },
  danger:    { btn: 'ghost', iconColor: 'danger' },
  ghost:     { btn: 'ghost', iconColor: 'secondary' },
  accent:    { btn: 'ghost', iconColor: 'primary' },
};

export function IconButton({ icon, label, variant = 'ghost', size = 'md', disabled, onClick }: Props) {
  const m = MAP[variant];
  return (
    <ButtonBase variant={m.btn} size={size} iconOnly ariaLabel={label} disabled={disabled} onClick={onClick}>
      <Icon name={icon} size={size} color={m.iconColor} />
    </ButtonBase>
  );
}
