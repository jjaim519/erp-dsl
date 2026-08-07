'use client';
import { NumberInput as M } from '@mantine/core';
import { fieldBorder } from './_fieldStyles';
import { commitKeyHandler, type CommitHandlers } from './_commitKeys';
type Props = CommitHandlers & {
  size?: 'sm' | 'md'; disabled?: boolean; placeholder?: string;
  value: number | string; onChange: (value: number | string) => void; name?: string;
  autoFocus?: boolean;
};
export function NumberInput({ size = 'md', disabled, placeholder, value, onChange, name, autoFocus, onCommit, onCancel }: Props) {
  // 스텝퍼(상하 꺽쇠) 제거: HTML number의 네이티브 스피너는 Mantine의 "범용 기본값"일 뿐, ERP 숫자(금액·수량)는
  // 변동 폭이 커 타이핑이 본질이다. 스텝퍼는 작은 타깃·"타이핑 vs 클릭" 어포던스 혼동·경쟁 경로를 만들어 닫는다.
  // 좁은-범위 증감이 rule of three로 나오면 별도 named 부품(Stepper)으로 — 옵션 토글로 쌓지 않는다(03 §11-3).
  return (
    <M size={size} disabled={disabled} placeholder={placeholder} value={value} name={name} autoFocus={autoFocus}
      onChange={onChange} onKeyDown={commitKeyHandler({ onCommit, onCancel })}
      hideControls radius="sm" styles={{ input: fieldBorder }} />
  );
}
