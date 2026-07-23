'use client';
// InheritedValueField 위젯 — 참조(SSOT)+상속+override+배율을 "한 부품에 봉인"한다.
//  · 왜: 이 규칙을 값마다 Select+CurrencyInput로 손조립하면 한 군데서 상속/override를 빠뜨리는 순간
//    금액이 조용히 틀린다(소비처 v1 금액버그의 재발점). 규칙을 부품이 소유하면 누락이 불가능해진다.
//  · 규칙(단일 소유): base = override>0 ? override : ref.price ;  effective = base × ratio.
//    → 유효값을 부품이 계산·표시(저작자 피드백). 실제 가격 계산 파이프라인(BOM 폭발)은 소비처(quote-builder) 소유 —
//      여기 effective는 "이 규칙이 지금 무엇을 내는지" 보여줄 뿐(§6 비포함 준수).
//  · 도메인 무지(헌법 1): "단가"를 강제하지 않는다 — 참조에서 상속하거나 직접 입력한 수 × 배율. format로 표기만 주입.
import { Select } from './Select';
import { CurrencyInput } from './CurrencyInput';
import { NumberInput } from './NumberInput';
import { fmtCurrency } from './_cells';
import './inheritedvalue.css';

export type RefOption = { id: string; label: string; price: number; unit?: string; group?: string };

type Props = {
  refOptions: RefOption[];                        // 참조 가능한 SSOT 아이템(도메인 주입)
  refId: string | null;
  onRefChange: (id: string | null) => void;
  override: number;                               // 0(또는 빈값) = 상속, >0 = 우선
  onOverrideChange: (value: number) => void;
  ratio?: number;                                 // 배율(곱), 기본 1
  onRatioChange?: (value: number) => void;        // 없으면 배율 입력 미표시(읽기 전용 ×1)
  format?: (n: number) => string;                 // 유효값·상속 placeholder 표기(기본 원화)
  labels?: { ref?: string; override?: string; ratio?: string; effective?: string };
  placeholder?: string;                           // 참조 선택 placeholder
};

const toNum = (v: number | string, fallback: number): number => {
  const n = typeof v === 'number' ? v : (v === '' ? NaN : Number(v));
  return Number.isFinite(n) ? n : fallback;
};

export function InheritedValueField({
  refOptions, refId, onRefChange, override, onOverrideChange,
  ratio, onRatioChange, format = fmtCurrency, labels, placeholder,
}: Props) {
  const L = { ref: '참조 (SSOT)', override: '값 · override', ratio: '배율', effective: '유효값', ...labels };
  const ref = refOptions.find((o) => o.id === refId) ?? null;
  const r = ratio ?? 1;

  // ── 봉인된 규칙 ──
  const base = override > 0 ? override : (ref?.price ?? 0);
  const effective = base * r;
  const source: 'override' | 'inherit' | 'none' = override > 0 ? 'override' : (ref ? 'inherit' : 'none');
  const sourceLabel = source === 'override' ? '직접 입력' : source === 'inherit' ? '상속' : '참조 없음';

  return (
    <div className="erpIVF">
      <div className="erpIVF-grid" data-ratio={onRatioChange ? '' : undefined}>
        <label className="erpIVF-field erpIVF-ref">
          <span className="erpIVF-lbl">{L.ref}</span>
          <Select
            size="sm"
            options={refOptions.map((o) => ({ value: o.id, label: o.label }))}
            value={refId}
            onChange={onRefChange}
            placeholder={placeholder ?? '항목 선택'}
          />
        </label>
        <label className="erpIVF-field">
          <span className="erpIVF-lbl">{L.override}</span>
          <CurrencyInput
            size="sm"
            value={override > 0 ? override : ''}
            placeholder={ref ? format(ref.price) : '상속값 없음'}
            onChange={(v) => onOverrideChange(toNum(v, 0))}
          />
        </label>
        {onRatioChange && (
          <label className="erpIVF-field erpIVF-ratio">
            <span className="erpIVF-lbl">{L.ratio}</span>
            <NumberInput size="sm" value={r} onChange={(v) => onRatioChange(toNum(v, 1))} />
          </label>
        )}
      </div>

      {/* 유효값 — 규칙 결과를 저작자에게 보여준다(출처 칩으로 상속/override 구분). */}
      <div className="erpIVF-eff">
        <span className="erpIVF-eff-lbl">{L.effective}</span>
        <span className="erpIVF-eff-val">
          {format(effective)}{ref?.unit ? ` / ${ref.unit}` : ''}
        </span>
        <span className="erpIVF-src" data-src={source}>{sourceLabel}{r !== 1 ? ` · ×${r}` : ''}</span>
      </div>
    </div>
  );
}
