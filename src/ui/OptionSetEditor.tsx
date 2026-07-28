'use client';
// OptionSetEditor 위젯 — 선택지 묶음(OptionSet)을 *정의*하는 저작 면. OptionSetPicker의 짝(같은 타입을 쓰고 읽는다).
//  · 왜 별 부품: Repeater는 레코드 크롬만 소유하고 행 내부는 raw 슬롯이라, 소비처가 매번 손조립하면 같은
//    편집기가 화면마다 다르게 생긴다(실제 소비처에서 값 편집 폼이 4벌로 갈라졌다). 그 슬롯 안을 여기서 닫는다.
//  · 조립: 그룹=Repeater(접이) 안 값=Repeater(평면) + InheritedValueField(참조/override/배율) +
//    ExpressionField(수량식 — exprVariables 있을 때만) + KeyValueField(보정 — adjustKeys 있을 때만).
//  · 접힌 그룹 헤더 = selection 배지 + 값 개수 + ×배율(≠1일 때만) — 접힌 상태에서도 정보를 준다(잡음은 차단).
//  · 도메인 무지(헌법 1): section은 표시용 문자열, selection 3종만 안다. 금액 계산 0(§6) — 저장·검증은 소비처.
//    모든 쓰기 = onChange(groups) 하나. 접힘 상태만 내부(Repeater 소유).
import type { ReactNode } from 'react';
import { Stack } from './Stack';
import { Text } from './Text';
import { Badge } from './Badge';
import { FormField } from './FormField';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { CurrencyInput } from './CurrencyInput';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { SectionHeader } from './SectionHeader';
import { Repeater } from './Repeater';
import { InheritedValueField, type RefOption } from './InheritedValueField';
import { ExpressionField, type ExprVariable } from './ExpressionField';
import { KeyValueField, type KVKey } from './KeyValueField';
import type { Choice, NumberField, OptionGroup } from './optionset';
import './optionset.css';

export type OptionSetSection = { key: string; label: string; note?: string; description?: string };

type Props = {
  groups: OptionGroup[];                         // controlled
  onChange: (groups: OptionGroup[]) => void;     // 모든 쓰기는 이 하나로(부품은 저장을 모른다)
  /** 표시할 섹션과 순서. 여기 없는 section의 그룹은 렌더하지 않는다. */
  sections: OptionSetSection[];
  refOptions?: RefOption[];                      // 값의 참조 SSOT 후보 → InheritedValueField
  exprVariables?: ExprVariable[];                // 있으면 값 행에 수량식(ExpressionField) 노출
  adjustKeys?: KVKey[];                          // 있으면 값 행에 보정(KeyValueField) 노출
  sectionActions?: (sectionKey: string) => ReactNode;  // 헤더 우측 부가 액션 — 완전 위임
  readOnly?: boolean;
  emptyState?: { title: string; description?: string };
};

const SEL_OPTIONS = [
  { value: 'single', label: '택1 — 하나만 고른다' },
  { value: 'multi', label: '복수 택 — 여러 개 고른다(수량 없음)' },
  { value: 'quantity', label: '수량 — 값마다 개수' },
  { value: 'number', label: '수치 — 숫자를 입력' },
];
const SEL_LABEL: Record<OptionGroup['selection'], string> = { single: '택1', multi: '복수', quantity: '수량', number: '수치' };

const uid = () => 'os' + Math.random().toString(36).slice(2, 9);
const toNum = (v: number | string, fallback: number): number => {
  const n = typeof v === 'number' ? v : (v === '' ? NaN : Number(v));
  return Number.isFinite(n) ? n : fallback;
};
const toOpt = (v: number | string): number | undefined => {
  const n = typeof v === 'number' ? v : (v === '' ? NaN : Number(v));
  return Number.isFinite(n) ? n : undefined;
};

export function OptionSetEditor({
  groups, onChange, sections, refOptions, exprVariables, adjustKeys,
  sectionActions, readOnly, emptyState,
}: Props) {
  if (sections.length === 0) return null;  // §2-7-3 — 경계 명확화

  const setGroup = (id: string, patch: Partial<OptionGroup>) =>
    onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const setChoice = (gid: string, cid: string, patch: Partial<Choice>) =>
    onChange(groups.map((g) => (g.id === gid
      ? { ...g, choices: (g.choices ?? []).map((c) => (c.id === cid ? { ...c, ...patch } : c)) }
      : g)));
  // 수치 필드는 인덱스 정체성 — key는 편집 대상이라 정체 키로 쓰면 타이핑마다 행이 리마운트된다(포커스 유실).
  const setField = (gid: string, idx: number, patch: Partial<NumberField>) =>
    onChange(groups.map((g) => (g.id === gid
      ? { ...g, fields: (g.fields ?? []).map((f, j) => (j === idx ? { ...f, ...patch } : f)) }
      : g)));

  // 값 행 — 정체 4칸 + 가격 규칙(InheritedValueField) + 수량식/보정(옵션 행)
  const choiceBody = (g: OptionGroup, c: Choice) => (
    <Stack gap="sm">
      <div className="erpOSE-grid4">
        <FormField label="라벨"><TextInput size="sm" value={c.label} onChange={(v) => setChoice(g.id, c.id, { label: v })} disabled={readOnly} /></FormField>
        <FormField label="코드"><TextInput size="sm" value={c.code} onChange={(v) => setChoice(g.id, c.id, { code: v })} disabled={readOnly} /></FormField>
        <FormField label="보조 라벨"><TextInput size="sm" value={c.sublabel ?? ''} onChange={(v) => setChoice(g.id, c.id, { sublabel: v || undefined })} disabled={readOnly} /></FormField>
        <FormField label="값 묶음"><TextInput size="sm" value={c.group ?? ''} placeholder="없음" onChange={(v) => setChoice(g.id, c.id, { group: v || undefined })} disabled={readOnly} /></FormField>
        {g.selection === 'quantity' && (
          <FormField label="단위"><TextInput size="sm" value={c.unit ?? ''} placeholder="EA" onChange={(v) => setChoice(g.id, c.id, { unit: v || undefined })} disabled={readOnly} /></FormField>
        )}
      </div>
      {refOptions ? (
        <InheritedValueField
          refOptions={refOptions}
          refId={c.refId ?? null}
          onRefChange={(id) => setChoice(g.id, c.id, { refId: id })}
          override={c.override ?? 0}
          onOverrideChange={(v) => setChoice(g.id, c.id, { override: v })}
          ratio={c.ratio ?? 1}
          onRatioChange={(v) => setChoice(g.id, c.id, { ratio: v })}
        />
      ) : (
        <div className="erpOSE-grid4">
          <FormField label="값"><CurrencyInput size="sm" value={c.override ?? ''} onChange={(v) => setChoice(g.id, c.id, { override: toOpt(v) })} disabled={readOnly} /></FormField>
          <FormField label="배율"><NumberInput size="sm" value={c.ratio ?? 1} onChange={(v) => setChoice(g.id, c.id, { ratio: toNum(v, 1) })} disabled={readOnly} /></FormField>
        </div>
      )}
      {exprVariables && (
        <FormField label="수량식">
          <ExpressionField value={c.formula ?? ''} onChange={(v) => setChoice(g.id, c.id, { formula: v || undefined })} variables={exprVariables} />
        </FormField>
      )}
      {adjustKeys && adjustKeys.length > 0 && (
        <FormField label="보정">
          <KeyValueField keys={adjustKeys} value={c.adjust ?? {}} addLabel="보정 추가"
            onChange={(m) => setChoice(g.id, c.id, { adjust: Object.keys(m).length ? m : undefined })} />
        </FormField>
      )}
    </Stack>
  );

  // 수치 필드 행 — 라벨·키·단위·기본값 + 경계 3칸(min/max/step). 배율 줄 없음(§2-4).
  const fieldBody = (g: OptionGroup, f: NumberField, i: number) => (
    <Stack gap="sm">
      <div className="erpOSE-grid4">
        <FormField label="라벨"><TextInput size="sm" value={f.label} onChange={(v) => setField(g.id, i, { label: v })} disabled={readOnly} /></FormField>
        <FormField label="키"><TextInput size="sm" value={f.key} onChange={(v) => setField(g.id, i, { key: v })} disabled={readOnly} /></FormField>
        <FormField label="단위"><TextInput size="sm" value={f.unit ?? ''} onChange={(v) => setField(g.id, i, { unit: v || undefined })} disabled={readOnly} /></FormField>
        <FormField label="기본값"><NumberInput size="sm" value={f.value} onChange={(v) => setField(g.id, i, { value: toNum(v, 0) })} disabled={readOnly} /></FormField>
      </div>
      <div className="erpOSE-grid4">
        <FormField label="최소"><NumberInput size="sm" value={f.min ?? ''} onChange={(v) => setField(g.id, i, { min: toOpt(v) })} disabled={readOnly} /></FormField>
        <FormField label="최대"><NumberInput size="sm" value={f.max ?? ''} onChange={(v) => setField(g.id, i, { max: toOpt(v) })} disabled={readOnly} /></FormField>
        <FormField label="증분"><NumberInput size="sm" value={f.step ?? ''} placeholder="1" onChange={(v) => setField(g.id, i, { step: toOpt(v) })} disabled={readOnly} /></FormField>
      </div>
    </Stack>
  );

  const groupBody = (g: OptionGroup) => (
    <Stack gap="md">
      <div className="erpOSE-grid3">
        <FormField label="이름"><TextInput size="sm" value={g.label} onChange={(v) => setGroup(g.id, { label: v })} disabled={readOnly} /></FormField>
        <FormField label="선택 방식">
          <Select size="sm" options={SEL_OPTIONS} value={g.selection} disabled={readOnly}
            onChange={(v) => v && setGroup(g.id, { selection: v as OptionGroup['selection'] })} />
        </FormField>
        <FormField label="부가 표기"><TextInput size="sm" value={g.note ?? ''} placeholder="헤더 우측(단위 등)" onChange={(v) => setGroup(g.id, { note: v || undefined })} disabled={readOnly} /></FormField>
      </div>
      {g.selection !== 'number' && (
        <Checkbox label="필수 — 선택 0건이면 담기 잠금" checked={!!g.required} disabled={readOnly}
          onChange={(c) => setGroup(g.id, { required: c || undefined })} />
      )}
      {g.selection !== 'number' && (
        <div className="erpOSE-ratio">
          <span className="erpOSE-ratioLbl">그룹 배율</span>
          <span className="erpOSE-ratioInput">
            <NumberInput size="sm" value={g.ratio ?? 1} onChange={(v) => setGroup(g.id, { ratio: toNum(v, 1) })} disabled={readOnly} />
          </span>
          <span className="erpOSE-ratioNote">묶음 전체에 곱하는 상위 배율 — 적용은 소비처 파이프라인</span>
        </div>
      )}
      {g.selection === 'number' ? (
        <Repeater
          items={g.fields ?? []}
          addLabel="수치 필드 추가"
          onAdd={() => setGroup(g.id, { fields: [...(g.fields ?? []), { key: uid(), label: '', value: 0 }] })}
          onRemove={(i) => setGroup(g.id, { fields: (g.fields ?? []).filter((_, j) => j !== i) })}
          renderItem={(f, i) => fieldBody(g, f, i)}
          {...(readOnly ? { min: (g.fields ?? []).length, max: (g.fields ?? []).length } : {})}
        />
      ) : (
        <Repeater
          items={g.choices ?? []}
          addLabel="값 추가"
          itemKey={(c) => c.id}
          onAdd={() => setGroup(g.id, { choices: [...(g.choices ?? []), { id: uid(), code: '', label: '' }] })}
          onRemove={(i) => setGroup(g.id, { choices: (g.choices ?? []).filter((_, j) => j !== i) })}
          renderItem={(c) => choiceBody(g, c)}
          {...(readOnly ? { min: (g.choices ?? []).length, max: (g.choices ?? []).length } : {})}
        />
      )}
    </Stack>
  );

  const groupHeader = (g: OptionGroup) => {
    const n = g.selection === 'number' ? (g.fields?.length ?? 0) : (g.choices?.length ?? 0);
    const r = g.ratio ?? 1;
    return (
      <span className="erpOSE-ghead">
        <Text variant="body-strong">{g.label || '(이름 없음)'}</Text>
        <Badge color="neutral">{SEL_LABEL[g.selection]}</Badge>
        {g.selection === 'single' && g.required && <Badge color="warning">필수</Badge>}
        <span className="erpOSE-gmeta">
          {g.selection === 'number' ? `수치 ${n}개` : `값 ${n}개`}
          {r !== 1 ? ` · ×${r}` : ''}
        </span>
      </span>
    );
  };

  return (
    <div className="erpOSE" data-readonly={readOnly || undefined}>
      <div className="erpOSE-scroll">
        {sections.map((sec) => {
          const list = groups.filter((g) => g.section === sec.key);
          const extra = sectionActions?.(sec.key);
          return (
            <section key={sec.key}>
              <Stack gap="md">
                <SectionHeader
                  title={sec.label}
                  description={sec.description}
                  controls={(sec.note || extra) ? (
                    // 베이스라인 정렬 — 크기 다른 텍스트(캡션 note vs 버튼 라벨)를 박스 중앙정렬하면 글줄이 어긋난다(실측).
                    <span className="erpOSE-secCtl">
                      {sec.note && <Text variant="caption" color="secondary">{sec.note}</Text>}
                      {extra}
                    </span>
                  ) : undefined}
                  divider
                />
                <Repeater
                  items={list}
                  addLabel="그룹 추가"
                  itemKey={(g) => g.id}
                  onAdd={() => onChange([...groups, { id: uid(), label: '', section: sec.key, selection: 'single', choices: [] }])}
                  onRemove={(i) => { const t = list[i]; onChange(groups.filter((g) => g !== t)); }}
                  renderHeader={groupHeader}
                  renderItem={groupBody}
                  emptyState={emptyState ? { title: emptyState.title, description: emptyState.description } : undefined}
                  {...(readOnly ? { min: list.length, max: list.length } : {})}
                />
              </Stack>
            </section>
          );
        })}
      </div>
    </div>
  );
}
