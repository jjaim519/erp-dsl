'use client';
// OptionSetPicker 위젯 — 저작 면이 정의한 OptionSet을 읽어 *고르는* 선택 면. OptionSetEditor의 짝(같은 타입).
//  · selection별 대응(§4): single=단일선택 행 / quantity=스테퍼 행 / number=수치 스테퍼 행 — 한 그룹 배열의 단일 루프.
//  · 3모드는 소비처가 정한다(부품은 단계를 판단하지 않는다): idle(미진입 안내) / pick(중간 개체 선택) / configure(본 구성).
//  · CTA 잠금 절충(업계 조사 채택): 필수 미충족 시 주 CTA는 잠금 *스타일*이되 탭은 받는다 — 탭하면 첫 미충족
//    그룹으로 스크롤+강조(disabled 버튼의 접근성 문제 회피). blockedHint는 풋터에 상시 노출.
//  · 그룹 헤더 배지 전환: "필수" → 충족 시 체크+선택 요약(진행 안내를 헤더 한 자리에서 — 접힘 요약도 겸한다).
//  · 수치 입력은 min/max/step의 이탈 불가 입력기(NumberStepper)로 — 검증 대신 입력 자체를 제약. step 미지정=1.
//  · 도메인 무지·금액 계산 0(§6): amount·subtotal은 표시용 입력. 스크롤은 패널 내부(§6-4), 풋터 고정.
import { useRef, useState } from 'react';
import { Title } from './Title';
import { Text } from './Text';
import { Badge } from './Badge';
import { Button } from './Button';
import { Icon } from './Icon';
import { NumberStepper } from './NumberStepper';
import { EmptyState } from './EmptyState';
import { fmtCurrency } from './_cells';
import type { Choice, OptionGroup, OptionSelection } from './optionset';
import './optionset.css';

export type OptionSetPickerProps =
  | { mode: 'idle'; placeholder: string }                       // 아직 미진입 — 목차를 가리키는 안내
  | { mode: 'pick';                                             // 중간 개체 선택 단계(3단 소비처만)
      title: string;
      items: { id: string; label: string; sublabel?: string }[];
      onPick: (id: string) => void;
      emptyState?: { title: string; description?: string } }
  | { mode: 'configure';                                        // 본 구성 단계
      title: string;
      meta?: string;
      quantity?: { value: number; onChange: (n: number) => void };
      groups: OptionGroup[];
      selection: OptionSelection;
      onPick: (groupId: string, code: string) => void;
      onQty: (choiceId: string, qty: number) => void;
      onNum: (fieldKey: string, value: number) => void;
      subtotal: number;                                         // 표시만(§6)
      primary: { label: string; onClick: () => void };
      secondary?: { label: string; onClick: () => void };
      blockedHint?: string };                                   // 필수 미충족 시 풋터 문구

const SEARCH_THRESHOLD = 12;   // 값 총수가 이보다 크면 내부 검색 노출(그룹 다수 스캔 보조)

// 섹션 파생 — section 문자열이 같은 그룹끼리, 첫 등장 순서대로(§1-(d)-3: 의미 부여 없음).
function bySection(groups: OptionGroup[]): { label?: string; groups: OptionGroup[] }[] {
  const out: { label?: string; groups: OptionGroup[] }[] = [];
  for (const g of groups) {
    const hit = out.find((s) => s.label === g.section);
    if (hit) hit.groups.push(g);
    else out.push({ label: g.section, groups: [g] });
  }
  return out;
}

// 값 묶음(Choice.group) 파생 — 없는 값은 무묶음 선두, 있는 값은 첫 등장 순서대로 접이 소그룹.
function byChoiceGroup(choices: Choice[]): { label?: string; choices: Choice[] }[] {
  const out: { label?: string; choices: Choice[] }[] = [];
  for (const c of choices) {
    const hit = out.find((s) => s.label === c.group);
    if (hit) hit.choices.push(c);
    else out.push({ label: c.group, choices: [c] });
  }
  return out;
}

// 증분 표기 — 부호와 ₩ 사이 thin space(U+2009): 붙이면 +가 ₩ 왼쪽 획과 겹쳐 한 글자처럼 뭉개진다(실측).
const amt = (n?: number) => (n != null && n > 0 ? `+ ${fmtCurrency(n)}` : '');

export function OptionSetPicker(props: OptionSetPickerProps) {
  // 펼침·검색은 부품 내부 상태(§3-6). 기본 전부 펼침 — 필수 그룹 다수를 순서대로 채우는 면.
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const groupEls = useRef<Record<string, HTMLDivElement | null>>({});
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (props.mode === 'idle') {
    return (
      <div className="erpOSP">
        <div className="erpOSP-idle">
          <Icon name="arrow-right" size="lg" color="secondary" />
          <Text variant="body" color="secondary">{props.placeholder}</Text>
        </div>
      </div>
    );
  }

  if (props.mode === 'pick') {
    return (
      <div className="erpOSP">
        <div className="erpOSP-head">
          <div className="erpOSP-headInfo"><Title variant="subheading">{props.title}</Title></div>
        </div>
        <div className="erpOSP-body">
          {props.items.length === 0 ? (
            <EmptyState icon="search" title={props.emptyState?.title ?? '선택할 항목이 없습니다'} description={props.emptyState?.description} />
          ) : props.items.map((it) => (
            <div key={it.id} className="erpOSP-pickrow" role="button" tabIndex={0}
              onClick={() => props.onPick(it.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onPick(it.id); } }}>
              <span className="erpOSP-info">
                <span className="erpOSP-lbl">{it.label}</span>
                {it.sublabel && <span className="erpOSP-sub">{it.sublabel}</span>}
              </span>
              <Icon name="chevron-right" size="sm" color="secondary" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── configure ──
  const { groups, selection } = props;
  const toggle = (key: string) =>
    setClosed((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  const unmet = groups.filter((g) => g.selection === 'single' && g.required && !selection.picked[g.id]);
  const locked = unmet.length > 0;

  const handlePrimary = () => {
    if (!locked) { props.primary.onClick(); return; }
    const target = unmet[0];
    groupEls.current[target.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(target.id);
    flashTimer.current = setTimeout(() => setFlash(null), 1400);
  };

  const totalChoices = groups.reduce((s, g) => s + (g.choices?.length ?? 0), 0);
  const query = q.trim();
  const matches = (c: Choice) => query === '' || (c.label + (c.sublabel ?? '')).includes(query);

  const singleRow = (g: OptionGroup, c: Choice) => {
    const on = selection.picked[g.id] === c.code;
    return (
      <div key={c.id} className="erpOSP-row" role="button" tabIndex={0} data-on={on || undefined}
        onClick={() => props.onPick(g.id, c.code)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onPick(g.id, c.code); } }}>
        <span className="erpOSP-mark" data-on={on || undefined}>{on && <Icon name="check" size="sm" />}</span>
        <span className="erpOSP-info">
          <span className="erpOSP-lbl">{c.label}</span>
          {c.sublabel && <span className="erpOSP-sub">{c.sublabel}</span>}
        </span>
        {amt(c.amount) && <span className="erpOSP-amt">{amt(c.amount)}</span>}
      </div>
    );
  };

  const qtyRow = (c: Choice) => (
    <div key={c.id} className="erpOSP-row" data-on={(selection.qty[c.id] ?? 0) > 0 || undefined}>
      <span className="erpOSP-info">
        <span className="erpOSP-lbl">{c.label}</span>
        {c.sublabel && <span className="erpOSP-sub">{c.sublabel}</span>}
      </span>
      {amt(c.amount) && <span className="erpOSP-amt">{amt(c.amount)}</span>}
      <NumberStepper size="sm" value={selection.qty[c.id] ?? 0} onChange={(v) => props.onQty(c.id, v)} />
    </div>
  );

  const choiceRows = (g: OptionGroup) => {
    const visible = (g.choices ?? []).filter(matches);
    return byChoiceGroup(visible).map((sub, i) => {
      const subKey = `${g.id}:${sub.label ?? i}`;
      const subClosed = sub.label != null && closed.has(subKey);
      return (
        <div key={subKey}>
          {sub.label != null && (
            <div className="erpOSP-subhead" role="button" tabIndex={0} aria-expanded={!subClosed}
              onClick={() => toggle(subKey)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(subKey); } }}>
              <span className="erpOSP-chev" data-open={!subClosed || undefined}><Icon name="chevron-right" size="sm" /></span>
              {sub.label}
            </div>
          )}
          {!subClosed && sub.choices.map((c) => (g.selection === 'single' ? singleRow(g, c) : qtyRow(c)))}
        </div>
      );
    });
  };

  const numRows = (g: OptionGroup) => (g.fields ?? []).map((f) => (
    <div key={f.key} className="erpOSP-row">
      <span className="erpOSP-info"><span className="erpOSP-lbl">{f.label}</span></span>
      <NumberStepper size="sm"
        value={selection.nums[f.key] ?? f.value}
        min={f.min ?? 0} max={f.max} step={f.step ?? 1}
        onChange={(v) => props.onNum(f.key, v)} />
      {f.unit && <span className="erpOSP-unit">{f.unit}</span>}
    </div>
  ));

  // 접힘 헤더 요약 — single: 필수 배지→체크+선택 라벨 / quantity: 담긴 종·수.
  const groupState = (g: OptionGroup) => {
    if (g.selection === 'single') {
      const code = selection.picked[g.id];
      const picked = code != null ? g.choices?.find((c) => c.code === code) : undefined;
      if (picked) return <span className="erpOSP-done"><Icon name="check" size="sm" />{picked.label}</span>;
      if (g.required) return <Badge color="danger">필수</Badge>;
      return null;
    }
    if (g.selection === 'quantity') {
      const ins = (g.choices ?? []).filter((c) => (selection.qty[c.id] ?? 0) > 0);
      const total = ins.reduce((s, c) => s + (selection.qty[c.id] ?? 0), 0);
      if (ins.length > 0) return <span className="erpOSP-done"><Icon name="check" size="sm" />{ins.length}종 {total}개</span>;
    }
    return null;
  };

  const sections = bySection(groups);

  return (
    <div className="erpOSP">
      <div className="erpOSP-head">
        <div className="erpOSP-headInfo">
          <Title variant="subheading">{props.title}</Title>
          {props.meta && <Text variant="caption" color="secondary">{props.meta}</Text>}
        </div>
        {props.quantity && (
          <NumberStepper size="sm" min={1} value={props.quantity.value} onChange={props.quantity.onChange} />
        )}
      </div>
      {totalChoices > SEARCH_THRESHOLD && (
        <div className="erpOSP-search">
          <input className="erpOSP-searchInput" value={q} onChange={(e) => setQ(e.target.value)} placeholder="값 검색" />
        </div>
      )}
      <div className="erpOSP-body">
        {sections.map((sec, si) => (
          <div key={sec.label ?? si}>
            {sec.label != null && (
              <div className="erpOSP-sectionHd"><span className="erpOSP-sectionLbl">{sec.label}</span></div>
            )}
            {sec.groups.map((g) => {
              const open = !closed.has(g.id);
              const rows = g.selection === 'number' ? numRows(g) : choiceRows(g);
              if (query !== '' && g.selection !== 'number' && (g.choices ?? []).filter(matches).length === 0) return null;
              return (
                <div key={g.id} className="erpOSP-group" data-flash={flash === g.id || undefined}
                  ref={(el) => { groupEls.current[g.id] = el; }}>
                  <div className="erpOSP-ghead" role="button" tabIndex={0} aria-expanded={open}
                    onClick={() => toggle(g.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(g.id); } }}>
                    <span className="erpOSP-chev" data-open={open || undefined}><Icon name="chevron-right" size="sm" /></span>
                    <span className="erpOSP-gtitle">{g.label}</span>
                    {g.note && <span className="erpOSP-gnote">{g.note}</span>}
                    <span className="erpOSP-gstate">{groupState(g)}</span>
                  </div>
                  {open && rows}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="erpOSP-foot">
        {locked && props.blockedHint && (
          <span className="erpOSP-hint"><Icon name="alert-circle" size="sm" />{props.blockedHint}</span>
        )}
        <div className="erpOSP-footRow">
          <span className="erpOSP-subtl">
            <span className="lbl">소계</span>
            <span className="amt">{fmtCurrency(props.subtotal)}</span>
          </span>
          <span style={{ display: 'inline-flex', gap: 'var(--mantine-spacing-xs)', alignItems: 'center' }}>
            {props.secondary && <Button variant="secondary" size="sm" onClick={props.secondary.onClick}>{props.secondary.label}</Button>}
            <span className="erpOSP-cta" data-locked={locked || undefined}>
              <Button variant="primary" size="sm" onClick={handlePrimary}>{props.primary.label}</Button>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
