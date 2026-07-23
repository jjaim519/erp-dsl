'use client';
// KeyValueField 위젯 — 닫힌 키(소비처 주입) → 타입 값 맵 편집. dim_adjustments {width_mm:+30, height_mm:-12} 류.
//  · 도메인 무지(헌법 1): 키가 무슨 축인지 모른다 — 정해진 키집합에 수치를 붙일 뿐. 키는 품목 dimensions에서 동적 주입.
//  · 각 키는 한 번만(맵) — 행의 키 선택지는 "현재 키 + 아직 안 쓴 키"로 좁힌다. 다 쓰면 추가 비활성.
//  · number = 부호(±) 허용(델타라 음수 가능). currency = 원화 표기.
//  · 축 예약: 행 가감이 그리드 안에서 일어나 아래 컴포넌트 안 흔들림.
import { NumberInput } from './NumberInput';
import { CurrencyInput } from './CurrencyInput';
import { Select } from './Select';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import './keyvalue.css';

export type KVKey = { key: string; label?: string };

type Props = {
  keys: KVKey[];                                   // 닫힌 키집합(도메인 주입)
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
  valueType?: 'number' | 'currency';               // number=부호 허용 델타(기본), currency=원화
  addLabel: string;
};

const toNum = (v: number | string): number => {
  const n = typeof v === 'number' ? v : (v === '' || v === '-' ? 0 : Number(v));
  return Number.isFinite(n) ? n : 0;
};

export function KeyValueField({ keys, value, onChange, valueType = 'number', addLabel }: Props) {
  const entries = Object.keys(value);
  const used = new Set(entries);
  const firstFree = keys.find((k) => !used.has(k.key));

  // 키 변경 = 값을 새 키로 이동(삽입 순서 보존).
  const renameKey = (oldKey: string, newKey: string | null) => {
    if (!newKey || newKey === oldKey) return;
    const next: Record<string, number> = {};
    for (const k of entries) next[k === oldKey ? newKey : k] = value[k];
    onChange(next);
  };
  const setVal = (key: string, n: number) => onChange({ ...value, [key]: n });
  const remove = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };
  const add = () => { if (firstFree) onChange({ ...value, [firstFree.key]: 0 }); };

  return (
    <div className="erpKV">
      {entries.map((key) => {
        const options = keys
          .filter((k) => k.key === key || !used.has(k.key))
          .map((k) => ({ value: k.key, label: k.label ?? k.key }));
        return (
          <div key={key} className="erpKV-row">
            <Select size="sm" options={options} value={key} onChange={(v) => renameKey(key, v)} />
            {valueType === 'currency' ? (
              <CurrencyInput size="sm" value={value[key]} onChange={(v) => setVal(key, toNum(v))} />
            ) : (
              <NumberInput size="sm" value={value[key]} onChange={(v) => setVal(key, toNum(v))} />
            )}
            <span className="erpKV-del">
              <IconButton icon="trash" label="삭제" variant="ghost" size="sm" onClick={() => remove(key)} />
            </span>
          </div>
        );
      })}
      {firstFree && (
        <Button variant="ghost" size="sm" leftIcon={<Icon name="plus" size="sm" />} onClick={add}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}
