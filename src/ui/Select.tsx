// Select 원자 — 단일 선택. options는 {label,value}[]로 입구 통일. searchable 고정(끔).
//  · "열린다"는 신호는 **우리 chevron-down 하나로 고정**한다. Mantine 기본 글리프를 그대로 두면
//    같은 뜻을 가진 다른 자리(TreeSelect·Cascader·수신자 펼침 행…)와 모양이 갈려, 한 화면에 신호가 둘이 된다.
//    (모바일에서 특히 드러났다 — 상자를 벗기고 나면 남는 어포던스가 이 글리프뿐이다.)
import { Select as M } from '@mantine/core';
import { Icon } from './Icon';
import { fieldBorder } from './_fieldStyles';
type Option = { label: string; value: string };
type Props = {
  options: Option[]; value: string | null; onChange: (value: string | null) => void;
  placeholder?: string; disabled?: boolean; size?: 'sm' | 'md'; name?: string;
};
export function Select({ options, value, onChange, placeholder, disabled, size = 'md', name }: Props) {
  return (
    <M data={options} value={value} onChange={onChange} placeholder={placeholder}
      disabled={disabled} size={size} name={name} searchable={false} radius="sm"
      rightSection={<Icon name="chevron-down" size="sm" color="secondary" />}
      styles={{ input: fieldBorder }} />
  );
}
