'use client';
import { NumberInput as M } from '@mantine/core';
import { fieldBorder } from './_fieldStyles';
import { commitKeyHandler, type CommitHandlers } from './_commitKeys';
// CurrencyInput (의미 원자) — 돈 입력 전용. NumberInput의 형제(Stepper 추출과 동형): 좁은 목적은 옵션-스태킹이 아니라 named 부품으로.
//  · ₩ prefix + 천단위 콤마(입력 중 라이브) + 정수(원화 무소수 decimalScale 0) + 컨트롤 없음(금액은 타이핑이 본질).
//  · 값은 순수 number(저장·검증 z.number) — ₩·콤마는 *표시*만. 다운스트림 표시 포맷은 fmtCurrency 단일출처 유지(여긴 입력 라이브 포맷).
//  · KR 로케일(₩·무소수) = 잠정(phone 마스크와 동류 — 다국어화 시 분리). NumberInput과 같은 controlled 계약(value/onChange).
type Props = CommitHandlers & {
  size?: 'sm' | 'md';
  disabled?: boolean;
  placeholder?: string;
  value: number | string;
  onChange: (value: number | string) => void;
  name?: string;
  autoFocus?: boolean;
};

export function CurrencyInput({ size = 'md', disabled, placeholder, value, onChange, name, autoFocus, onCommit, onCancel }: Props) {
  return (
    <M
      size={size} disabled={disabled} placeholder={placeholder} value={value} name={name} autoFocus={autoFocus}
      onChange={onChange} onKeyDown={commitKeyHandler({ onCommit, onCancel })}
      hideControls radius="sm"
      prefix="₩ " thousandSeparator="," decimalScale={0}
      styles={{ input: fieldBorder }}
    />
  );
}
