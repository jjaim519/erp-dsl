'use client';
// OptionSetPicker 위젯 — 저작 면이 정의한 OptionSet을 읽어 *고르는* 선택 면. OptionSetEditor의 짝(같은 타입).
//  · 확정 시안(2026-07-28, 목업 v8.8 실검토): 행 = 미니 테이블(상태는 기하를 못 바꾼다 — 수량 슬롯 상시 예약,
//    담긴 행 배경 틴트 없음: 신호는 ✓마크·weight·수량값). 행 소계 없음 — 품목 소계는 풋터가 말한다.
//    수량 행의 숫자는 델타가 아니라 *단가*(부호 없음). 택 옵션 델타만 "+ ₩"(포함 사양은 '포함').
//  · 표현 어휘(자동 도출 + 닫힌 override):
//      single → cards(≤6 자동 — 제목+델타만, 미선택도 같은 링·선택=색 승격) | grid(≤10) | filtered(>10·값묶음 有) | list | chips | segmented | select
//      multi  → grid(자동) | filtered(>10·값묶음 有) | list | chips | cards
//      quantity → stepper(자동 — 값묶음 밴드 有=1열) | filtered(>10·값묶음 有 — 칩 평면) | grid
//      number → input(범위 넓거나 무한 — 타이핑, blur 스냅) | stepper
//    ('collect'는 지원 중단 별칭 — filtered로 해석. 행 소계·담긴 행 상단 고정은 실검토로 채택 취소.)
//  · 2열 규칙: 목록형 값 3개 이상 = 반폭 2열(중앙 거터+hairline), 2개 이하 = 반열 폭 한 열 적재.
//    값묶음 밴드와 2열은 *상호배타* — 밴드 그룹은 1열, 칩으로 평면화(filtered)된 그룹만 2열.
//  · 접힘: 초기값 defaultCollapsed — 'sequential'(첫 그룹만 — 신규 작성 기본) | 'satisfied' | 'all' | 'none' | ids.
//    선택·입력은 접힘을 유발하지 않는다(횡단 가격 비교 보존). "다음" 진행 버튼(현재 접고 다음 펼침)·헤더 토글이 전부,
//    collapseOnPick은 opt-in. openGroups/onToggleGroup으로 controlled 승격.
//  · 시점 보정(실검토 확정): 펼침·다음 = *최하단 맞춤*(넘친 만큼만, 패널 내부 스크롤, 하이라이트 없음).
//    잠금 담기 탭·ref 명령 = 상단 정렬 점프. 그룹 헤더 sticky(불투명 배경 — 투명 유리 금지).
//  · 풋터: 소계는 이 면의 대표 숫자(대형 타이포). 미충족 경고는 상시가 아니라 *잠금 담기 탭 시* 플로팅 배너
//    (풋터 위, 2.6초, 기하 불변) + 첫 미충족 그룹 점프. 필수 = 라벨 옆 별표(FormField 어휘).
//  · 검색: search prop(끄기·임계·문구). 대상=라벨+보조+값묶음(정규화). 미충족 필수 그룹은 검색이 못 지운다.
//  · 단위: showUnits(기본 false) — 수량 행 우측 단위 열은 소비처가 켠다(전 행 도배 방지).
//  · 도메인 무지·금액 계산 0(§6): amount·subtotal은 표시용 입력. 그룹 1개+섹션 없음 = 그룹 헤더 자동 생략.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { Title } from './Title';
import { Text } from './Text';
import { Button } from './Button';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { NumberInput } from './NumberInput';
import { NumberStepper } from './NumberStepper';
import { TextInput } from './TextInput';
import { SegmentedControl } from './SegmentedControl';
import { Select } from './Select';
import { EmptyState } from './EmptyState';
import { fmtCurrency } from './_cells';
import type { Choice, NumberField, OptionGroup, OptionSelection } from './optionset';
import './optionset.css';

/** 그룹 표현 override — selection과 안 맞는 값은 무시(자동 도출로 폴백). 'collect'는 지원 중단 별칭(=filtered). */
export type OptionGroupDisplay =
  | 'list' | 'cards' | 'chips' | 'grid' | 'segmented' | 'select' | 'filtered'
  | 'stepper' | 'collect'
  | 'input';

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
      secondary?: { label: string; onClick: () => void };
      emptyState?: { title: string; description?: string } }
  | { mode: 'configure';
      title: string;
      path?: string[];
      meta?: string;
      quantity?: { value: number; onChange: (n: number) => void };
      groups: OptionGroup[];
      selection: OptionSelection;
      display?: Record<string, OptionGroupDisplay>;
      search?: false | { threshold?: number; placeholder?: string };
      /** 초기 접힘 — 'sequential'(첫 그룹만 펼침, 신규 작성 기본값) | 'satisfied'(재편집용) | 'all' | 'none' | ids */
      defaultCollapsed?: 'sequential' | 'satisfied' | 'all' | 'none' | string[];
      collapseOnPick?: boolean;
      openGroups?: string[];
      onToggleGroup?: (groupId: string, open: boolean) => void;
      showUnits?: boolean;                                            // 수량 행 단위 열(기본 숨김)
      onPick: (groupId: string, code: string) => void;
      onPickMany?: (groupId: string, codes: string[]) => void;
      onQty: (choiceId: string, qty: number) => void;
      onNum: (fieldKey: string, value: number) => void;
      onText?: (key: string, value: string) => void;              // 'text' 입력칸(§1 2026-07-29 신설)
      onUnmetChange?: (groupIds: string[]) => void;
      subtotal: number;
      primary: { label: string; onClick: () => void };
      secondary?: { label: string; onClick: () => void };
      blockedHint?: string };                                         // 미지정 시 미충족 그룹명으로 자동 문구

const DEFAULT_SEARCH_THRESHOLD = 12;
const AUTO_CARDS_MAX = 6;      // single 카드 자동 상한
const AUTO_GRID_MAX = 10;      // single 2열 라디오 자동 상한(초과 + 값묶음 → filtered)

const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
const isPicked = (sel: OptionSelection, g: OptionGroup, code: string) =>
  g.selection === 'multi' ? (sel.pickedMany?.[g.id] ?? []).includes(code) : sel.picked[g.id] === code;

const SINGLE_DISPLAYS = new Set<OptionGroupDisplay>(['list', 'cards', 'chips', 'grid', 'segmented', 'select', 'filtered']);
const MULTI_DISPLAYS = new Set<OptionGroupDisplay>(['list', 'cards', 'chips', 'grid', 'filtered']);
const QTY_DISPLAYS = new Set<OptionGroupDisplay>(['stepper', 'grid', 'filtered']);
const hasChoiceGroups = (g: OptionGroup) => (g.choices ?? []).some((c) => !c.hidden && c.group);
function resolveDisplay(g: OptionGroup, override?: OptionGroupDisplay): OptionGroupDisplay {
  const ov = override === 'collect' ? 'filtered' : override;   // 지원 중단 별칭
  const n = g.choices?.length ?? 0;
  if (g.selection === 'single') {
    if (ov && SINGLE_DISPLAYS.has(ov)) return ov;
    if (n <= AUTO_CARDS_MAX) return 'cards';
    if (n <= AUTO_GRID_MAX) return 'grid';
    return hasChoiceGroups(g) ? 'filtered' : 'list';
  }
  if (g.selection === 'multi') {
    if (ov && MULTI_DISPLAYS.has(ov)) return ov;
    return n > AUTO_GRID_MAX && hasChoiceGroups(g) ? 'filtered' : 'grid';
  }
  if (ov && QTY_DISPLAYS.has(ov)) return ov;
  return n > AUTO_GRID_MAX && hasChoiceGroups(g) ? 'filtered' : 'stepper';
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

// 택 옵션 델타 — 부호와 ₩ 사이 thin space(글리프 충돌 실측). 0·없음 = '포함'(0원 소음 대신 침묵의 언어).
const delta = (n?: number) => (n != null && n > 0 ? `+ ${fmtCurrency(n)}` : '포함');
const deltaOrNull = (n?: number) => (n != null && n > 0 ? `+ ${fmtCurrency(n)}` : null);

const qsum = (sel: OptionSelection, g: OptionGroup) => (g.choices ?? []).reduce((s, c) => s + (sel.qty[c.id] ?? 0), 0);
const isSatisfied = (sel: OptionSelection, g: OptionGroup): boolean => {
  if (g.selection === 'single') return !!sel.picked[g.id];
  if (g.selection === 'multi') return (sel.pickedMany?.[g.id] ?? []).length > 0;
  if (g.selection === 'quantity') return qsum(sel, g) > 0;
  if (g.selection === 'text')
    return (g.texts ?? []).length > 0 && (g.texts ?? []).every((t) => (sel.texts?.[t.key] ?? '').trim() !== '');
  return true;
};

function keyActivate(e: React.KeyboardEvent, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
}

// 2열 규칙 래퍼 — 3개 이상 2열(거터+hairline), 2개 이하 반열 한 열. 밴드 그룹은 호출측에서 우회(1열).
function twoCol(children: ReactNode, count: number) {
  return <div className={`erpOSP-grid2${count < 3 ? ' erpOSP-col1' : ''}`}>{children}</div>;
}

export const OptionSetPicker = forwardRef<OptionSetPickerHandle, OptionSetPickerProps>(function OptionSetPicker(props, ref) {
  const [openSet, setOpenSet] = useState<Set<string>>(() => {
    if (props.mode !== 'configure') return new Set();
    const dc = props.defaultCollapsed ?? 'sequential';
    const open = new Set<string>();
    props.groups.forEach((g, i) => {
      const shouldOpen =
        dc === 'none' ? true :
        dc === 'all' ? false :
        dc === 'sequential' ? i === 0 :
        Array.isArray(dc) ? !dc.includes(g.id) :
        /* 'satisfied' — 수치·필수 미충족·담긴 그룹 펼침 */
        g.selection === 'number' ? true : (!!g.required && !isSatisfied(props.selection, g)) || isSatisfied(props.selection, g);
      if (shouldOpen) open.add(g.id);
    });
    return open;
  });
  const [q, setQ] = useState('');
  const [filterBy, setFilterBy] = useState<Record<string, string>>({});   // 그룹 id → 값묶음('' = 전체)
  const [floatHint, setFloatHint] = useState<string | null>(null);
  const bodyEl = useRef<HTMLDivElement | null>(null);
  const groupEls = useRef<Record<string, HTMLDivElement | null>>({});
  const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cfg = props.mode === 'configure' ? props : null;
  const controlled = !!cfg?.openGroups;
  const isOpen = (id: string) => (controlled ? cfg!.openGroups!.includes(id) : openSet.has(id));
  const setOpen = (id: string, open: boolean) => {
    if (controlled) { cfg?.onToggleGroup?.(id, open); return; }
    setOpenSet((s) => { const n = new Set(s); if (open) n.add(id); else n.delete(id); return n; });
    cfg?.onToggleGroup?.(id, open);
  };

  // 시점 보정 — 전부 패널 내부 스크롤만, 하이라이트 없음(실검토 확정).
  //  revealBottom: 펼침·다음 — 늘어난 내용이 아래로 넘친 만큼만(한계 = 헤더 상단). jumpTop: 잠금 담기·ref 명령.
  const revealBottom = (id: string) => {
    const body = bodyEl.current, el = groupEls.current[id];
    if (!body || !el) return;
    const b = body.getBoundingClientRect(), r = el.getBoundingClientRect();
    const overBottom = r.bottom - b.bottom;
    if (overBottom > 0) {
      const maxUp = Math.max(0, r.top - b.top);
      body.scrollTo({ top: body.scrollTop + Math.min(overBottom, maxUp), behavior: 'smooth' });
    }
  };
  const jumpTop = (id: string) => {
    const body = bodyEl.current, el = groupEls.current[id];
    if (!body || !el) return;
    body.scrollTo({ top: el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 2, behavior: 'smooth' });
  };

  const unmet = cfg ? cfg.groups.filter((g) => g.required && g.selection !== 'number' && !isSatisfied(cfg.selection, g)) : [];
  const unmetKey = unmet.map((g) => g.id).join('|');
  const onUnmetChange = cfg?.onUnmetChange;
  useEffect(() => {
    onUnmetChange?.(unmetKey === '' ? [] : unmetKey.split('|'));
  }, [unmetKey, onUnmetChange]);
  useEffect(() => () => { if (floatTimer.current) clearTimeout(floatTimer.current); }, []);

  useImperativeHandle(ref, () => ({
    focusGroup: (id: string) => { setOpen(id, true); requestAnimationFrame(() => jumpTop(id)); },
    focusUnmet: () => { const t = unmet[0]; if (t) { setOpen(t.id, true); requestAnimationFrame(() => jumpTop(t.id)); } },
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
  const headerless = groups.length === 1 && groups[0].section == null;
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

  const showFloat = () => {
    const msg = props.blockedHint ?? `선택이 필요합니다 — ${unmet.map((g) => g.label).join(' · ')}`;
    setFloatHint(msg);
    if (floatTimer.current) clearTimeout(floatTimer.current);
    floatTimer.current = setTimeout(() => setFloatHint(null), 2600);
  };
  const handlePrimary = () => {
    if (!locked) { props.primary.onClick(); return; }
    const target = unmet[0];
    setOpen(target.id, true);
    requestAnimationFrame(() => jumpTop(target.id));
    showFloat();
  };

  const searchCfg = props.search;
  const threshold = searchCfg === false ? Infinity : (searchCfg?.threshold ?? DEFAULT_SEARCH_THRESHOLD);
  const totalChoices = groups.reduce((s, g) => s + (g.choices?.length ?? 0), 0);
  const showSearch = searchCfg !== false && totalChoices > threshold;
  const query = norm(q);
  const matches = (c: Choice) => query === '' || norm(c.label + (c.sublabel ?? '') + (c.group ?? '')).includes(query);

  // ── 렌더러들 ──
  // 택 행(라디오/체크) — [마크][라벨·보조][델타 우측]. 틴트 없음: 신호 = 마크 + weight.
  const markRow = (g: OptionGroup, c: Choice) => {
    const on = isPicked(selection, g, c.code);
    return (
      <div key={c.id} className="erpOSP-mrow" role="button" tabIndex={0} data-on={on || undefined}
        onClick={() => pick(g, c.code)} onKeyDown={(e) => keyActivate(e, () => pick(g, c.code))}>
        <span className="erpOSP-mark" data-on={on || undefined} data-multi={g.selection === 'multi' || undefined}>
          {on && <Icon name="check" size="sm" />}
        </span>
        <span className="erpOSP-info">
          <span className="erpOSP-lbl">{c.label}</span>
          {c.sublabel && <span className="erpOSP-sub">{c.sublabel}</span>}
        </span>
        <span className="erpOSP-delta">{delta(c.amount)}</span>
      </div>
    );
  };

  // 카드(택1/복수 소수 후보) — 제목+델타만. 미선택도 같은 링(투명), 선택=색 승격만(기하 불변).
  const cardsBody = (g: OptionGroup, visible: Choice[]) => (
    <div className="erpOSP-cards">
      {visible.map((c) => {
        const on = isPicked(selection, g, c.code);
        return (
          <button key={c.id} type="button" className="erpOSP-card" data-on={on || undefined} onClick={() => pick(g, c.code)}>
            <span className="erpOSP-cardName">{c.label}</span>
            <span className="erpOSP-cardDelta">{delta(c.amount)}</span>
          </button>
        );
      })}
    </div>
  );

  // 수량 행 — [마크][라벨(+태그: filtered 평면일 때만)][단가(무부호)][수량 슬롯 상시][단위?].
  //  빈 행 = 행 전체 버튼(클릭·Enter = 1 담김), hover에 "담기" 알약이 스테퍼 자리에서 morph.
  const qtyRow = (g: OptionGroup, c: Choice, flat: boolean) => {
    const n = selection.qty[c.id] ?? 0;
    const unitCell = props.showUnits ? <span className="erpOSP-unit">{c.unit ?? ''}</span> : null;
    const price = c.amount != null && c.amount > 0 ? fmtCurrency(c.amount) : '';
    const info = (
      <span className="erpOSP-info">
        <span className="erpOSP-lbl">{c.label}{flat && c.group && <span className="erpOSP-gtag"> {c.group}</span>}</span>
        {c.sublabel && <span className="erpOSP-sub">{c.sublabel}</span>}
      </span>
    );
    // 정정(2026-07-29): 빈 슬롯·hover '담기' 알약 은퇴 — 전 행 스테퍼 상시(0 상태=흐림·− 비활성).
    //  행 전체 클릭=1 담김은 유지(키보드 접근 수복 계보). 상태는 기하를 못 바꾼다 — 이제 morph조차 없다.
    // 스테퍼도 위젯 소유(정본 24px 미니 스테퍼) — NumberStepper 부품은 자체 크롬이 hover에서 어긋난다(보수 전사 원칙).
    const stepper = (
      <span className={'erpOSP-stp' + (n === 0 ? ' z' : '')}
        onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <button type="button" disabled={n === 0} aria-label="빼기" onClick={() => props.onQty(c.id, Math.max(0, n - 1))}>−</button>
        <span className="v">{n}</span>
        <button type="button" aria-label="더하기" onClick={() => props.onQty(c.id, n + 1)}>＋</button>
      </span>
    );
    if (n > 0) {
      return (
        <div key={c.id} className="erpOSP-qrow" data-in>
          <span className="erpOSP-mark" data-on><Icon name="check" size="sm" /></span>
          {info}
          <span className="erpOSP-price">{price}</span>
          {stepper}
          {unitCell}
        </div>
      );
    }
    return (
      <div key={c.id} className="erpOSP-qrow" role="button" tabIndex={0}
        onClick={() => props.onQty(c.id, 1)} onKeyDown={(e) => keyActivate(e, () => props.onQty(c.id, 1))}>
        <span className="erpOSP-mark" />
        {info}
        <span className="erpOSP-price">{price}</span>
        {stepper}
        {unitCell}
      </div>
    );
  };

  // 값묶음 필터 칩 — 항상 정확히 하나 활성(정정 2026-07-29): 첫 묶음 기본 하이라이트, 재클릭 해제 폐지(칩 간 전환만).
  const filterChips = (g: OptionGroup, all: Choice[]) => {
    const groupsOf = [...new Set(all.filter((c) => c.group).map((c) => c.group as string))];
    if (groupsOf.length === 0) return null;
    const cur = filterBy[g.id] ?? groupsOf[0];
    const setF = (v: string) => setFilterBy((m) => (m[g.id] === v ? m : { ...m, [g.id]: v }));
    return (
      <div className="erpOSP-fchips">
        {groupsOf.map((lbl) => (
          <button key={lbl} type="button" className="erpOSP-fchip" data-on={cur === lbl || undefined} onClick={() => setF(lbl)}>
            {lbl}<span className="n">{all.filter((c) => c.group === lbl).length}</span>
          </button>
        ))}
      </div>
    );
  };
  const applyFilter = (g: OptionGroup, list: Choice[]) => {
    const first = [...new Set((g.choices ?? []).filter((c) => !c.hidden && c.group).map((c) => c.group as string))][0] ?? '';
    const cur = filterBy[g.id] ?? first;
    return cur === '' ? list : list.filter((c) => c.group === cur);
  };

  const choiceBody = (g: OptionGroup, mode: OptionGroupDisplay) => {
    const visible = (g.choices ?? []).filter((c) => !c.hidden).filter(matches);   // hidden=봉인 — 렌더 제외(§1 2026-07-29)
    if (mode === 'cards') return cardsBody(g, visible);
    if (mode === 'chips') {
      return (
        <div className="erpOSP-chips">
          {visible.map((c) => (
            <Chip key={c.id} selected={isPicked(selection, g, c.code)} onChange={() => pick(g, c.code)}>
              {`${c.label}${deltaOrNull(c.amount) ? ` ${deltaOrNull(c.amount)}` : ''}`}
            </Chip>
          ))}
        </div>
      );
    }
    if (mode === 'segmented') {
      return (
        <div className="erpOSP-inlineCtl">
          <SegmentedControl size="sm" fullWidth
            options={visible.map((c) => ({ value: c.code, label: c.label }))}
            value={selection.picked[g.id] ?? ''}
            onChange={(v) => pick(g, v)} />
        </div>
      );
    }
    if (mode === 'select') {
      return (
        <div className="erpOSP-inlineCtl">
          <Select size="sm" placeholder="선택"
            options={visible.map((c) => ({ value: c.code, label: `${c.label}${deltaOrNull(c.amount) ? ` ${deltaOrNull(c.amount)}` : ''}` }))}
            value={selection.picked[g.id] ?? null}
            onChange={(v) => { if (v != null) pick(g, v); }} />
        </div>
      );
    }
    const isQty = g.selection === 'quantity';
    if (mode === 'filtered') {
      const list = applyFilter(g, visible);
      const rows = list.map((c) => (isQty ? qtyRow(g, c, true) : markRow(g, c)));
      return (
        <>
          {filterChips(g, (g.choices ?? []).filter((c) => !c.hidden))}
          {list.length === 0 ? <div className="erpOSP-none">결과가 없습니다.</div> : twoCol(rows, list.length)}
        </>
      );
    }
    // stepper(수량 기본) · grid · list — 밴드(값묶음 소구획)와 2열은 상호배타.
    const bands = hasChoiceGroups(g);
    if (bands && mode !== 'grid') {
      // 1열 + 구획 밴드(전폭 옅은 면 — "이 아래 전부가 이 묶음")
      const out: ReactNode[] = [];
      let last: string | undefined;
      for (const c of visible) {
        if (c.group && c.group !== last) { out.push(<div key={`b:${c.group}`} className="erpOSP-band">{c.group}</div>); last = c.group; }
        out.push(isQty ? qtyRow(g, c, false) : markRow(g, c));
      }
      return <>{out}</>;
    }
    const rows = visible.map((c) => (isQty ? qtyRow(g, c, false) : markRow(g, c)));
    if (mode === 'list') return <>{rows}</>;
    return twoCol(rows, visible.length);   // 'grid' | 'stepper'(묶음 없음)
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
      <div key={f.key} className="erpOSP-nrow">
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

  // 문구 입력칸(text — §1 2026-07-29 신설): 라벨+한 줄 입력. required는 전 칸 채움=충족.
  const textBody = (g: OptionGroup) =>
    (g.texts ?? []).map((t) => (
      <div key={t.key} className="erpOSP-nrow">
        <span className="erpOSP-info"><span className="erpOSP-lbl">{t.label}</span></span>
        <span className="erpOSP-txtin">
          <TextInput size="sm" value={selection.texts?.[t.key] ?? ''} placeholder={t.placeholder}
            onChange={(v) => props.onText?.(t.key, v)} />
        </span>
      </div>
    ));

  // v13 이식 — 그룹 상태 3분(열림=cur / 충족=done / 미래=dim)·완료 접힘 요약 줄 텍스트.
  const stateOf = (g: OptionGroup, open: boolean) => (open ? 'cur' : isSatisfied(selection, g) ? 'done' : 'dim');
  const sumText = (g: OptionGroup): string | null => {
    if (g.selection === 'single') {
      const c = g.choices?.find((x) => x.code === selection.picked[g.id]);
      return c ? `${c.label}${c.amount ? ` · + ${fmtCurrency(c.amount)}` : ''}` : null;
    }
    if (g.selection === 'multi') {
      const codes = selection.pickedMany?.[g.id] ?? [];
      const labels = (g.choices ?? []).filter((c) => codes.includes(c.code)).map((c) => c.label);
      if (!labels.length) return null;
      return labels.slice(0, 3).join(' · ') + (labels.length > 3 ? ` 외 ${labels.length - 3}` : '');
    }
    if (g.selection === 'quantity') {
      const ins = (g.choices ?? []).filter((c) => (selection.qty[c.id] ?? 0) > 0);
      const total = ins.reduce((n, c) => n + (selection.qty[c.id] ?? 0), 0);
      return ins.length ? `${ins.length}종 ${total}개` : null;
    }
    if (g.selection === 'text') {
      const vals = (g.texts ?? []).map((t) => (selection.texts?.[t.key] ?? '').trim()).filter(Boolean);
      return vals.length ? vals[0] + (vals.length > 1 ? ` 외 ${vals.length - 1}` : '') : null;
    }
    return (g.fields ?? []).map((f) => `${selection.nums[f.key] ?? f.value}${f.unit ?? ''}`).join(' × ') || null;
  };

  const goNext = (g: OptionGroup) => {
    const i = groups.indexOf(g);
    const nxt = groups[i + 1];
    setOpen(g.id, false);
    if (nxt) { setOpen(nxt.id, true); requestAnimationFrame(() => revealBottom(nxt.id)); }
  };

  const groupBlock = (g: OptionGroup, gi: number, isLast: boolean) => {
    const open = headerless || isOpen(g.id);
    const mode = g.selection === 'number' || g.selection === 'text' ? undefined : resolveDisplay(g, props.display?.[g.id]);
    if (query !== '' && g.selection !== 'number' && g.selection !== 'text' && (g.choices ?? []).filter((c) => !c.hidden).filter(matches).length === 0
      && !(g.required && !isSatisfied(selection, g))) return null;   // D-1: 미충족 필수는 검색이 못 지움
    const st = stateOf(g, open);
    const doneClosed = st === 'done' && !open;
    const sum = doneClosed ? sumText(g) : null;
    const toggle = () => { const next = !open; setOpen(g.id, next); if (next) requestAnimationFrame(() => revealBottom(g.id)); };
    return (
      <div key={g.id} className="erpOSP-group" data-open={(!headerless && open) || undefined}
        data-done={doneClosed || undefined} ref={(el) => { groupEls.current[g.id] = el; }}
        onClick={doneClosed ? toggle : undefined}>
        {!headerless && (
          <div className="erpOSP-ghead" data-st={st} data-sum={sum != null || undefined} role="button" tabIndex={0} aria-expanded={open}
            onClick={doneClosed ? undefined : toggle}
            onKeyDown={(e) => keyActivate(e, toggle)}>
            <span className="erpOSP-gnum" data-st={st}>{gi + 1}</span>
            <span className="erpOSP-gtitle">
              {g.label}
              {g.required && g.selection !== 'number' && <span className="erpOSP-star">*</span>}
            </span>
            {g.note && <span className="erpOSP-gnote">{g.note}</span>}
            <span className="erpOSP-grt">
              {doneClosed
                ? <span className="erpOSP-chg">변경</span>
                : <span className="erpOSP-chev" data-open={open || undefined}><Icon name="chevron-down" size="sm" /></span>}
            </span>
          </div>
        )}
        {sum != null && <div className="erpOSP-sumline">{sum}</div>}
        {open && (
          <div className="erpOSP-gbd">
            {g.selection === 'number' ? numBody(g, props.display?.[g.id]) : g.selection === 'text' ? textBody(g) : choiceBody(g, mode!)}
            {!headerless && !isLast && (
              <div className="erpOSP-next">
                <button type="button" onClick={(e) => { e.stopPropagation(); goNext(g); }}>다음 <Icon name="chevron-down" size="sm" /></button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // stuck 감지 — 헤더가 sticky로 떠 있을 때만 경계 그림자(top:-1px 트릭 + IntersectionObserver).
  //  매 렌더 재관찰(열림·검색으로 헤더 목록이 갈림) — 패널 규모라 비용 무시 가능. SSR 안전(effect 내부).
  useEffect(() => {
    const root = bodyEl.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver((es) => {
      es.forEach((e) => (e.target as HTMLElement).classList.toggle('stuck',
        e.intersectionRatio < 1 && e.boundingClientRect.top < (e.rootBounds?.top ?? 0) + 2));
    }, { root, threshold: [1] });
    root.querySelectorAll('.erpOSP-ghead').forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  });

  const titleText = props.path && props.path.length > 0
    ? (props.path.length > 2 ? `… › ${props.path.slice(-2).join(' › ')}` : props.path.join(' › '))
    : props.title;
  const titleFull = props.path?.join(' › ') ?? props.title;


  return (
    <div className="erpOSP" data-units={props.showUnits || undefined}>
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
      {/* 섹션 오버라인 라벨 없음(v13 실검토: 유령 그룹 라벨과 섞여 위계를 죽임) — 번호 블록이 흐름을 만든다 */}
      <div className="erpOSP-body" ref={bodyEl}>
        {groups.map((g, gi) => groupBlock(g, gi, gi === groups.length - 1))}
      </div>
      {/* 미충족 플로팅 — 잠금 담기 탭 시에만, 풋터 위(기하 불변·2.6초) */}
      <div className="erpOSP-float" data-on={floatHint != null || undefined} aria-live="polite">
        {floatHint && <><Icon name="alert-circle" size="sm" />{floatHint}</>}
      </div>
      <div className="erpOSP-foot">
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
