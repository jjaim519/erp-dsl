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
  size?: 'xs' | 'sm' | 'md';   // Button 밀도 3단 그대로 — 표 행 안 액션이 xs의 자리다
  disabled?: boolean;
  // Button 원자가 이미 갖고 있는데 분자가 안 흘려보내던 둘. 새 축이 아니라 *누락된 통로*다.
  //  · type='submit' — 아이콘 전용 제출 버튼(NoteThread 컴포저). 폼 소유 부품이 Enter 제출을 form으로
  //    푸는데 제출 버튼만 type='button'이면 그 폼에 제출구가 없다.
  //  · loading — 제출 중 표시. 텍스트 버튼에만 있고 아이콘 버튼엔 없을 이유가 없다.
  loading?: boolean;
  type?: 'button' | 'submit';
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

export function IconButton({ icon, label, variant = 'ghost', size = 'md', disabled, loading, type, onClick }: Props) {
  const m = MAP[variant];
  return (
    <ButtonBase variant={m.btn} size={size} iconOnly ariaLabel={label} disabled={disabled}
      loading={loading} type={type} onClick={onClick}>
      {/* 아이콘 단은 버튼 밀도와 «같은 이름»이 아니다 — 밀도 3단(28/32/40)에 아이콘 단은 둘뿐이라,
          조밀 두 단(xs·sm)이 아이콘 sm을 공유한다. 28 버튼에 md 아이콘을 넣으면 글리프가 칸을 꽉 채운다. */}
      <Icon name={icon} size={size === 'md' ? 'md' : 'sm'} color={m.iconColor} />
    </ButtonBase>
  );
}
