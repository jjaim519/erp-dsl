'use client';
import { TextInput as M } from '@mantine/core';
import { fieldBorder } from './_fieldStyles';
import { commitKeyHandler, type CommitHandlers } from './_commitKeys';
type Props = CommitHandlers & {
  size?: 'sm' | 'md'; disabled?: boolean; placeholder?: string;
  value: string; onChange: (value: string) => void; name?: string;
  /** 마운트 시 커서를 여기 둔다. 다른 경로가 없어(DOM 탐색은 우리 경로가 아니다) 닫힌 채로 연다. */
  autoFocus?: boolean;
};
export function TextInput({ size = 'md', disabled, placeholder, value, onChange, name, autoFocus, onCommit, onCancel }: Props) {
  return (
    <M size={size} disabled={disabled} placeholder={placeholder} value={value} name={name} autoFocus={autoFocus}
      onChange={(e) => onChange(e.currentTarget.value)} onKeyDown={commitKeyHandler({ onCommit, onCancel })}
      radius="sm" styles={{ input: fieldBorder }} />
  );
}
