'use client';
// OptionSetEditor v2.1 — 옵션 정의 저작 위젯(2-pane: 좌=구조 트리, 우=작업면. 목업 v5.13 = 시각 정본).
//  · 동형 원칙: OptionSetComposer(부착 상위 면)와 같은 골격 — "좌측에서 구조, 우측에서 내용".
//    트리 행 해부·hover 액션·팝오버·미니 스위치는 optionset-shared(가족 내부 모듈) 공용.
//  · 트리: 1층=옵션(리딩 글리프=유형 형태 아이콘 ◉☑±123≡ — Forms 문법), 2층=묶음(무글리프+들여쓰기
//    +1px 중성 가이드). 루트 추가=하단 아웃라인 버튼(＋옵션), 자식 추가=부모 행 hover ＋(묶음)·표 아래 ＋묶음 병존.
//  · 스코프: 옵션 선택=전체 표(구획 행 포함), 묶음 선택=그 묶음 값만(경로 헤더 "옵션 › [묶음이름]") —
//    빈 행 추가는 그 묶음 안으로. 헤더=[이름]…[유형][필수]│[편집|미리보기](크롬·속성·뷰 존 분리, height 56 고정).
//  · 표 문법(정본 유지): FieldGrid식 hairline 표·행 36px 고정·Tab=열·Enter=같은 열 아랫 행·고스트 실체화·
//    쉼표/여러 줄 붙여넣기 분리·⠿ 드래그(값·묶음 블록·입력칸)·사용 안 함(hidden)·강조=캐럿+밑변 1px.
//  · 고급 배선 없음(확정) — fx(refId/override/ratio/formula)·adjust·unit은 계약 보존만(spread 왕복), UI 미노출.
//  · 미리보기(단일 옵션)는 경량 내장 렌더 — Picker 통째 내장은 Composer(조립 프리뷰·풋터 유의미)의 몫.
//  · usage(사용처)는 헤더 상시 노출 안 함(확정) — 삭제 확인에서만 나열. 도메인 무지(헌법 1)·금액 계산 0(§6).
import { useEffect, useRef, useState } from 'react';
import type { Choice, NumberField, OptionGroup, TextField } from './optionset';
import type { RefOption } from './InheritedValueField';
import type { ExprVariable } from './ExpressionField';
import type { KVKey } from './KeyValueField';
import { DotsGlyph, EyeGlyph, MiniSwitch, PlusGlyph, TreeRow, TypeIcon, usePopDismiss, useRowDrag } from './optionset-shared';
import './optionset.css';

type Props = {
  groups: OptionGroup[];                      // controlled — 모든 쓰기는 onChange 하나로(부품은 저장을 모른다)
  onChange: (groups: OptionGroup[]) => void;
  /** 옵션별 사용처 라벨 — 완전 삭제 확인에 나열(공용 편집 사고 방지). 헤더 상시 노출은 안 한다(확정) */
  usage?: Record<string, string[]>;
  title?: string;                             // 좌측 pane 제목(기본 '옵션')
  readOnly?: boolean;
  /** R3 A군 — 가격 규칙 재노출. §3-①: 셋 다 미전달이면 관련 UI가 자리조차 차지하지 않는다.
   *  전달 시: 행 hover·걸린 값만 fx 표식(상시 열 아님 — 열 경계 불변식: fx 슬롯은 빈 행·헤더에도 동시 예약). */
  refOptions?: RefOption[];                   // 참조(refId) 후보 목록 — 지정·해제·상속가 표시
  exprVariables?: ExprVariable[];             // 있으면 수식(formula) 입력 노출
  adjustKeys?: KVKey[];                       // 있으면 보정(adjust) 입력 노출("키:±값" 표기)
};

type Sel = OptionGroup['selection'];
const SELS: { value: Sel; q: string; desc: string }[] = [
  { value: 'single', q: '하나만 골라요', desc: '여러 값 중 한 가지를 고릅니다' },
  { value: 'multi', q: '여러 개 골라요', desc: '값마다 켜고 끕니다' },
  { value: 'quantity', q: '개수를 담아요', desc: '값마다 개수를 입력합니다' },
  { value: 'number', q: '숫자를 받아요', desc: '입력칸마다 범위 안 수치를 받습니다' },
  { value: 'text', q: '문구를 받아요', desc: '입력칸마다 자유 문구를 받습니다' },
];
const selQ = (s: Sel) => SELS.find((x) => x.value === s)?.q ?? '';
const listy = (s: Sel) => s === 'single' || s === 'multi' || s === 'quantity';

const uid = () => 'os' + Math.random().toString(36).slice(2, 9);
const digits = (v: string) => v.replace(/[^\d]/g, '');
const comma = (n: number | undefined) => (n == null || n === 0 ? '' : n.toLocaleString('ko-KR'));
const fmtWon = (n: number) => '₩' + n.toLocaleString('ko-KR');
const delta = (n?: number) => (n == null || n === 0 ? '포함' : '+ ' + fmtWon(n));

/** 묶음 구획 행 — 편집기 내부 구조. 저장 시 아래 값들에 Choice.group을 도장 찍는다(계약 불변). */
type Row = { t: 'b'; key: string; label: string } | { t: 'c'; id: string };
function buildRows(g: OptionGroup): Row[] {
  const rows: Row[] = [];
  let cur = '';
  for (const c of g.choices ?? []) {
    const b = (c.group ?? '').trim();
    if (b !== cur) { cur = b; if (b) rows.push({ t: 'b', key: uid(), label: b }); }
    rows.push({ t: 'c', id: c.id });
  }
  return rows;
}
function choicesFromRows(g: OptionGroup, rows: Row[], extra?: Record<string, Choice>): Choice[] {
  const by: Record<string, Choice> = {};
  for (const c of g.choices ?? []) by[c.id] = c;
  if (extra) Object.assign(by, extra);
  const out: Choice[] = [];
  let cur = '';
  for (const r of rows) {
    if (r.t === 'b') cur = r.label.trim();
    else if (by[r.id]) {
      const c = by[r.id];
      out.push(cur ? { ...c, group: cur } : c.group ? { ...c, group: undefined } : c);
    }
  }
  return out;
}
const newChoice = (label: string, price?: number): Choice => {
  const id = uid();
  return { id, code: id, label, ...(price != null && price > 0 ? { override: price } : {}) };   // §2: 직접 단가=override
};
const newField = (): NumberField => ({ key: uid(), label: '', value: 0 });
const newText = (): TextField => ({ key: uid(), label: '' });

type Pop = { kind: 'type' } | { kind: 'menu'; id: string; confirm?: boolean }
  | { kind: 'fx'; cid: string; pick?: boolean } | null;
const fxSet = (c: Choice) => c.refId != null || c.ratio != null || !!c.formula || !!c.adjust;
const adjToText = (a?: Record<string, number>) =>
  a ? Object.entries(a).map(([k, v]) => `${k}:${v >= 0 ? '+' : ''}${v}`).join(', ') : '';
const textToAdj = (t: string): Record<string, number> | undefined => {
  const out: Record<string, number> = {};
  for (const part of t.split(',')) {
    const m = part.trim().match(/^([^:\s]+)\s*:\s*([+-]?\d+(?:\.\d+)?)$/);
    if (m) out[m[1]] = Number(m[2]);
  }
  return Object.keys(out).length ? out : undefined;
};

export function OptionSetEditor({ groups, onChange, usage, title, readOnly, refOptions, exprVariables, adjustKeys }: Props) {
  const advOn = !!(refOptions?.length || exprVariables?.length || adjustKeys?.length);
  const [optId, setOptId] = useState<string | null>(groups[0]?.id ?? null);
  const [bandKey, setBandKey] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>(() => (groups[0] ? buildRows(groups[0]) : []));
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [pop, setPop] = useState<Pop>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pv, setPv] = useState<Record<string, Record<string, unknown>>>({});   // 미리보기 임시 선택(옵션별)
  const dnd = useRowDrag();
  const focusReq = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cur = groups.find((g) => g.id === optId) ?? null;

  useEffect(() => {
    if (!focusReq.current || !rootRef.current) return;
    const el = rootRef.current.querySelector<HTMLInputElement>(focusReq.current);
    focusReq.current = null;
    if (el) {
      el.focus();
      try { el.setSelectionRange(el.value.length, el.value.length); } catch { /* number 입력 등 */ }
    }
  });
  usePopDismiss(!!pop, () => setPop(null));
  useEffect(() => () => { if (noteTimer.current) clearTimeout(noteTimer.current); }, []);

  const say = (msg: string) => {
    setNote(msg);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 2600);
  };
  const focusAt = (sel: string) => { focusReq.current = sel; };

  const patchGroup = (gid: string, patch: Partial<OptionGroup>) =>
    onChange(groups.map((g) => (g.id === gid ? { ...g, ...patch } : g)));
  const patchChoice = (g: OptionGroup, cid: string, patch: Partial<Choice>) =>
    patchGroup(g.id, { choices: (g.choices ?? []).map((c) => (c.id === cid ? { ...c, ...patch } : c)) });
  const restamp = (g: OptionGroup, nextRows: Row[], extra?: Record<string, Choice>) => {
    setRows(nextRows);
    patchGroup(g.id, { choices: choicesFromRows(g, nextRows, extra) });
  };
  const patchField = (g: OptionGroup, key: string, patch: Partial<NumberField>) =>
    patchGroup(g.id, { fields: (g.fields ?? []).map((f) => (f.key === key ? { ...f, ...patch } : f)) });
  const patchText = (g: OptionGroup, key: string, patch: Partial<TextField>) =>
    patchGroup(g.id, { texts: (g.texts ?? []).map((f) => (f.key === key ? { ...f, ...patch } : f)) });

  const selectOpt = (g: OptionGroup) => {
    setOptId(g.id); setBandKey(null); setRows(buildRows(g));
    setClosed((s) => ({ ...s, [g.id]: false }));
    setPop(null);
  };
  const selectBand = (g: OptionGroup, key: string) => {
    if (optId !== g.id) { setOptId(g.id); setRows(buildRows(g)); }
    setBandKey(key); setView('edit'); setPop(null);
  };
  const addOption = () => {
    const g: OptionGroup = { id: uid(), label: '', selection: 'single', choices: [newChoice('값 1')] };
    onChange([...groups, g]);
    setOptId(g.id); setBandKey(null); setRows(buildRows(g)); setPop(null);
    focusAt('.erpOSE-name');
  };
  const addBand = (g: OptionGroup, fromTable: boolean) => {
    if (!listy(g.selection)) { say('목록형 옵션에서만 묶음을 만들 수 있어요'); return; }
    const b: Row = { t: 'b', key: uid(), label: '' };
    const base = optId === g.id ? rows : buildRows(g);
    setOptId(g.id); setBandKey(null);
    setClosed((s) => ({ ...s, [g.id]: false }));
    restamp(g, [...base, b]);
    focusAt(fromTable ? `[data-c="${b.key}"] input[data-col="label"]` : `.erpOS-trow[data-row="${b.key}"] .erpOS-tin`);
    if (!fromTable) setRenamingBand(b.key);
  };
  const [renamingBand, setRenamingBand] = useState<string | null>(null);

  const setType = (g: OptionGroup, t: Sel) => {
    if (g.selection === t) { setPop(null); return; }
    const patch: Partial<OptionGroup> = { selection: t };
    if (listy(t) && !(g.choices ?? []).length) patch.choices = [newChoice('값 1')];
    if (t === 'number' && !(g.fields ?? []).length) patch.fields = [newField()];
    if (t === 'text' && !(g.texts ?? []).length) patch.texts = [newText()];
    patchGroup(g.id, patch);
    if (listy(t)) setRows(buildRows({ ...g, ...patch }));
    setBandKey(null);
    setPop(null);
  };

  /* ── 고스트 실체화 — 묶음 스코프면 그 블록 끝에 삽입 ── */
  const insertRows = (g: OptionGroup, made: Choice[]) => {
    const rowsOf = made.map((c) => ({ t: 'c' as const, id: c.id }));
    const extra: Record<string, Choice> = {};
    for (const c of made) extra[c.id] = c;
    let next: Row[];
    if (bandKey) {
      const bi = rows.findIndex((r) => r.t === 'b' && r.key === bandKey);
      let end = bi + 1;
      while (end < rows.length && rows[end].t !== 'b') end++;
      next = bi < 0 ? [...rows, ...rowsOf] : [...rows.slice(0, end), ...rowsOf, ...rows.slice(end)];
    } else next = [...rows, ...rowsOf];
    restamp(g, next, extra);
  };
  const commitGhostLabel = (g: OptionGroup, text: string) => {
    const parts = text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    const made = (parts.length ? parts : [text]).map((p) => newChoice(p));
    insertRows(g, made);
    focusAt(`[data-c="${made[made.length - 1].id}"] input[data-col="label"]`);
  };
  const commitGhostAmt = (g: OptionGroup, d: string) => {
    const c = newChoice('', Number(d));
    insertRows(g, [c]);
    focusAt(`[data-c="${c.id}"] input[data-col="amt"]`);
  };
  const commitGhostField = (g: OptionGroup, col: string, val: string) => {
    if (g.selection === 'number') {
      const f = newField();
      if (col === 'label') f.label = val;
      else if (col === 'unit') f.unit = val;
      else {
        const d = digits(val);
        if (!d) return;
        if (col === 'min') { f.min = Number(d); f.value = Number(d); }
        else if (col === 'max') f.max = Number(d);
        else if (col === 'step') f.step = Number(d);
      }
      patchGroup(g.id, { fields: [...(g.fields ?? []), f] });
      focusAt(`[data-c="${f.key}"] input[data-col="${col}"]`);
    } else {
      const f = newText();
      if (col === 'label') f.label = val;
      else if (col === 'ph') f.placeholder = val;
      patchGroup(g.id, { texts: [...(g.texts ?? []), f] });
      focusAt(`[data-c="${f.key}"] input[data-col="${col}"]`);
    }
  };

  /* ── 표 키보드 문법 ── */
  const onSurfKeyDown = (g: OptionGroup) => (e: React.KeyboardEvent<HTMLElement>) => {
    const t = e.target as HTMLInputElement;
    if (e.key === 'Enter' && t.classList.contains('erpOSE-name')) {
      e.preventDefault();
      rootRef.current?.querySelector<HTMLInputElement>('[data-editsurf] input[data-col="label"]')?.focus();
      return;
    }
    const col = t.getAttribute('data-col');
    if (!col) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (t.hasAttribute('data-ghost')) return;   // 고스트는 타이핑 즉시 실체화 — Enter 무동작
      const surf = rootRef.current?.querySelector('[data-editsurf]');
      if (!surf) return;
      const all = Array.from(surf.querySelectorAll<HTMLInputElement>(`input[data-col="${col}"]`));
      const next = all[all.indexOf(t) + 1];
      if (next) { next.focus(); next.select?.(); }
      return;
    }
    if (e.key === 'Backspace' && col === 'label' && !t.hasAttribute('data-ghost') && t.value === '') {
      e.preventDefault();
      const rid = t.closest<HTMLElement>('[data-c]')?.getAttribute('data-c');
      if (!rid) return;
      if (listy(g.selection)) {
        const i = rows.findIndex((r) => (r.t === 'b' ? r.key : r.id) === rid);
        if (i < 0) return;
        const nextRows = rows.filter((_, j) => j !== i);
        if (bandKey === rid) setBandKey(null);
        restamp(g, nextRows);
        const prev = nextRows[i - 1];
        focusAt(prev ? `[data-c="${prev.t === 'b' ? prev.key : prev.id}"] input[data-col="label"]` : '[data-editsurf] input[data-col="label"]');
      } else if (g.selection === 'number') {
        const fs = g.fields ?? [];
        const i = fs.findIndex((f) => f.key === rid);
        if (i < 0) return;
        patchGroup(g.id, { fields: fs.filter((f) => f.key !== rid) });
        focusAt(fs[i - 1] ? `[data-c="${fs[i - 1].key}"] input[data-col="label"]` : '[data-editsurf] input[data-col="label"]');
      } else {
        const fs = g.texts ?? [];
        const i = fs.findIndex((f) => f.key === rid);
        if (i < 0) return;
        patchGroup(g.id, { texts: fs.filter((f) => f.key !== rid) });
        focusAt(fs[i - 1] ? `[data-c="${fs[i - 1].key}"] input[data-col="label"]` : '[data-editsurf] input[data-col="label"]');
      }
    }
  };
  const onSurfPaste = (g: OptionGroup) => (e: React.ClipboardEvent<HTMLElement>) => {
    const t = e.target as HTMLInputElement;
    if (!listy(g.selection) || t.getAttribute('data-col') !== 'label' || t.hasAttribute('data-ghost')) return;
    const text = e.clipboardData.getData('text');
    if (!/[\n,]/.test(text)) return;
    e.preventDefault();
    const parts = text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const cid = t.closest<HTMLElement>('[data-c]')?.getAttribute('data-c');
    const c = (g.choices ?? []).find((x) => x.id === cid);
    if (!c) return;
    const made = parts.slice(1).map((p) => newChoice(p));
    const extra: Record<string, Choice> = { [c.id]: { ...c, label: parts[0] } };
    for (const m of made) extra[m.id] = m;
    const i = rows.findIndex((r) => r.t === 'c' && r.id === c.id);
    restamp(g, [...rows.slice(0, i + 1), ...made.map((m) => ({ t: 'c' as const, id: m.id })), ...rows.slice(i + 1)], extra);
    focusAt(`[data-c="${(made[made.length - 1] ?? c).id}"] input[data-col="label"]`);
  };

  /* ── 드롭 처리 ── */
  const dropOnRow = (g: OptionGroup, targetId: string) => dnd.drop((d) => {
    if (d.t === 'c' || d.t === 'b') {
      const keyOf = (r: Row) => (r.t === 'b' ? r.key : r.id);
      const from = rows.findIndex((r) => keyOf(r) === d.id);
      const to = rows.findIndex((r) => keyOf(r) === targetId);
      if (from < 0 || to < 0 || from === to) return;
      let next: Row[];
      if (d.t === 'b') {
        let end = from + 1;
        while (end < rows.length && rows[end].t !== 'b') end++;
        if (to >= from && to < end) return;
        const block = rows.slice(from, end);
        const rest = [...rows.slice(0, from), ...rows.slice(end)];
        const ti = rest.findIndex((r) => keyOf(r) === targetId);
        if (ti < 0) return;
        next = [...rest.slice(0, ti), ...block, ...rest.slice(ti)];
      } else {
        next = rows.filter((_, i) => i !== from);
        const ti = next.findIndex((r) => keyOf(r) === targetId);
        next.splice(ti < 0 ? next.length : ti, 0, rows[from]);
      }
      restamp(g, next);
    } else if (d.t === 'f') {
      const fs = [...(g.fields ?? [])];
      const from = fs.findIndex((f) => f.key === d.id);
      const to = fs.findIndex((f) => f.key === targetId);
      if (from < 0 || to < 0 || from === to) return;
      const [mv] = fs.splice(from, 1);
      fs.splice(to, 0, mv);
      patchGroup(g.id, { fields: fs });
    } else if (d.t === 'x') {
      const fs = [...(g.texts ?? [])];
      const from = fs.findIndex((f) => f.key === d.id);
      const to = fs.findIndex((f) => f.key === targetId);
      if (from < 0 || to < 0 || from === to) return;
      const [mv] = fs.splice(from, 1);
      fs.splice(to, 0, mv);
      patchGroup(g.id, { texts: fs });
    }
  });
  const dropOnTreeOpt = (targetGid: string) => dnd.drop((d) => {
    if (d.t !== 'lo') return;
    const from = groups.findIndex((g) => g.id === d.id);
    const to = groups.findIndex((g) => g.id === targetGid);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...groups];
    const [mv] = next.splice(from, 1);
    next.splice(to, 0, mv);
    onChange(next);
  });
  const dropOnTreeBand = (g: OptionGroup, targetKey: string) => dnd.drop((d) => {
    if (d.t !== 'lb' || d.extra !== g.id || optId !== g.id) return;
    const from = rows.findIndex((r) => r.t === 'b' && r.key === d.id);
    const to = rows.findIndex((r) => r.t === 'b' && r.key === targetKey);
    if (from < 0 || to < 0 || from === to) return;
    let end = from + 1;
    while (end < rows.length && rows[end].t !== 'b') end++;
    if (to >= from && to < end) return;
    const block = rows.slice(from, end);
    const rest = [...rows.slice(0, from), ...rows.slice(end)];
    const ti = rest.findIndex((r) => r.t === 'b' && r.key === targetKey);
    if (ti < 0) return;
    restamp(g, [...rest.slice(0, ti), ...block, ...rest.slice(ti)]);
  });

  /* ═══ 좌: 트리 ═══ */
  const treeMenu = (g: OptionGroup) => {
    if (pop?.kind !== 'menu' || pop.id !== 'lo:' + g.id) return null;
    const use = usage?.[g.id];
    return (
      <div className="erpOS-pop erpOS-npop" data-os-pop>
        {!pop.confirm ? (
          <>
            {listy(g.selection) && (
              <button type="button" className="erpOS-popIt plain" onClick={() => { setPop(null); addBand(g, false); }}>묶음 추가</button>
            )}
            <button type="button" className="erpOS-popIt plain" onClick={() => {
              const nid = uid();
              const copy: OptionGroup = {
                ...g, id: nid, label: g.label ? `${g.label} 사본` : '',
                choices: (g.choices ?? []).map((c) => { const ci = uid(); return { ...c, id: ci, code: c.code === c.id ? ci : c.code }; }),
                fields: (g.fields ?? []).map((f) => ({ ...f, key: uid() })),
                texts: (g.texts ?? []).map((f) => ({ ...f, key: uid() })),
              };
              const i = groups.findIndex((x) => x.id === g.id);
              onChange([...groups.slice(0, i + 1), copy, ...groups.slice(i + 1)]);
              setOptId(copy.id); setBandKey(null); setRows(buildRows(copy)); setPop(null);
              focusAt('.erpOSE-name');
            }}>복제</button>
            <button type="button" className="erpOS-popIt plain danger"
              onClick={() => setPop({ kind: 'menu', id: 'lo:' + g.id, confirm: true })}>
              완전 삭제{use?.length ? ` (${use.length}곳)` : ''}
            </button>
          </>
        ) : (
          <div className="erpOS-confirm">
            <div className="q">정말 삭제할까요?</div>
            <div className="d">{use?.length ? `${use.join(' · ')}에서 함께 사라집니다.` : '되돌릴 수 없습니다.'}</div>
            <div className="btns">
              <button type="button" onClick={() => setPop({ kind: 'menu', id: 'lo:' + g.id })}>취소</button>
              <button type="button" className="danger" onClick={() => {
                const rest = groups.filter((x) => x.id !== g.id);
                onChange(rest);
                if (optId === g.id) {
                  setOptId(rest[0]?.id ?? null); setBandKey(null);
                  setRows(rest[0] ? buildRows(rest[0]) : []);
                }
                setPop(null);
                say(`'${g.label || '이름 없는 옵션'}' 삭제됨${use?.length ? ` · ${use.length}곳에서 함께 제거` : ''}`);
              }}>삭제</button>
            </div>
          </div>
        )}
      </div>
    );
  };
  const bandMenu = (g: OptionGroup, key: string) => {
    if (pop?.kind !== 'menu' || pop.id !== 'lb:' + key) return null;
    return (
      <div className="erpOS-pop erpOS-npop" data-os-pop>
        <button type="button" className="erpOS-popIt plain" onClick={() => { setPop(null); setRenamingBand(key); }}>이름 변경</button>
        <button type="button" className="erpOS-popIt plain danger" onClick={() => {
          restamp(g, rows.filter((r) => !(r.t === 'b' && r.key === key)));
          if (bandKey === key) setBandKey(null);
          setPop(null);
        }}>묶음 해제</button>
      </div>
    );
  };

  const tree = (
    <div className="erpOS-tbody">
      {groups.map((g) => {
        const bands = optId === g.id ? rows.filter((r): r is Extract<Row, { t: 'b' }> => r.t === 'b')
          : buildRows(g).filter((r): r is Extract<Row, { t: 'b' }> => r.t === 'b');
        const hasKids = listy(g.selection) && bands.length > 0;
        const open = !closed[g.id];
        return (
          <div key={g.id}>
            <TreeRow id={g.id} depth={0} selected={optId === g.id && !bandKey}
              chevron={hasKids ? (open ? 'open' : 'closed') : null}
              onChevron={() => setClosed((s) => ({ ...s, [g.id]: !s[g.id] }))}
              label={g.label} placeholder="이름 없는 옵션"
              onSelect={() => selectOpt(g)}
              onPlus={listy(g.selection) && !readOnly ? () => addBand(g, false) : undefined} plusTitle="묶음 추가"
              onMenu={readOnly ? undefined : () => setPop(pop?.kind === 'menu' && pop.id === 'lo:' + g.id ? null : { kind: 'menu', id: 'lo:' + g.id })}
              menuOpen={pop?.kind === 'menu' && pop.id === 'lo:' + g.id}
              menu={treeMenu(g)}
              dragProps={{ draggable: true, onDragStart: dnd.start('lo', g.id), onDragEnd: dnd.end }}
              rowDragOver={dnd.over((d) => d.t === 'lo', g.id)} rowDrop={dropOnTreeOpt(g.id)} />
            {hasKids && open && bands.map((b) => (
              <TreeRow key={b.key} id={b.key} depth={2} guide selected={optId === g.id && bandKey === b.key}
                chevron={null}
                label={b.label} placeholder="이름 없음"
                renaming={renamingBand === b.key}
                onRenameInput={(v) => restamp(g, rows.map((x) => (x.t === 'b' && x.key === b.key ? { ...x, label: v } : x)))}
                onRenameDone={() => setRenamingBand(null)}
                onSelect={() => selectBand(g, b.key)}
                onMenu={readOnly ? undefined : () => setPop(pop?.kind === 'menu' && pop.id === 'lb:' + b.key ? null : { kind: 'menu', id: 'lb:' + b.key })}
                menuOpen={pop?.kind === 'menu' && pop.id === 'lb:' + b.key}
                menu={bandMenu(g, b.key)}
                dragProps={{ draggable: true, onDragStart: dnd.start('lb', b.key, g.id), onDragEnd: dnd.end }}
                rowDragOver={dnd.over((d) => d.t === 'lb' && d.extra === g.id, b.key)} rowDrop={dropOnTreeBand(g, b.key)} />
            ))}
          </div>
        );
      })}
      {!readOnly && (
        <div className="erpOS-taddrow">
          <button type="button" className="erpOS-tadd" onClick={addOption}><PlusGlyph /> 옵션</button>
        </div>
      )}
    </div>
  );

  /* ═══ 우: 작업면 — 표 ═══ */
  const scopedRows = (): { list: Row[]; inBandStart: boolean } => {
    if (!bandKey) return { list: rows, inBandStart: false };
    const bi = rows.findIndex((r) => r.t === 'b' && r.key === bandKey);
    if (bi < 0) return { list: rows, inBandStart: false };
    let end = bi + 1;
    while (end < rows.length && rows[end].t !== 'b') end++;
    return { list: rows.slice(bi + 1, end), inBandStart: false };
  };

  const choiceRow = (g: OptionGroup, c: Choice, inBand: boolean) => (
    <div key={c.id} className={'erpOSE-row' + (inBand ? ' inB' : '')} data-c={c.id}
      data-hidden={c.hidden || undefined} data-ind={dnd.overId === c.id || undefined}
      onDragOver={dnd.over((d) => d.t === 'c' || d.t === 'b', c.id)} onDrop={dropOnRow(g, c.id)}>
      <span className="erpOSE-grip" draggable onDragStart={dnd.start('c', c.id)} onDragEnd={dnd.end} title="끌어서 순서·소속 변경">⠿</span>
      <input className="erpOSE-cell" data-col="label" value={c.label} placeholder="값 이름"
        tabIndex={c.hidden ? -1 : undefined}
        onChange={(e) => patchChoice(g, c.id, { label: e.target.value })} />
      {c.hidden && <span className="erpOSE-offtag">사용 안 함</span>}
      {/* §2(R3 회귀 수정): 금액 칸 = override(직접값). amount는 소비처 주입 표시 전용으로 복귀.
          참조 걸린 값은 비었을 때 상속 유효가가 흐리게(placeholder) — 적으면 직접값이 이긴다(IVF 규율) */}
      <input className="erpOSE-amt" data-col="amt" value={comma(c.override)}
        placeholder={c.refId != null ? comma(refOptions?.find((r) => r.id === c.refId)?.price ?? c.amount) || '포함' : '포함'}
        inputMode="numeric"
        onChange={(e) => { const d = digits(e.target.value); patchChoice(g, c.id, { override: d ? Number(d) : undefined }); }} />
      {advOn && (
        <button type="button" className="erpOSE-fxbtn" data-set={fxSet(c) || undefined} data-os-popbtn title="가격 규칙"
          onClick={() => setPop(pop?.kind === 'fx' && pop.cid === c.id ? null : { kind: 'fx', cid: c.id })}>fx</button>
      )}
      <span className="erpOSE-acts">
        <button type="button" title={c.hidden ? '다시 사용' : '사용 안 함'}
          onClick={() => patchChoice(g, c.id, { hidden: c.hidden ? undefined : true })}>
          {c.hidden ? <EyeGlyph /> : '⊘'}
        </button>
        <button type="button" title="삭제" onClick={() => {
          restamp(g, rows.filter((r) => !(r.t === 'c' && r.id === c.id)));
        }}>✕</button>
      </span>
      {pop?.kind === 'fx' && pop.cid === c.id && (
        <div className="erpOS-pop erpOSE-fxpop" data-os-pop>
          <h4>가격 규칙 — {c.label || '값'}</h4>
          <div className="hint">선택 면은 읽지 않습니다 · 저장용 저작 필드</div>
          {refOptions && (
            <label><span>참조</span>
              <span className="erpOSE-fxref">
                {c.refId != null ? (() => {
                  const r = refOptions.find((x) => x.id === c.refId);
                  return (
                    <span className="erpOSE-fxrefon">{r?.label ?? c.refId}
                      {r?.price != null && <b>{r.price.toLocaleString('ko-KR')}</b>}
                      <button type="button" title="참조 해제" onClick={() => patchChoice(g, c.id, { refId: null })}>✕</button>
                    </span>
                  );
                })() : (
                  <button type="button" className="erpOSE-fxpick"
                    onClick={() => setPop({ kind: 'fx', cid: c.id, pick: !pop.pick })}>목록에서 선택…</button>
                )}
              </span>
            </label>
          )}
          {pop.pick && c.refId == null && refOptions && (
            <div className="erpOSE-fxlist">
              {refOptions.map((r) => (
                <button key={r.id} type="button"
                  onClick={() => { patchChoice(g, c.id, { refId: r.id }); setPop({ kind: 'fx', cid: c.id }); }}>
                  <span>{r.label}</span>{r.price != null && <b>{r.price.toLocaleString('ko-KR')}</b>}
                </button>
              ))}
            </div>
          )}
          <label><span>배율</span><input value={c.ratio != null ? String(c.ratio) : ''} placeholder="× 1.0"
            onChange={(e) => { const v = e.target.value.replace(/[^\d.]/g, ''); patchChoice(g, c.id, { ratio: v === '' ? undefined : Number(v) }); }} /></label>
          {exprVariables && (
            <label><span>수식</span><input value={c.formula ?? ''} placeholder="예: w/1000"
              onChange={(e) => patchChoice(g, c.id, { formula: e.target.value || undefined })} /></label>
          )}
          {adjustKeys && (
            <label><span>보정</span><input key={'adj' + c.id} defaultValue={adjToText(c.adjust)} placeholder="키:±값 (예: w:+20)"
              onChange={(e) => patchChoice(g, c.id, { adjust: textToAdj(e.target.value) })} /></label>
          )}
          <div className="hint" style={{ marginTop: 6 }}>참조를 걸면 금액 칸이 비었을 때 상속가가 흐리게 보이고, 적으면 직접값이 이깁니다.</div>
        </div>
      )}
    </div>
  );
  const bandRowEl = (g: OptionGroup, r: Extract<Row, { t: 'b' }>) => (
    <div key={r.key} className="erpOSE-rowB" data-c={r.key} data-ind={dnd.overId === r.key || undefined}
      onDragOver={dnd.over((d) => d.t === 'c' || d.t === 'b', r.key)} onDrop={dropOnRow(g, r.key)}>
      <span className="erpOSE-grip" draggable onDragStart={dnd.start('b', r.key)} onDragEnd={dnd.end} title="끌어서 묶음 통째로 이동">⠿</span>
      <input className="erpOSE-bcell" data-col="label" value={r.label} placeholder="묶음 이름"
        onChange={(e) => restamp(g, rows.map((x) => (x.t === 'b' && x.key === r.key ? { ...x, label: e.target.value } : x)))} />
      <span className="erpOSE-acts">
        <button type="button" title="묶음 해제(값은 위 묶음으로)" onClick={() => {
          restamp(g, rows.filter((x) => !(x.t === 'b' && x.key === r.key)));
          if (bandKey === r.key) setBandKey(null);
        }}>✕</button>
      </span>
    </div>
  );
  const ghostRow = (g: OptionGroup, inBand: boolean) => (
    <div className={'erpOSE-row erpOSE-ghost' + (inBand ? ' inB' : '')}>
      <span className="erpOSE-grip" aria-hidden>⠿</span>
      <input className="erpOSE-cell" data-col="label" data-ghost value="" placeholder="값 추가"
        onChange={(e) => { if (e.target.value.trim()) commitGhostLabel(g, e.target.value); }} />
      <input className="erpOSE-amt" data-col="amt" data-ghost value="" placeholder="금액" inputMode="numeric"
        onChange={(e) => { const d = digits(e.target.value); if (d) commitGhostAmt(g, d); }} />
      {advOn && <span className="erpOSE-fxsp" />}
      <span className="erpOSE-acts" />
    </div>
  );

  const listTable = (g: OptionGroup) => {
    const { list } = scopedRows();
    let inBand = false;
    const body = list.map((r) => {
      if (r.t === 'b') { inBand = true; return bandRowEl(g, r); }
      const c = (g.choices ?? []).find((x) => x.id === r.id);
      return c ? choiceRow(g, c, !bandKey && inBand) : null;
    });
    return (
      <>
        <div className="erpOSE-vlist">
          <div className="erpOSE-vhead"><span className="grow">값</span><span className="ha">금액</span>{advOn && <span className="hf" />}<span className="hsp" /></div>
          {body}
          {ghostRow(g, !bandKey && inBand)}
        </div>
        {!bandKey && (
          <div className="erpOSE-tblft">
            <button type="button" className="erpOSE-bandadd" onClick={() => addBand(g, true)}>＋ 묶음</button>
          </div>
        )}
      </>
    );
  };
  const numTable = (g: OptionGroup) => (
    <div className="erpOSE-vlist">
      <div className="erpOSE-vhead"><span className="grow">입력칸</span><span className="h70">최소</span>
        <span className="h70">최대</span><span className="h60">간격</span><span className="h56">단위</span><span className="hsp" /></div>
      {(g.fields ?? []).map((f) => (
        <div key={f.key} className="erpOSE-row" data-c={f.key} data-ind={dnd.overId === f.key || undefined}
          onDragOver={dnd.over((d) => d.t === 'f', f.key)} onDrop={dropOnRow(g, f.key)}>
          <span className="erpOSE-grip" draggable onDragStart={dnd.start('f', f.key)} onDragEnd={dnd.end}>⠿</span>
          <input className="erpOSE-cell" data-col="label" value={f.label} placeholder="입력칸 이름"
            onChange={(e) => patchField(g, f.key, { label: e.target.value })} />
          <input className="erpOSE-cfg" data-col="min" value={f.min != null ? String(f.min) : ''} placeholder="최소" inputMode="numeric"
            onChange={(e) => { const d = digits(e.target.value); const min = d ? Number(d) : undefined; patchField(g, f.key, { min, value: min != null && f.value < min ? min : f.value }); }} />
          <input className="erpOSE-cfg" data-col="max" value={f.max != null ? String(f.max) : ''} placeholder="최대" inputMode="numeric"
            onChange={(e) => { const d = digits(e.target.value); patchField(g, f.key, { max: d ? Number(d) : undefined }); }} />
          <input className="erpOSE-cfg w60" data-col="step" value={f.step != null ? String(f.step) : ''} placeholder="간격" inputMode="numeric"
            onChange={(e) => { const d = digits(e.target.value); patchField(g, f.key, { step: d ? Number(d) : undefined }); }} />
          <input className="erpOSE-cfg unit" data-col="unit" value={f.unit ?? ''} placeholder="단위"
            onChange={(e) => patchField(g, f.key, { unit: e.target.value || undefined })} />
          <span className="erpOSE-acts">
            <button type="button" title="삭제" onClick={() => patchGroup(g.id, { fields: (g.fields ?? []).filter((x) => x.key !== f.key) })}>✕</button>
          </span>
        </div>
      ))}
      <div className="erpOSE-row erpOSE-ghost">
        <span className="erpOSE-grip" aria-hidden>⠿</span>
        <input className="erpOSE-cell" data-col="label" data-ghost value="" placeholder="입력칸 추가"
          onChange={(e) => { if (e.target.value.trim()) commitGhostField(g, 'label', e.target.value); }} />
        <input className="erpOSE-cfg" data-col="min" data-ghost value="" placeholder="최소" inputMode="numeric"
          onChange={(e) => commitGhostField(g, 'min', e.target.value)} />
        <input className="erpOSE-cfg" data-col="max" data-ghost value="" placeholder="최대" inputMode="numeric"
          onChange={(e) => commitGhostField(g, 'max', e.target.value)} />
        <input className="erpOSE-cfg w60" data-col="step" data-ghost value="" placeholder="간격" inputMode="numeric"
          onChange={(e) => commitGhostField(g, 'step', e.target.value)} />
        <input className="erpOSE-cfg unit" data-col="unit" data-ghost value="" placeholder="단위"
          onChange={(e) => { if (e.target.value.trim()) commitGhostField(g, 'unit', e.target.value); }} />
        <span className="erpOSE-acts" />
      </div>
    </div>
  );
  const textTable = (g: OptionGroup) => (
    <div className="erpOSE-vlist">
      <div className="erpOSE-vhead"><span className="grow">입력칸</span><span className="hph">안내문</span><span className="hsp" /></div>
      {(g.texts ?? []).map((f) => (
        <div key={f.key} className="erpOSE-row" data-c={f.key} data-ind={dnd.overId === f.key || undefined}
          onDragOver={dnd.over((d) => d.t === 'x', f.key)} onDrop={dropOnRow(g, f.key)}>
          <span className="erpOSE-grip" draggable onDragStart={dnd.start('x', f.key)} onDragEnd={dnd.end}>⠿</span>
          <input className="erpOSE-cell" data-col="label" value={f.label} placeholder="입력칸 이름"
            onChange={(e) => patchText(g, f.key, { label: e.target.value })} />
          <input className="erpOSE-phcell" data-col="ph" value={f.placeholder ?? ''} placeholder="안내문 (비우면 없음)"
            onChange={(e) => patchText(g, f.key, { placeholder: e.target.value || undefined })} />
          <span className="erpOSE-acts">
            <button type="button" title="삭제" onClick={() => patchGroup(g.id, { texts: (g.texts ?? []).filter((x) => x.key !== f.key) })}>✕</button>
          </span>
        </div>
      ))}
      <div className="erpOSE-row erpOSE-ghost">
        <span className="erpOSE-grip" aria-hidden>⠿</span>
        <input className="erpOSE-cell" data-col="label" data-ghost value="" placeholder="입력칸 추가"
          onChange={(e) => { if (e.target.value.trim()) commitGhostField(g, 'label', e.target.value); }} />
        <input className="erpOSE-phcell" data-col="ph" data-ghost value="" placeholder="안내문"
          onChange={(e) => { if (e.target.value.trim()) commitGhostField(g, 'ph', e.target.value); }} />
        <span className="erpOSE-acts" />
      </div>
    </div>
  );

  /* ═══ 미리보기(단일 옵션 — 경량 내장. 조립 프리뷰는 Composer=Picker 몫) ═══ */
  const preview = (g: OptionGroup) => {
    const sel = (pv[g.id] ?? {}) as Record<string, unknown>;
    const set = (k: string, v: unknown) => setPv((s) => ({ ...s, [g.id]: { ...(s[g.id] ?? {}), [k]: v } }));
    const vis = (g.choices ?? []).filter((c) => c.label && !c.hidden);
    if (listy(g.selection) && !vis.length) return <div className="erpOSE-pvnone">표시할 값이 없습니다</div>;
    if (g.selection === 'single' && vis.length <= 6 && !vis.some((c) => c.group)) {
      return (
        <div className="erpOSE-pvcards">
          {vis.map((c) => (
            <button key={c.id} type="button" className="erpOSE-pvcard" data-on={sel.pick === c.id || undefined}
              onClick={() => set('pick', sel.pick === c.id ? undefined : c.id)}>
              <span className="t">{c.label}</span><span className="d num">{delta(c.override ?? c.amount)}</span>
            </button>
          ))}
        </div>
      );
    }
    if (g.selection === 'single' || g.selection === 'multi') {
      const bands: { band: string; items: Choice[] }[] = [];
      for (const c of vis) {
        const b = c.group ?? '';
        const last = bands[bands.length - 1];
        if (last && last.band === b) last.items.push(c);
        else bands.push({ band: b, items: [c] });
      }
      return (
        <div>
          {bands.map((bg, i) => (
            <div key={i}>
              {bg.band && <div className="erpOSE-pvband">{bg.band}</div>}
              {bg.items.map((c) => {
                const on = g.selection === 'single' ? sel.pick === c.id : !!(sel as Record<string, boolean>)['m' + c.id];
                return (
                  <button key={c.id} type="button" className="erpOSE-pvrow" data-on={on || undefined}
                    onClick={() => g.selection === 'single' ? set('pick', on ? undefined : c.id) : set('m' + c.id, !on)}>
                    <span className={'mk' + (g.selection === 'multi' ? ' sq' : '')}>{on ? '✓' : ''}</span>
                    <span>{c.label}</span><span className="grow" /><span className="d num">{delta(c.override ?? c.amount)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      );
    }
    if (g.selection === 'quantity') {
      return (
        <div>
          {vis.map((c) => {
            const q = Number(sel['q' + c.id] ?? 0);
            return (
              <div key={c.id} className="erpOSE-pvq" data-on={q > 0 || undefined}>
                <span className="mk">{q > 0 ? '✓' : ''}</span>
                <span className="lb">{c.label}</span>
                {c.unit && <span className="un">{c.unit}</span>}
                <span className="grow" /><span className="amt num">{(c.override ?? c.amount) ? fmtWon((c.override ?? c.amount)!) : '포함'}</span>
                <span className={'erpOSE-pvstp' + (q > 0 ? '' : ' z')}>
                  <button type="button" disabled={q === 0} onClick={() => set('q' + c.id, Math.max(0, q - 1))}>−</button>
                  <span className="v num">{q}</span>
                  <button type="button" onClick={() => set('q' + c.id, q + 1)}>＋</button>
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    if (g.selection === 'number') {
      return (
        <div>
          {(g.fields ?? []).map((f) => (
            <div key={f.key} className="erpOSE-pvf">
              <span className="lb">{f.label || g.label}</span>
              <span className="box">
                <input value={String(sel['n' + f.key] ?? '')} placeholder="—" inputMode="numeric"
                  onChange={(e) => set('n' + f.key, digits(e.target.value))}
                  onBlur={(e) => {
                    const raw = digits(e.target.value);
                    if (!raw) { set('n' + f.key, ''); return; }
                    const mn = f.min ?? 0, mx = f.max ?? Number(raw), st = f.step ?? 1;
                    let v = Math.min(mx, Math.max(mn, Number(raw)));
                    v = Math.round((v - mn) / st) * st + mn;
                    set('n' + f.key, String(v));
                  }} />
                {f.unit && <span className="su">{f.unit}</span>}
              </span>
              <span className="hint num">
                {f.min != null ? f.min.toLocaleString('ko-KR') : ''}–{f.max != null ? f.max.toLocaleString('ko-KR') : ''}
                {f.unit ? ` ${f.unit}` : ''}{f.step ? ` · ${f.step} 단위` : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div>
        {(g.texts ?? []).map((f) => (
          <div key={f.key} className="erpOSE-pvf">
            <span className="lb">{f.label || g.label}</span>
            <span className="txt">
              <input value={String(sel['t' + f.key] ?? '')} placeholder={f.placeholder ?? ''}
                onChange={(e) => set('t' + f.key, e.target.value)} />
            </span>
          </div>
        ))}
      </div>
    );
  };

  /* ═══ 헤더(우) — [이름]…[유형][필수]│[편집|미리보기], height 56 고정. 묶음 스코프=경로+묶음명 ═══ */
  const head = (g: OptionGroup) => {
    if (bandKey) {
      const b = rows.find((r): r is Extract<Row, { t: 'b' }> => r.t === 'b' && r.key === bandKey);
      return (
        <div className="erpOS-phd">
          <div className="erpOSE-bcw">
            <button type="button" className="erpOSE-pth" title="전체 보기" onClick={() => { setBandKey(null); }}>
              {g.label || '옵션'} ›
            </button>
            <input className="erpOSE-name" value={b?.label ?? ''} placeholder="묶음 이름"
              onChange={(e) => restamp(g, rows.map((x) => (x.t === 'b' && x.key === bandKey ? { ...x, label: e.target.value } : x)))} />
          </div>
        </div>
      );
    }
    return (
      <div className="erpOS-phd">
        <input className="erpOSE-name" value={g.label} placeholder="옵션 이름"
          onChange={(e) => patchGroup(g.id, { label: e.target.value })} />
        <span className="grow" />
        <button type="button" className="erpOSE-typebtn" data-os-popbtn
          onClick={() => setPop(pop?.kind === 'type' ? null : { kind: 'type' })}>
          <TypeIcon sel={g.selection} /> {selQ(g.selection)} <span className="cv">▾</span>
        </button>
        <MiniSwitch on={!!g.required} label="필수" onToggle={() => patchGroup(g.id, { required: !g.required || undefined })} />
        {advOn && listy(g.selection) && (
          <span className="erpOSE-gratio">×<input value={g.ratio != null ? String(g.ratio) : ''} placeholder="1.0"
            onChange={(e) => { const v = e.target.value.replace(/[^\d.]/g, ''); patchGroup(g.id, { ratio: v === '' ? undefined : Number(v) }); }} /></span>
        )}
        <span className="erpOS-hdiv" />
        <div className="erpOS-seg">
          <button type="button" data-on={view === 'edit' || undefined} onClick={() => setView('edit')}>편집</button>
          <button type="button" data-on={view === 'preview' || undefined} onClick={() => setView('preview')}>미리보기</button>
        </div>
        {pop?.kind === 'type' && (
          <div className="erpOS-pop erpOSE-typepop" data-os-pop>
            {SELS.map((s) => (
              <button key={s.value} type="button" className="erpOS-popIt" data-on={g.selection === s.value || undefined}
                onClick={() => setType(g, s.value)}>
                <span className="q"><TypeIcon sel={s.value} />{s.q}</span>
                <span className="d">{s.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const keptChoices = cur && !listy(cur.selection) ? (cur.choices ?? []).length : 0;
  return (
    <div ref={rootRef} className="erpOSE erpOS-2p" data-readonly={readOnly || undefined}>
      <div className="erpOS-tpane">
        <div className="erpOS-phd"><div className="erpOS-title">{title ?? '옵션'}</div></div>
        {tree}
      </div>
      <div className="erpOS-mpane">
        {cur ? (
          <>
            {head(cur)}
            <div className="erpOSE-scroll" onKeyDown={onSurfKeyDown(cur)} onPaste={onSurfPaste(cur)}>
              {view === 'preview' && !bandKey ? (
                <div className="erpOSE-pv">{preview(cur)}</div>
              ) : (
                <div data-editsurf>
                  {listy(cur.selection) ? listTable(cur) : cur.selection === 'number' ? numTable(cur) : textTable(cur)}
                  {keptChoices > 0 && <div className="erpOSE-stash">값 {keptChoices}개 보관 중 — 목록형으로 돌리면 그대로 복원됩니다.</div>}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="erpOS-phd"><div className="erpOS-title">옵션 없음</div></div>
            <div className="erpOSE-scroll"><div className="erpOSE-pvnone">좌측 ＋ 옵션으로 시작하세요.</div></div>
          </>
        )}
        <div className="erpOSE-float" data-on={note ? '' : undefined}>{note}</div>
      </div>
    </div>
  );
}
