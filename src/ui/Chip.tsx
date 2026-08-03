// Chip 원자 — 행동 있음(선택/삭제). controlled:
//  · selected(부모가 줌)를 받아 모양만 표현한다.
//  · 클릭당하면 onChange로 "눌렸다" 신호만 쏜다. 그 신호로 무엇이 일어나는지는 모른다.
//  · onRemove 있으면 X를 알약 "안"에 붙여 노출(이 칩을 지운다는 의미가 명확하도록).
//  · defaultSelected(스스로 상태 들기)는 미노출.
//  · variant = 칩의 *정체*(M3 칩 분류의 축약): 'value'=사용자가 넣은 값(input chip — 채움·✕, 필드 안에 산다)
//    / 'suggest'=제품이 내민 빠른 길(suggestion chip — 아웃라인·가벼움, 누르면 값으로 올라간다)
//    / 'legend'=범례 겸 필터(켜짐=그 대상과 *같은 톤*, 꺼짐=무채색. 체크마크 없음).
//    같은 화면에 둘이 공존할 때 형태가 같으면 "같은 게 두 번"으로 읽히므로 형태로 갈라둔다.
import { Chip as MantineChip } from '@mantine/core';
import { Icon } from './Icon';

type ChipColor = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type ChipVariant = 'value' | 'suggest' | 'legend';
type ChipProps = {
  color?: ChipColor;
  variant?: ChipVariant;
  selected?: boolean;
  onChange?: () => void;   // 클릭 신호(controlled 짝). 상태는 부모 소유.
  onRemove?: () => void;
  // ── 입력 시맨틱 ──
  //  칩은 껍데기가 아니라 실제 <input>이다. 그 input이 checkbox냐 radio냐가 **스크린리더가 읽는 구조**를 정한다.
  //  · 기본 checkbox = 여러 개를 각각 켜고 끄는 것(필터·범례).
  //  · radio + 같은 name = "이 중 하나"(단일 선택). name이 같은 것끼리 한 그룹으로 묶인다(네이티브 규칙).
  //  왜 열었나: MobileChoice가 단일 선택인데 role="radiogroup"만 선언하고 자식은 checkbox였다 —
  //   스크린리더가 없는 구조("5개 중 1번")를 읽어주는 거짓 시맨틱이었다. 껍데기가 아니라 원자를 고쳐야 닫힌다.
  type?: 'checkbox' | 'radio';
  name?: string;           // radio 묶음 이름. type='radio'일 때만 의미가 있다.
  children: string;
};

export function Chip({
  color = 'neutral', variant = 'value', selected = false,
  onChange, onRemove, type = 'checkbox', name, children,
}: ChipProps) {
  return (
    <MantineChip
      color={color}
      checked={selected}
      onClick={onChange}
      type={type}
      name={name}
      radius="full"
      size="sm"
      variant={variant === 'suggest' ? 'outline' : 'light'}
      // legend: 체크마크를 지운다. 기본이 *전부 켜짐*인 범례형 필터에서 체크는 모든 칩에 붙어
      //  아무것도 구분하지 못한다(체크는 기본이 꺼짐일 때 값을 한다). 켜짐/꺼짐은 색의 유무로 말한다.
      classNames={variant === 'legend'
        ? { iconWrapper: 'erpChipNoCheck', label: `erpChipLegend erpChipLegend-${color}` }
        : undefined}
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
