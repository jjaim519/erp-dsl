'use client';
// OptionSetPicker 위젯 — 저작 면이 정의한 OptionSet을 읽어 *고르는* 선택 면. OptionSetEditor의 짝(같은 타입).
//  · 표현 어휘(닫힌 집합, ListWidget align 문법 — 자동 도출 + 닫힌 override):
//      single·multi → chips(≤5) | grid(6~10, 2열) | filtered(>10·값묶음 有 — 필터 칩+단일 목록) | list | segmented | select
//      quantity     → stepper(기본) | collect(>10 자동 — 빈 행=이름·금액 행 전체 버튼, 담긴 행=✓·스테퍼·행 소계·단위·상단 고정) | grid
//      number       → input(범위 넓거나 무한 자동 — 타이핑, blur에 min/max 스냅) | stepper
//    override는 display prop(그룹 id → 표현). 표현은 데이터가 아니다 — §1 타입 불변(CalendarPage encoding 동형).
//  · 접힘 모델(실검토 확정): 선택·입력은 접힘을 유발하지 않는다(가격 횡단 비교 보존). 접힘의 자동은 초기값
//    (defaultCollapsed, 기본 'satisfied')뿐이고, 이후엔 헤더 토글 + "다음" 진행 액션(현재 접고 다음 펼침·이동)이 전부.
//    collapseOnPick은 opt-in. openGroups/onToggleGroup으로 controlled 승격(ListWidget 선례).
//  · 스크롤·강조는 *패널 내부 스크롤만* 움직인다(페이지 불변). 그룹 헤더는 sticky(긴 그룹 스크롤 중 맥락 유지, R2 C-4).
//  · 그룹 1개 + 섹션 없음 → 그룹 헤더 자동 생략(E-1 2안: "골라 담는 면" = 그룹 1개짜리 configure. 스위치 prop 없음).
//  · 검색: search prop으로 소비처가 끄거나 임계·문구 지정(R2 B-2). 대상=라벨+보조+값묶음, 공백·대소문자 정규화(D-2).
//    검색 중에도 미충족 필수 그룹 헤더는 지우지 않는다(D-1 — 막다른 상태 차단).
//  · CTA 잠금 절충: 필수 미충족 시 잠금 스타일이되 탭은 받는다 → 첫 미충족 그룹 스크롤+강조. 필수=라벨 옆 별표
//    (FormField withAsterisk 어휘). 헤더 수량 스테퍼는 quantity prop 생략 시 미노출(소비처 선택).
//  · 도메인 무지·금액 계산 0(§6): amount·subtotal은 표시용 입력. 예외 1: 행 소계(amount×수량)는 주입된 두 수의
//    표시 산술(InheritedValueField 유효값과 동류)로 허용한다.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { Title } from './Title';
import { Text } from './Text';
import { Button } from './Button';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { NumberInput } from './NumberInput';
import { NumberStepper } from './NumberStepper';
import { SegmentedControl } from './SegmentedControl';
import { Select } from './Select';
import { EmptyState } from './EmptyState';
import { fmtCurrency } from './_cells';
import type { Choice, NumberField, OptionGroup, OptionSelection } from './optionset';
import './optionset.css';

/** 그룹 표현 override — selection과 안 맞는 값은 무시(자동 도출로 폴백). */
export type OptionGroupDisplay =
  | 'list' | 'chips' | 'grid' | 'segmented' | 'select' | 'filtered'   // single·multi (filtered·grid·list는 quantity에도 허용)
  | 'stepper' | 'collect'                                             // quantity
  | 'input';                                                          // number

/** ref 명령(R2 B-3) — 소비처가 카드 밖(진행 표시·목차)에서 이동을 걸 수 있다. */
export type OptionSetPickerHandle = {
  focusGroup: (groupId: string) => void;
  focusUnmet: () => void;
};

export type OptionSetPickerProps =
  | { mode: 'idle'; placeholder: string }
  | { mode: 'pick';
      title: string;
      items: { id: string; label: string; sublabel?: string }[];
      onPick: (id: string) => void;
      secondary?: { label: string; onClick: () => void };             // 뒤로가기 등(R2 §6-6)
      emptyState?: { title: string; description?: string } }
  | { mode: 'configure';
      title: string;
      path?: string[];                                                // 계층 경로 제목 — 길면 앞을 생략(R2 §6-7)
      meta?: string;
      quantity?: { value: number; onChange: (n: number) => void };    // 생략 = 헤더 스테퍼 미노출
      groups: OptionGroup[];
      selection: OptionSelection;
      display?: Record<string, OptionGroupDisplay>;
      search?: false | { threshold?: number; placeholder?: string };  // 기본 { threshold: 12 }
      defaultCollapsed?: 'satisfied' | 'all' | 'none' | string[];     // 초기 접힘(기본 'satisfied')
      collapseOnPick?: boolean;                                       // 택 그룹에서 고르면 접기(opt-in)
      openGroups?: string[];                                          // controlled 승격(onToggleGroup과 짝)
      onToggleGroup?: (groupId: string, open: boolean) => void;
      onPick: (groupId: string, code: string) => void;
      onPickMany?: (groupId: string, codes: string[]) => void;        // multi 축(§1 pickedMany)
      onQty: (choiceId: string, qty: number) => void;
      onNum: (fieldKey: string, value: number) => void;
      onUnmetChange?: (groupIds: string[]) => void;                   // 미충족 목록 스트림(진행 표시용)
      subtotal: number;
      primary: { label: string; onClick: () => void };
      secondary?: { label: string; onClick: () => void };
      blockedHint?: string };

const DEFAULT_SEARCH_THRESHOLD = 12;
const AUTO_FILTERED_OVER = 10;   // 택 값이 이보다 많고 값묶음이 있으면 filtered
const AUTO_COLLECT_OVER = 10;    // 수량 값이 이보다 많으면 collect

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
const isPicked = (sel: OptionSelection, g: OptionGroup, code: string) =>
  g.selection === 'multi' ? (sel.pickedMany?.[g.id] ?? []).includes(code) : sel.picked[g.id] === code;

const SINGLE_DISPLAYS = new Set<OptionGroupDisplay>(['list', 'chips', 'grid', 'segmented', 'select', 'filtered']);
const QTY_DISPLAYS = new Set<OptionGroupDisplay>(['stepper', 'collect', 'grid', 'list', 'filtered']);
function resolveDisplay(g: OptionGroup, override?: OptionGroupDisplay): OptionGroupDisplay {
  const n = g.choices?.length ?? 0;
  const hasGroups = (g.choices ?? []).some((c) => c.group);
  if (g.selection === 'single' || g.selection === 'multi') {
    if (override && SINGLE_DISPLAYS.has(override)) return override;
    return n <= 5 ? 'chips' : n <= 10 ? 'grid' : hasGroups ? 'filtered' : 'list';
  }
  if (override && QTY_DISPLAYS.has(override)) return override;
  return n > AUTO_COLLECT_OVER ? 'collect' : 'stepper';
}
const fieldMode = (f: NumberField): 'stepper' | 'input' =>
  f.max == null || (f.max - (f.min ?? 0)) / (f.step ?? 1) > 40 ? 'input' : 'stepper';

function bySection(groups: OptionGroup[]): { label?: string; groups: OptionGroup[] }[] {
  const out: { label?: string; groups: OptionGroup[] }[] = [];
  for (const g of groups) {
    const hit = out.find((s) => s.label === g.section);
    if (hit) hit.groups.push(g);
    else out.push({ label: g.section, groups: [g] });
  }
  return out;
}
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
const amt = (n?: number) => (n != null && n > 0 ? `+ ${fmtCurrency(n)}` : '');
const labelWithAmt = (c: Choice) => `${c.label}${amt(c.amount) ? ` ${amt(c.amount)}` : ''}`;

const qsum = (sel: OptionSelection, g: OptionGroup) => (g.choices ?? []).reduce((s, c) => s + (sel.qty[c.id] ?? 0), 0);
const isSatisfied = (sel: OptionSelection, g: OptionGroup): boolean => {
  if (g.selection === 'single') return !!sel.picked[g.id];
  if (g.selection === 'multi') return (sel.pickedMany?.[g.id] ?? []).length > 0;
  if (g.selection === 'quantity') return qsum(sel, g) > 0;
  return true; // number는 기본값이 곧 값
};

function keyActivate(e: React.KeyboardEvent, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
}

export const OptionSetPicker = forwardRef<OptionSetPickerHandle, OptionSetPickerProps>(function OptionSetPicker(props, ref) {
  // 내부 상태(§3-6): 접힘(uncontrolled 초기값 — defaultCollapsed 정책)·검색어·값묶음 필터·강조.
  const [openSet, setOpenSet] = useState<Set<string>>(() => {
    if (props.mode !== 'configure') return new Set();
    const dc = props.defaultCollapsed ?? 'satisfied';
    const open = new Set<string>();
    for (const g of props.groups) {
      const shouldOpen =
        dc === 'none' ? true :
        dc === 'all' ? false :
        Array.isArray(dc) ? !dc.includes(g.id) :
        /* 'satisfied' — 필수 미충족·담긴 그룹·수치는 펼침, 안 담긴 선택 그룹은 접힘 */
        g.selection === 'number' ? true : (!!g.required && !isSatisfied(props.selection, g)) || isSatisfied(props.selection, g);
      if (shouldOpen) open.add(g.id);
    }
    return open;
  });
  const [flash, setFlash] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filterBy, setFilterBy] = useState<Record<string, string>>({});   // 그룹 id → 값묶음 라벨('' = 전체)
  const bodyEl = useRef<HTMLDivElement | null>(null);
  const groupEls = useRef<Record<string, HTMLDivElement | null>>({});
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cfg = props.mode === 'configure' ? props : null;
  const controlled = !!cfg?.openGroups;
  const isOpen = (id: string) => (controlled ? cfg!.openGroups!.includes(id) : openSet.has(id));
  const setOpen = (id: string, open: boolean) => {
    if (controlled) { cfg?.onToggleGroup?.(id, open); return; }
    setOpenSet((s) => { const n = new Set(s); if (open) n.add(id); else n.delete(id); return n; });
    cfg?.onToggleGroup?.(id, open);
  };

  // 패널 내부 스크롤만 — scrollIntoView는 페이지까지 끌고 올라간다(실검토).
  const scrollToGroup = (id: string) => {
    const body = bodyEl.current, el = groupEls.current[id];
    if (!body || !el) return;
    const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 2;
    body.scrollTo({ top, behavior: 'smooth' });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(null);
    requestAnimationFrame(() => setFlash(id));
    flashTimer.current = setTimeout(() => setFlash(null), 1400);
  };

  const unmet = cfg ? cfg.groups.filter((g) => g.required && g.selection !== 'number' && !isSatisfied(cfg.selection, g)) : [];
  const unmetKey = unmet.map((g) => g.id).join('|');
  const onUnmetChange = cfg?.onUnmetChange;
  useEffect(() => {
    onUnmetChange?.(unmetKey === '' ? [] : unmetKey.split('|'));
  }, [unmetKey, onUnmetChange]);

  useImperativeHandle(ref, () => ({
    focusGroup: (id: string) => { setOpen(id, true); requestAnimationFrame(() => scrollToGroup(id)); },
    focusUnmet: () => { const t = unmet[0]; if (t) { setOpen(t.id, true); requestAnimationFrame(() => scrollToGroup(t.id)); } },
  }));

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
          {props.secondary && <Button variant="secondary" size="sm" onClick={props.secondary.onClick}>{props.secondary.label}</Button>}
        </div>
        <div className="erpOSP-body">
          {props.items.length === 0 ? (
            <EmptyState icon="search" title={props.emptyState?.title ?? '선택할 항목이 없습니다'} description={props.emptyState?.description} />
          ) : props.items.map((it) => (
            <div key={it.id} className="erpOSP-pickrow" role="button" tabIndex={0}
              onClick={() => props.onPick(it.id)} onKeyDown={(e) => keyActivate(e, () => props.onPick(it.id))}>
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
  const headerless = groups.length === 1 && groups[0].section == null;   // E-1 2안 — 골라 담는 면
  const locked = unmet.length > 0;

  const pick = (g: OptionGroup, code: string) => {
    if (g.selection === 'multi') {
      const cur = selection.pickedMany?.[g.id] ?? [];
      props.onPickMany?.(g.id, cur.includes(code) ? cur.filter((x) => x !== code) : [...cur, code]);
    } else {
      props.onPick(g.id, code);
    }
    if (props.collapseOnPick && !headerless) setOpen(g.id, false);
  };

  const handlePrimary = () => {
    if (!locked) { props.primary.onClick(); return; }
    const target = unmet[0];
    setOpen(target.id, true);
    requestAnimationFrame(() => scrollToGroup(target.id));
  };

  // 검색(B-2·D-2) — 대상: 라벨+보조+값묶음, 공백·대소문자 정규화.
  const searchCfg = props.search;
  const threshold = searchCfg === false ? Infinity : (searchCfg?.threshold ?? DEFAULT_SEARCH_THRESHOLD);
  const totalChoices = groups.reduce((s, g) => s + (g.choices?.length ?? 0), 0);
  const showSearch = searchCfg !== false && totalChoices > threshold;
  const query = norm(q);
  const matches = (c: Choice) => query === '' || norm(c.label + (c.sublabel ?? '') + (c.group ?? '')).includes(query);

  const unitTag = (c: Choice) => (c.unit ? <span className="erpOSP-unit">{c.unit}</span> : null);
  // 행 소계(A-4) — 담긴 행은 증분 대신 amount×수량. 주입된 두 수의 표시 산술(§6 예외).
  const qtyAmt = (c: Choice) => {
    const n = selection.qty[c.id] ?? 0;
    if (n > 0 && c.amount != null && c.amount > 0) return <span className="erpOSP-amt" data-strong>{fmtCurrency(c.amount * n)}</span>;
    return amt(c.amount) ? <span className="erpOSP-amt">{amt(c.amount)}</span> : null;
  };

  const markRow = (g: OptionGroup, c: Choice) => {
    const on = isPicked(selection, g, c.code);
    return (
      <div key={c.id} className="erpOSP-row" role="button" tabIndex={0} data-on={on || undefined}
        onClick={() => pick(g, c.code)} onKeyDown={(e) => keyActivate(e, () => pick(g, c.code))}>
        <span className="erpOSP-mark" data-on={on || undefined} data-multi={g.selection === 'multi' || undefined}>
          {on && <Icon name="check" size="sm" />}
        </span>
        <span className="erpOSP-info">
          <span className="erpOSP-lbl">{c.label}</span>
          {c.sublabel && <span className="erpOSP-sub">{c.sublabel}</span>}
        </span>
        {amt(c.amount) && <span className="erpOSP-amt">{amt(c.amount)}</span>}
      </div>
    );
  };

  const qtyRow = (g: OptionGroup, c: Choice) => (
    <div key={c.id} className="erpOSP-row" data-on={(selection.qty[c.id] ?? 0) > 0 || undefined}>
      <span className="erpOSP-info">
        <span className="erpOSP-lbl">{c.label}</span>
        {c.sublabel && <span className="erpOSP-sub">{c.sublabel}</span>}
      </span>
      {qtyAmt(c)}
      <NumberStepper size="sm" value={selection.qty[c.id] ?? 0} onChange={(v) => props.onQty(c.id, v)} />
      {unitTag(c)}
    </div>
  );

  const subheadRows = (g: OptionGroup, visible: Choice[], row: (c: Choice) => ReactNode) =>
    byChoiceGroup(visible).map((sub, i) => (
      <div key={`${g.id}:${sub.label ?? i}`}>
        {sub.label != null && <div className="erpOSP-subhead">{sub.label}</div>}
        {sub.choices.map(row)}
      </div>
    ));

  // 값묶음 필터 칩(C-3) — 접기 두 겹 대신 "한 묶음만 보기". filtered·collect 공용.
  const filterChips = (g: OptionGroup, all: Choice[]) => {
    const groupsOf = [...new Set(all.filter((c) => c.group).map((c) => c.group as string))];
    if (groupsOf.length === 0) return null;
    const cur = filterBy[g.id] ?? '';
    const setF = (v: string) => setFilterBy((m) => ({ ...m, [g.id]: v }));
    return (
      <div className="erpOSP-fchips">
        <button type="button" className="erpOSP-fchip" data-on={cur === '' || undefined} onClick={() => setF('')}>
          전체<span className="n">{all.length}</span>
        </button>
        {groupsOf.map((lbl) => (
          <button key={lbl} type="button" className="erpOSP-fchip" data-on={cur === lbl || undefined} onClick={() => setF(lbl)}>
            {lbl}<span className="n">{all.filter((c) => c.group === lbl).length}</span>
          </button>
        ))}
      </div>
    );
  };
  const applyFilter = (g: OptionGroup, list: Choice[]) => {
    const cur = filterBy[g.id] ?? '';
    return cur === '' ? list : list.filter((c) => c.group === cur);
  };

  // collect(C-1·C-2) — 빈 행=이름·금액(행 전체 버튼, 클릭=1 담김) / 담긴 행=✓·스테퍼·행 소계·단위, 상단 소구획 고정.
  const collectBody = (g: OptionGroup) => {
    const all = g.choices ?? [];
    const pinned = all.filter((c) => (selection.qty[c.id] ?? 0) > 0);
    const rest = applyFilter(g, all.filter((c) => !((selection.qty[c.id] ?? 0) > 0) && matches(c)));
    const pcount = pinned.reduce((s, c) => s + (selection.qty[c.id] ?? 0), 0);
    return (
      <>
        {filterChips(g, all)}
        {pinned.length > 0 && (
          <div className="erpOSP-pin">
            <div className="erpOSP-pinLbl"><Icon name="check" size="sm" />담음 {pinned.length}종 {pcount}개</div>
            {pinned.map((c) => (
              <div key={c.id} className="erpOSP-row" data-on>
                <span className="erpOSP-mark" data-on><Icon name="check" size="sm" /></span>
                <span className="erpOSP-info"><span className="erpOSP-lbl">{c.label}</span></span>
                {qtyAmt(c)}
                <NumberStepper size="sm" value={selection.qty[c.id] ?? 0} onChange={(v) => props.onQty(c.id, v)} />
                {unitTag(c)}
              </div>
            ))}
          </div>
        )}
        {rest.map((c) => (
          <div key={c.id} className="erpOSP-row" role="button" tabIndex={0}
            onClick={() => props.onQty(c.id, 1)} onKeyDown={(e) => keyActivate(e, () => props.onQty(c.id, 1))}>
            <span className="erpOSP-mark" />
            <span className="erpOSP-info">
              <span className="erpOSP-lbl">{c.label}{c.group && <span className="erpOSP-gtag"> {c.group}</span>}</span>
              {c.sublabel && <span className="erpOSP-sub">{c.sublabel}</span>}
            </span>
            {amt(c.amount) && <span className="erpOSP-amt">{amt(c.amount)}</span>}
          </div>
        ))}
        {rest.length === 0 && pinned.length === 0 && <div className="erpOSP-none">결과가 없습니다.</div>}
      </>
    );
  };

  const choiceBody = (g: OptionGroup, mode: OptionGroupDisplay) => {
    const visible = (g.choices ?? []).filter(matches);
    if (mode === 'collect') return collectBody(g);
    if (mode === 'chips') {
      return (
        <div className="erpOSP-chips">
          {visible.map((c) => (
            <Chip key={c.id} selected={isPicked(selection, g, c.code)} onChange={() => pick(g, c.code)}>
              {labelWithAmt(c)}
            </Chip>
          ))}
        </div>
      );
    }
    if (mode === 'segmented') {
      return (
        <div className="erpOSP-inlineCtl">
          <SegmentedControl size="sm" fullWidth
            options={visible.map((c) => ({ value: c.code, label: labelWithAmt(c) }))}
            value={selection.picked[g.id] ?? ''}
            onChange={(v) => pick(g, v)} />
        </div>
      );
    }
    if (mode === 'select') {
      return (
        <div className="erpOSP-inlineCtl">
          <Select size="sm" placeholder="선택"
            options={visible.map((c) => ({ value: c.code, label: labelWithAmt(c) }))}
            value={selection.picked[g.id] ?? null}
            onChange={(v) => { if (v != null) pick(g, v); }} />
        </div>
      );
    }
    const row = g.selection === 'quantity' ? (c: Choice) => qtyRow(g, c) : (c: Choice) => markRow(g, c);
    if (mode === 'filtered') {
      const list = applyFilter(g, visible);
      return (<>{filterChips(g, g.choices ?? [])}{list.map(row)}{list.length === 0 && <div className="erpOSP-none">결과가 없습니다.</div>}</>);
    }
    const rows = subheadRows(g, visible, row);
    if (mode === 'grid') return <div className="erpOSP-grid2">{rows}</div>;
    return rows; // 'list' | 'stepper'
  };

  const numRow = (f: NumberField, mode: 'stepper' | 'input') => {
    const value = selection.nums[f.key] ?? f.value;
    const clamp = (n: number) => {
      let v = n;
      if (f.min != null && v < f.min) v = f.min;
      if (f.max != null && v > f.max) v = f.max;
      return v;
    };
    return (
      <div key={f.key} className="erpOSP-row">
        <span className="erpOSP-info"><span className="erpOSP-lbl">{f.label}</span></span>
        {mode === 'input' ? (
          <span onBlur={() => { const c = clamp(value); if (c !== value) props.onNum(f.key, c); }}>
            <NumberInput size="sm" value={value}
              onChange={(v) => { const n = typeof v === 'number' ? v : Number(v); if (Number.isFinite(n)) props.onNum(f.key, n); }} />
          </span>
        ) : (
          <NumberStepper size="sm" value={value} min={f.min ?? 0} max={f.max} step={f.step ?? 1}
            onChange={(v) => props.onNum(f.key, v)} />
        )}
        {f.unit && <span className="erpOSP-unit">{f.unit}</span>}
        {mode === 'input' && f.min != null && f.max != null && <span className="erpOSP-range">{f.min}–{f.max}</span>}
      </div>
    );
  };
  const numBody = (g: OptionGroup, override?: OptionGroupDisplay) =>
    (g.fields ?? []).map((f) => numRow(f, override === 'stepper' || override === 'input' ? override : fieldMode(f)));

  // 접힘 헤더 요약 — 접혀 있어도 무엇을 골랐는지 상시(single ✓라벨 / multi·quantity N개 / number 값).
  const groupState = (g: OptionGroup, open: boolean) => {
    if (g.selection === 'single') {
      const code = selection.picked[g.id];
      const picked = code != null ? g.choices?.find((c) => c.code === code) : undefined;
      if (picked) return <span className="erpOSP-done"><Icon name="check" size="sm" />{picked.label}</span>;
      return g.required ? null : <span className="erpOSP-gnote">{g.choices?.length ?? 0}종</span>;
    }
    if (g.selection === 'multi') {
      const n = (selection.pickedMany?.[g.id] ?? []).length;
      if (n > 0) return <span className="erpOSP-done"><Icon name="check" size="sm" />{n}개 선택</span>;
      return g.required ? null : <span className="erpOSP-gnote">{g.choices?.length ?? 0}종</span>;
    }
    if (g.selection === 'quantity') {
      const ins = (g.choices ?? []).filter((c) => (selection.qty[c.id] ?? 0) > 0);
      const total = ins.reduce((s, c) => s + (selection.qty[c.id] ?? 0), 0);
      if (ins.length > 0) return <span className="erpOSP-done"><Icon name="check" size="sm" />{ins.length}종 {total}개</span>;
      return <span className="erpOSP-gnote">{g.choices?.length ?? 0}종</span>;
    }
    if (!open) return <span className="erpOSP-gnote">{(g.fields ?? []).map((f) => selection.nums[f.key] ?? f.value).join(' × ')}</span>;
    return null;
  };

  const goNext = (g: OptionGroup) => {
    const i = groups.indexOf(g);
    const nxt = groups[i + 1];
    setOpen(g.id, false);
    if (nxt) { setOpen(nxt.id, true); requestAnimationFrame(() => scrollToGroup(nxt.id)); }
  };

  const groupBlock = (g: OptionGroup, isLast: boolean) => {
    const open = headerless || isOpen(g.id);
    const mode = g.selection === 'number' ? undefined : resolveDisplay(g, props.display?.[g.id]);
    // D-1 — 검색 중에도 미충족 필수 그룹은 지우지 않는다(헤더 잔존).
    if (query !== '' && g.selection !== 'number' && (g.choices ?? []).filter(matches).length === 0
      && !(g.required && !isSatisfied(selection, g))) return null;
    return (
      <div key={g.id} className="erpOSP-group" data-flash={flash === g.id || undefined}
        ref={(el) => { groupEls.current[g.id] = el; }}>
        {!headerless && (
          <div className="erpOSP-ghead" role="button" tabIndex={0} aria-expanded={open}
            onClick={() => { const next = !open; setOpen(g.id, next); if (next) requestAnimationFrame(() => scrollToGroup(g.id)); }}
            onKeyDown={(e) => keyActivate(e, () => { const next = !open; setOpen(g.id, next); if (next) requestAnimationFrame(() => scrollToGroup(g.id)); })}>
            <span className="erpOSP-gtitle">
              {g.label}
              {g.required && g.selection !== 'number' && <span className="erpOSP-star">*</span>}
            </span>
            {g.note && <span className="erpOSP-gnote">{g.note}</span>}
            <span className="erpOSP-gstate">{groupState(g, open)}</span>
            <span className="erpOSP-chev" data-open={open || undefined}><Icon name="chevron-down" size="sm" /></span>
          </div>
        )}
        {open && (
          <div className="erpOSP-gbd">
            {g.selection === 'number' ? numBody(g, props.display?.[g.id]) : choiceBody(g, mode!)}
            {!headerless && !isLast && (
              <div className="erpOSP-next">
                <button type="button" onClick={() => goNext(g)}>다음 <Icon name="chevron-down" size="sm" /></button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 경로형 제목(§6-7) — 길면 앞을 생략(끝 2단 유지), 전체는 title 툴팁.
  const titleText = props.path && props.path.length > 0
    ? (props.path.length > 2 ? `… › ${props.path.slice(-2).join(' › ')}` : props.path.join(' › '))
    : props.title;
  const titleFull = props.path?.join(' › ') ?? props.title;

  const sections = bySection(groups);

  return (
    <div className="erpOSP">
      <div className="erpOSP-head">
        <div className="erpOSP-headInfo">
          <span title={titleFull}><Title variant="subheading">{titleText}</Title></span>
          {props.meta && <Text variant="caption" color="secondary">{props.meta}</Text>}
        </div>
        {props.quantity && (
          <NumberStepper size="sm" min={1} value={props.quantity.value} onChange={props.quantity.onChange} />
        )}
      </div>
      {showSearch && (
        <div className="erpOSP-search">
          <input className="erpOSP-searchInput" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={(searchCfg && searchCfg.placeholder) || '값 검색'} />
        </div>
      )}
      <div className="erpOSP-body" ref={bodyEl}>
        {sections.map((sec, si) => (
          <div key={sec.label ?? si}>
            {sec.label != null && (
              <div className="erpOSP-sectionHd"><span className="erpOSP-sectionLbl">{sec.label}</span></div>
            )}
            {sec.groups.map((g) => groupBlock(g, groups.indexOf(g) === groups.length - 1))}
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
});
