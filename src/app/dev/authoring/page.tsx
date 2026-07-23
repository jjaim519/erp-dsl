'use client';
// 구성 모델 저작 — "조립 증명" (§7-2·3·4·5·6·7).
//  · 이 파일은 dev 앱(소비처 대역)이 소유한다. 도메인 모델(Product/Dimension/Option/OptionValue)과
//    저작 툴킷 부품(Repeater·InheritedValueField·ExpressionField·KeyValueField·AssignPicker) 사이의
//    "매핑"만 여기 있다 — 패키지(@/ui)는 '옵션·도어·치수'를 모른다(헌법 1). 이게 "역할만 넘긴다"의 실증.
//  · 증명 대상: 5부품 + 기존 원자로 옵션 저작 섹션 하나가 도메인 무지로 선다 → 나머지는 조립.
import { useState } from 'react';
import {
  Page, PageHeader, Card, Stack, Group, Text, Title, Divider,
  TextInput, NumberInput, SegmentedControl, Switch, FormField, Badge,
  Repeater, InheritedValueField, ExpressionField, KeyValueField, AssignPicker,
  type ExprVariable, type RefOption, type AssignTemplate,
} from '@/ui';

// ── 도메인 모델(소비처 소유) ──
type OptionValue = {
  id: string; value_code: string; label: string;
  option_item_id: string | null; override: number; price_ratio: number;
  dim_adjustments: Record<string, number>; quantity_formula: string;
};
type Kind = 'required' | 'appliance' | 'optional';
type OptionModel = {
  id: string; variable_name: string; label: string; kind: Kind;
  price_ratio: number; margin_exempt: boolean; values: OptionValue[];
};
type Dimension = { id: string; variable_name: string; label: string; default_value: number; min_value: number; max_value: number };
type Product = { space_name: string; door_price_ratio: number; dimensions: Dimension[]; options: OptionModel[] };

// ── SSOT 자재 단가(소비처 카탈로그 대역) — InheritedValueField.refOptions ──
const OPTION_ITEMS: RefOption[] = [
  { id: 'oi1', label: '일반 힌지 3인치', price: 1800, unit: 'EA', group: '경첩' },
  { id: 'oi2', label: '소프트힌지 3인치', price: 3200, unit: 'EA', group: '경첩' },
  { id: 'oi3', label: '수납형 힌지', price: 5400, unit: 'EA', group: '경첩' },
  { id: 'oi4', label: 'PET 도어 18T', price: 42000, unit: 'M²', group: '도어' },
];
// ── 옵션세트(템플릿) — AssignPicker.templates ──
const TEMPLATES: AssignTemplate[] = [
  { id: 't1', label: '기본 경첩 세트', kind: 'appliance', itemCount: 4 },
  { id: 't2', label: '프리미엄 힌지', kind: 'appliance', itemCount: 7 },
  { id: 't3', label: '빈 템플릿', kind: 'appliance', itemCount: 0 },
  { id: 't4', label: '도어 규격', kind: 'required', itemCount: 5 },
];

const KIND_TONE: Record<Kind, 'danger' | 'info' | 'neutral'> = { required: 'danger', appliance: 'info', optional: 'neutral' };
const KIND_OPTS = [{ label: 'required', value: 'required' }, { label: 'appliance', value: 'appliance' }, { label: 'optional', value: 'optional' }];

// id 발급(모듈 카운터 — Date/random 불필요).
let _uid = 100;
const nid = () => String(++_uid);

// 불변 갱신 헬퍼.
const upAt = <T,>(arr: T[], i: number, patch: Partial<T>): T[] => arr.map((x, j) => (j === i ? { ...x, ...patch } : x));
const rmAt = <T,>(arr: T[], i: number): T[] => arr.filter((_, j) => j !== i);

const INITIAL: Product = {
  space_name: '상부장', door_price_ratio: 1.15,
  dimensions: [
    { id: 'd1', variable_name: 'width_mm', label: '폭', default_value: 600, min_value: 300, max_value: 1200 },
    { id: 'd2', variable_name: 'height_mm', label: '높이', default_value: 720, min_value: 400, max_value: 900 },
  ],
  options: [
    {
      id: 'o1', variable_name: 'hinge', label: '경첩', kind: 'appliance', price_ratio: 1, margin_exempt: true,
      values: [
        { id: 'v1', value_code: 'soft', label: '소프트클로징', option_item_id: 'oi2', override: 0, price_ratio: 1, dim_adjustments: { width_mm: 30 }, quantity_formula: "CEIL(dimensions.width_mm / 600) * 2" },
        { id: 'v2', value_code: 'std', label: '일반', option_item_id: 'oi1', override: 0, price_ratio: 1, dim_adjustments: {}, quantity_formula: "CEIL(dimensions.width_mm / 600)" },
      ],
    },
    { id: 'o2', variable_name: 'door_spec', label: '도어', kind: 'required', price_ratio: 1, margin_exempt: false, values: [] },
  ],
};

export default function AuthoringProof() {
  const [product, setProduct] = useState<Product>(INITIAL);

  // ExpressionField 변수(치수 + 옵션·value_code 리터럴) — 실시간 파생.
  const exprVars: ExprVariable[] = [
    ...product.dimensions.map((d) => ({ path: `dimensions.${d.variable_name}`, label: d.label, group: '치수' })),
    ...product.options.map((o) => ({ path: `options.${o.variable_name}`, label: o.label, group: '옵션', values: o.values.map((v) => ({ code: v.value_code, label: v.label })) })),
  ];
  // KeyValueField 키 = 품목 dimensions.
  const dimKeys = product.dimensions.map((d) => ({ key: d.variable_name, label: `${d.variable_name} · ${d.label}` }));

  const setDim = (i: number, patch: Partial<Dimension>) => setProduct((p) => ({ ...p, dimensions: upAt(p.dimensions, i, patch) }));
  const setOpt = (i: number, patch: Partial<OptionModel>) => setProduct((p) => ({ ...p, options: upAt(p.options, i, patch) }));
  const setVal = (oi: number, vi: number, patch: Partial<OptionValue>) =>
    setProduct((p) => ({ ...p, options: p.options.map((o, j) => (j === oi ? { ...o, values: upAt(o.values, vi, patch) } : o)) }));

  return (
    <Page>
      <Stack gap="lg">
        <PageHeader
          title="구성 모델 저작"
          meta={[{ kind: 'text', label: 'EstimateItem #A-1042 바인딩 · unit_label 상속: EA' }, { kind: 'badge', label: '조립 증명', tone: 'info' }]}
          actions={[{ label: '저장', variant: 'primary', icon: 'save', onClick: () => {} }]}
        />

        {/* 품목 헤더 */}
        <Card variant="elevated" padding="lg">
          <Group gap="lg" align="end">
            <FormField label="space_name"><TextInput value={product.space_name} onChange={(v) => setProduct((p) => ({ ...p, space_name: v }))} /></FormField>
            <div style={{ width: 160 }}>
              <FormField label="door_price_ratio (§4.3)"><NumberInput value={product.door_price_ratio} onChange={(v) => setProduct((p) => ({ ...p, door_price_ratio: typeof v === 'number' ? v : Number(v) || 1 }))} /></FormField>
            </div>
          </Group>
        </Card>

        {/* 치수 — Repeater(평면) */}
        <Card variant="elevated" padding="lg">
          <Stack gap="sm">
            <Title variant="subheading">치수</Title>
            <Repeater
              items={product.dimensions}
              itemKey={(d) => d.id}
              addLabel="치수 추가"
              min={1}
              onAdd={() => setProduct((p) => ({ ...p, dimensions: [...p.dimensions, { id: nid(), variable_name: `dim_${p.dimensions.length + 1}`, label: '새 치수', default_value: 0, min_value: 0, max_value: 0 }] }))}
              onRemove={(i) => setProduct((p) => ({ ...p, dimensions: rmAt(p.dimensions, i) }))}
              renderItem={(d, i) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 90px 90px', gap: 'var(--mantine-spacing-sm)', alignItems: 'end' }}>
                  <FormField label="variable_name"><TextInput value={d.variable_name} onChange={(v) => setDim(i, { variable_name: v })} /></FormField>
                  <FormField label="label"><TextInput value={d.label} onChange={(v) => setDim(i, { label: v })} /></FormField>
                  <FormField label="default"><NumberInput value={d.default_value} onChange={(v) => setDim(i, { default_value: Number(v) || 0 })} /></FormField>
                  <FormField label="min"><NumberInput value={d.min_value} onChange={(v) => setDim(i, { min_value: Number(v) || 0 })} /></FormField>
                  <FormField label="max"><NumberInput value={d.max_value} onChange={(v) => setDim(i, { max_value: Number(v) || 0 })} /></FormField>
                </div>
              )}
            />
          </Stack>
        </Card>

        {/* 옵션 — Repeater(접이) + AssignPicker(배정) */}
        <Card variant="elevated" padding="lg">
          <Stack gap="sm">
            <Group justify="between" align="center">
              <Title variant="subheading">옵션</Title>
              <AssignPicker
                templates={TEMPLATES}
                kind="appliance"
                confirmReapply
                onAssign={(id) => {
                  const t = TEMPLATES.find((x) => x.id === id);
                  setProduct((p) => ({ ...p, options: [...p.options, { id: nid(), variable_name: `opt_${p.options.length + 1}`, label: t?.label ?? '배정됨', kind: 'appliance', price_ratio: 1, margin_exempt: true, values: [] }] }));
                }}
              />
            </Group>

            <Repeater
              items={product.options}
              itemKey={(o) => o.id}
              addLabel="옵션 추가"
              defaultOpen
              onAdd={() => setProduct((p) => ({ ...p, options: [...p.options, { id: nid(), variable_name: `opt_${p.options.length + 1}`, label: '새 옵션', kind: 'optional', price_ratio: 1, margin_exempt: false, values: [] }] }))}
              onRemove={(i) => setProduct((p) => ({ ...p, options: rmAt(p.options, i) }))}
              renderHeader={(o) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{o.variable_name}</span>
                  <Text variant="body-strong">{o.label}</Text>
                  <Badge color={KIND_TONE[o.kind]}>{o.kind}</Badge>
                </span>
              )}
              renderItem={(o, oi) => (
                <Stack gap="md">
                  {/* 옵션 헤더 필드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--mantine-spacing-sm)', alignItems: 'end' }}>
                    <FormField label="variable_name"><TextInput value={o.variable_name} onChange={(v) => setOpt(oi, { variable_name: v })} /></FormField>
                    <FormField label="label"><TextInput value={o.label} onChange={(v) => setOpt(oi, { label: v })} /></FormField>
                    <div style={{ gridColumn: 'span 2' }}>
                      <FormField label="kind (§5-2)"><SegmentedControl fullWidth options={KIND_OPTS} value={o.kind} onChange={(v) => setOpt(oi, { kind: v as Kind })} /></FormField>
                    </div>
                    <FormField label="price_ratio (§4.2)"><NumberInput value={o.price_ratio} onChange={(v) => setOpt(oi, { price_ratio: Number(v) || 1 })} /></FormField>
                    <FormField label="margin_exempt"><div style={{ height: 34, display: 'flex', alignItems: 'center' }}><Switch checked={o.margin_exempt} onChange={(c) => setOpt(oi, { margin_exempt: c })} /></div></FormField>
                  </div>

                  <Divider />

                  {/* 값 — 중첩 Repeater */}
                  <Stack gap="xs">
                    <Text variant="caption" color="secondary">선택지(값) · {o.values.length}</Text>
                    <Repeater
                      items={o.values}
                      itemKey={(v) => v.id}
                      addLabel="값 추가"
                      onAdd={() => setOpt(oi, { values: [...o.values, { id: nid(), value_code: `code_${o.values.length + 1}`, label: '새 값', option_item_id: null, override: 0, price_ratio: 1, dim_adjustments: {}, quantity_formula: '' }] })}
                      onRemove={(vi) => setOpt(oi, { values: rmAt(o.values, vi) })}
                      renderHeader={(v) => (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.value_code}</span>
                          <Text variant="body-strong">{v.label}</Text>
                        </span>
                      )}
                      renderItem={(v, vi) => (
                        <Stack gap="sm">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-sm)' }}>
                            <FormField label="value_code"><TextInput value={v.value_code} onChange={(val) => setVal(oi, vi, { value_code: val })} /></FormField>
                            <FormField label="label"><TextInput value={v.label} onChange={(val) => setVal(oi, vi, { label: val })} /></FormField>
                          </div>
                          {/* §4.1 참조+상속+override 봉인 */}
                          <FormField label="단가 (§4.1 SSOT 상속/override × 배율)">
                            <InheritedValueField
                              refOptions={OPTION_ITEMS}
                              refId={v.option_item_id}
                              onRefChange={(id) => setVal(oi, vi, { option_item_id: id })}
                              override={v.override}
                              onOverrideChange={(n) => setVal(oi, vi, { override: n })}
                              ratio={v.price_ratio}
                              onRatioChange={(n) => setVal(oi, vi, { price_ratio: n })}
                            />
                          </FormField>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--mantine-spacing-md)', alignItems: 'start' }}>
                            <FormField label="dim_adjustments (§4.4)">
                              <KeyValueField keys={dimKeys} value={v.dim_adjustments} onChange={(m) => setVal(oi, vi, { dim_adjustments: m })} addLabel="보정 추가" />
                            </FormField>
                            <FormField label="quantity_formula (§4.5)">
                              <ExpressionField value={v.quantity_formula} onChange={(s) => setVal(oi, vi, { quantity_formula: s })} variables={exprVars} />
                            </FormField>
                          </div>
                        </Stack>
                      )}
                    />
                  </Stack>
                </Stack>
              )}
            />
          </Stack>
        </Card>

        <Text variant="caption" color="secondary">
          이 화면의 @/ui 부품은 &apos;옵션·도어·치수&apos;를 모른다 — Product↔부품 매핑은 이 파일(소비처 대역)이 소유. §7-2·3·4·5·6·7을 5부품으로 조립.
        </Text>
      </Stack>
    </Page>
  );
}
