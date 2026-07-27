// Chip 원자 — 행동 있음(선택/삭제). controlled:
//  · selected(부모가 줌)를 받아 모양만 표현한다.
//  · 클릭당하면 onChange로 "눌렸다" 신호만 쏜다. 그 신호로 무엇이 일어나는지는 모른다.
//  · onRemove 있으면 X를 알약 "안"에 붙여 노출(이 칩을 지운다는 의미가 명확하도록).
//  · defaultSelected(스스로 상태 들기)는 미노출.
//  · variant = 칩의 *정체*(M3 칩 분류의 축약): 'value'=사용자가 넣은 값(input chip — 채움·✕, 필드 안에 산다)
//    / 'suggest'=제품이 내민 빠른 길(suggestion chip — 아웃라인·가벼움, 누르면 값으로 올라간다).
//    같은 화면에 둘이 공존할 때 형태가 같으면 "같은 게 두 번"으로 읽히므로 형태로 갈라둔다.
import { Chip as MantineChip } from '@mantine/core';
import { Icon } from './Icon';

type ChipColor = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type ChipVariant = 'value' | 'suggest';
type ChipProps = {
  color?: ChipColor;
  variant?: ChipVariant;
  selected?: boolean;
  onChange?: () => void;   // 클릭 신호(controlled 짝). 상태는 부모 소유.
  onRemove?: () => void;
  children: string;
};

export function Chip({ color = 'neutral', variant = 'value', selected = false, onChange, onRemove, children }: ChipProps) {
  return (
    <MantineChip
      color={color}
      checked={selected}
      onClick={onChange}
      radius="full"
      size="sm"
      variant={variant === 'suggest' ? 'outline' : 'light'}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--mantine-spacing-xxs)' }}>
        {children}
        {onRemove && (
          <span
            role="button"
            aria-label="제거"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{ display: 'inline-flex', cursor: 'pointer' }}
          >
            <Icon name="x" size="sm" />
          </span>
        )}
      </span>
    </MantineChip>
  );
}
