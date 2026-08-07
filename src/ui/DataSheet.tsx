'use client';
// DataSheet (유기체) — **DataTable의 쓰기 형제.** 도메인 무관 표 껍데기에 "행 수정 + 새 줄 입력"을 얹는다.
//  · DataTable에 editable을 얹지 않고 형제로 낸다 — 큰 유기체에 축을 하나 더 여는 건 옵션 스태킹이다(03 §11-3).
//    CurrencyInput이 NumberInput에서 갈라진 것과 같은 짜임.
//
// ── 이 부품의 실체 ──────────────────────────────────────────────────────────
// **저장된 행은 읽기다.** 편집 신호를 상시로 깔지 않는다. 조사한 제품들이 그렇게 한다 —
//  Dynamics BC는 목록을 원칙적으로 읽기로 두고 액션 바의 「Edit list」로 열며,
//  Salesforce는 연필을 hover에서만 띄우고, SAP는 오브젝트가 edit 모드일 때만 빈 줄을 낸다.
//  (NetSuite식 상시 인라인은 "어느 칸이 편집되는지 모르겠다"가 대표 불만이고,
//   실제로 화면에서 확인했다 — 모든 행에 밑줄을 깔면 표가 노트 괘선처럼 읽힌다.)
//
// **편집 단위는 칸이 아니라 행이다.** ⋮의 「수정」 또는 Enter로 그 행 전체가 열리고,
//  ✓로 확정 / ✕로 되돌린다. 그래서 탐색은 **행** 단위, 편집에 들어가야 **칸** 단위가 된다 —
//  APG 그리드의 2단 모델(탐색↔편집)이 여기에 자연스럽게 맞는다.
//
// **쓰는 자리는 맨 아래 초안 줄 하나다.** 「행 추가」 버튼을 두지 않는다. 정렬과 무관하게 늘 맨 아래.
//  초안은 **1줄 상시**다(확정되면 rows로 편입되고 새 초안이 깔린다) — 미저장 줄을 부품이 N개 쌓으면
//  값의 주인이 rows와 둘이 된다. 초안 값만 부품이 들고, 저장된 값은 전부 소비처 것이다.
//
// ── 닫아 둔 것 ─────────────────────────────────────────────────────────────
//  셀 병합 · 수식 · 열 리사이즈 · 가상 스크롤 · 다중 셀 선택/복붙 · "편집 모드" 토글 prop ·
//  자유 render 슬롯(`_cells`의 닫힌 CellType 어휘를 그대로 쓴다 — 헌법 4).
import { useState, type ReactNode, type CSSProperties } from 'react';
import { TextInput as MTextInput, NumberInput as MNumberInput, Select as MSelect } from '@mantine/core';
import { DatePickerInput as MDatePicker } from '@mantine/dates';
import {
  renderCell, cellAlign, HEAD_CELL, fmtNumber, fmtCurrency,
  type CellType, type BadgeColor, type Action,
} from './_cells';
import { fieldBorder, DATE_FORMAT } from './_fieldStyles';
import { commitKeyHandler, isComposingEvent } from './_commitKeys';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { Menu } from './Menu';
import { Text } from './Text';
import { EmptyState } from './EmptyState';
import type { DataTableSort } from './DataTable';
import './datasheet.css';

// 편집 축 — 표 칸에서 열 수 있는 입력의 닫힌 집합. 표시 축(read)과 **별개**다.
export type SheetEditKind = 'text' | 'number' | 'currency' | 'date' | 'select';

export type SheetColumn = {
  key: string;
  label: string;
  /** 표시 표현 — DataTable과 **같은 CellType 어휘**. 없으면 edit에서 파생(text/number/currency/date). */
  read?: CellType;
  /** 편집 표현. **없으면 파생 칸**(읽기 전용) — Enter 순회에서도 빠진다. */
  edit?: SheetEditKind;
  /** 줄마다 다르다. 같은 열이라도 어떤 줄에선 열리고 어떤 줄에선 안 열린다. */
  editable?: (row: SheetRow) => boolean;
  options?: { label: string; value: string }[];   // select — Select 원자와 같은 입구
  badgeColors?: Record<string, BadgeColor>;       // read:'badge' — DataTableColumn과 같은 이름
  placeholder?: string;
  grow?: boolean;                                  // 남는 폭을 먹는 열(보통 하나). 나머지는 서식이 폭을 정한다.
  sortable?: boolean;
};

export type SheetRow = { id: string } & Record<string, unknown>;

/** 커밋 결과. `error`면 값을 지키고 그 줄을 열어 둔 채 오류를 붙인다(MUI processRowUpdate의 거절 계약과 동형).
 *  `key`를 주면 그 칸으로 커서가 간다. 정규화된 값을 돌려주는 통로는 열지 않는다 —
 *  controlled니까 소비처가 rows를 갱신하면 된다(값의 주인이 둘이 되는 걸 막는다). */
export type SheetCommitResult = { error?: string; key?: string } | void;

type Props = {
  columns: SheetColumn[];
  rows: SheetRow[];
  /** 줄 확정. 실패하면 { error } — 값은 유지되고 그 칸만 오류를 문다. */
  onCommitRow: (rowId: string, values: SheetRow) => Promise<SheetCommitResult>;
  /** Enter가 훑는 순서. 없으면 edit 있는 열 순서. 여기 없는 칸은 건너뛴다. */
  enterOrder?: string[];
  /** 없으면 초안 줄을 안 그린다(읽기 표로도 쓸 수 있다). */
  draft?: {
    seed?: Record<string, unknown>;
    ready: (values: Record<string, unknown>) => boolean;
    onCreate: (values: Record<string, unknown>) => Promise<SheetCommitResult>;
  };
  /** ⋮ 메뉴에 덧붙일 소비처 액션. 「수정」은 부품이 앞에 넣는다(편집 진입은 부품의 계약이다). */
  rowActions?: (row: SheetRow) => Action[];
  /** 그 줄 아래에서 열리는 패널 — 열로 못 올리는 것(첨부·메모)만. */
  expand?: {
    icon?: IconName;                       // 우측 글리프(기본 paperclip)
    count?: (row: SheetRow) => number;     // 0이면 글리프를 안 그린다(조용한 표)
    render: (row: SheetRow) => ReactNode;
  };
  expandedId?: string | null;
  onExpandChange?: (id: string | null) => void;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;   // controlled — 정렬 수행은 소비처
  /** 하단 고정 합계. 열 key로 값을 주면 **그 열의 read 타입**으로 그린다(ReactNode 슬롯이 아니다). */
  totals?: Record<string, unknown>;
  totalsLabel?: string;
  emptyState?: { icon?: IconName; title: string; description?: string };
};

const READ_OF: Record<SheetEditKind, CellType> = {
  text: 'text', number: 'number', currency: 'currency', date: 'date', select: 'text',
};
const readTypeOf = (c: SheetColumn): CellType => c.read ?? (c.edit ? READ_OF[c.edit] : 'text');
// 값 열의 최소폭은 그 열의 **서식**이 정한다 — 임의 px가 아니라 read 타입에서 도출된다.
const WIDTH_CLASS: Partial<Record<CellType, string>> = {
  date: 'w-date', currency: 'w-money', number: 'w-num', percent: 'w-num',
};

export function DataSheet({
  columns, rows, onCommitRow, enterOrder, draft, rowActions,
  expand, expandedId, onExpandChange, sort, onSortChange, totals, totalsLabel = '합계', emptyState,
}: Props) {
  // 부품이 드는 것은 **편집 UI 상태와 초안 값**뿐. 저장된 값은 전부 소비처 것이다.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  // 활성 칸은 **어느 줄의** 어느 칸인지까지 든다. key만 들면 초안 줄과 열린 줄이 같은 key를 공유해
  //  두 곳에 동시에 커서가 가고, 초안 줄은 editingId가 null이라 아예 포커스를 못 받는다.
  const [active, setActive] = useState<{ id: string; key: string } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [draftFocused, setDraftFocused] = useState(false);
  const [err, setErr] = useState<{ id: string; key?: string; msg: string } | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>(draft?.seed ?? {});

  const DRAFT_ID = '__draft';
  const isDraft = (id: string) => id === DRAFT_ID;
  const colOf = (key: string) => columns.find((c) => c.key === key);
  const canEdit = (c: SheetColumn, row: SheetRow) => !!c.edit && (!c.editable || c.editable(row));
  const order = enterOrder ?? columns.filter((c) => c.edit).map((c) => c.key);

  const draftRow: SheetRow = { id: DRAFT_ID, ...draftValues };
  // 초안 줄이 **손을 탄 상태인가.** 입력 상자 자체가 "여기에 친다"를 이미 말하고 있으므로
  //  ✕/✓는 상시로 띄우지 않는다 — 아무것도 안 한 줄에 되돌릴 것도 확정할 것도 없다.
  //  판정 셋: 포커스가 안에 있거나 · 값이 하나라도 seed와 다르거나 · 딸린 패널이 열려 있거나.
  //  ("값이 있으면"이 빠지면 포커스를 옮기는 순간 친 값이 있는데 ✓가 사라진다.)
  const draftSeed = draft?.seed ?? {};
  const draftDirty = Object.keys({ ...draftSeed, ...draftValues })
    .some((k) => (draftValues[k] ?? '') !== (draftSeed[k] ?? ''));
  const draftEngaged = draftFocused || draftDirty || expandedId === DRAFT_ID;
  const rowById = (id: string) => (isDraft(id) ? draftRow : rows.find((r) => r.id === id));
  // 편집 중인 줄은 화면값(values)이 진실, 아니면 데이터가 진실.
  const viewOf = (row: SheetRow): SheetRow =>
    editingId === row.id ? ({ ...row, ...values } as SheetRow) : row;

  const openRow = (id: string, key?: string) => {
    const row = rowById(id);
    if (!row) return;
    const first = key ?? order.find((k) => { const c = colOf(k); return c && canEdit(c, row); }) ?? null;
    setEditingId(id); setValues({ ...row }); setActive(first ? { id, key: first } : null); setFocusId(id); setErr(null);
  };
  const closeRow = () => { setEditingId(null); setValues({}); setActive(null); setErr(null); };

  const nextKey = (id: string, key: string, back = false): string | null => {
    const row = viewOf(rowById(id) as SheetRow);
    const list = order.filter((k) => { const c = colOf(k); return c && canEdit(c, row); });
    const i = list.indexOf(key);
    if (i === -1) return list[0] ?? null;
    const j = i + (back ? -1 : 1);
    return j < 0 || j >= list.length ? null : list[j];
  };

  const commit = async (id: string) => {
    if (isDraft(id)) {
      if (!draft) return;
      // 초안 값의 주인은 draftValues 하나다 — 다른 줄을 열어 둔 채라도 values가 섞이면 안 된다.
      const merged = { ...draftRow };
      if (!draft.ready(merged)) { setErr({ id, msg: '칸을 채워주세요' }); return; }
      const res = await draft.onCreate(merged);
      if (res && res.error) { setErr({ id, key: res.key, msg: res.error }); if (res.key) setActive({ id, key: res.key }); return; }
      setDraftValues(draft.seed ?? {});
      setErr(null);
      setActive(order[0] ? { id, key: order[0] } : null);   // 새 초안의 첫 칸으로
      // 딸린 패널이 열린 채로 확정하면 **새 빈 초안의 패널이 열려 있게 된다**(id가 그대로라).
      if (expandedId === DRAFT_ID) onExpandChange?.(null);
      return;
    }
    const res = await onCommitRow(id, { ...(rowById(id) ?? {}), ...values } as SheetRow);
    if (res && res.error) { setErr({ id, key: res.key, msg: res.error }); if (res.key) setActive({ id, key: res.key }); return; }
    closeRow(); setFocusId(id);
  };

  // 초안은 늘 편집 상태다 — 값은 draftValues에, 열림 여부는 editingId와 무관.
  const setCell = (id: string, key: string, v: unknown) => {
    if (isDraft(id) && editingId !== DRAFT_ID) setDraftValues((p) => ({ ...p, [key]: v }));
    else setValues((p) => ({ ...p, [key]: v }));
  };
  const cellValue = (id: string, key: string): unknown => {
    if (editingId === id) return values[key];
    if (isDraft(id)) return draftValues[key];
    return rowById(id)?.[key];
  };

  // 초안 줄은 **늘 편집 상태**라 열 필요가 없다(열면 값의 주인이 draftValues와 values로 갈린다).
  const goTo = (id: string, key: string) => {
    if (isDraft(id) || editingId === id) setActive({ id, key });
    else openRow(id, key);
  };

  /* ── 편집 칸 — Mantine 입력 프리미티브를 그대로 쓴다(컨트롤을 손으로 안 만든다, 01 §4-D).
        치수만 datasheet.css가 행에 맞추고, 테두리는 fieldBorder 역할 변수 통로를 그대로 탄다. ── */
  const editControl = (row: SheetRow, c: SheetColumn) => {
    const id = row.id;
    const raw = cellValue(id, c.key);
    const set = (v: unknown) => setCell(id, c.key, v);
    const autoFocus = active?.id === id && active.key === c.key;
    const isErrCell = err?.id === id && err.key === c.key;
    // 에러면 자식 영역에 --field-border를 danger로 깐다 — 입력칸은 자기가 에러인지 모른다(역할 변수 통로).
    const wrap = (node: ReactNode) => (
      <div style={isErrCell ? ({ ['--field-border']: 'var(--text-danger)' } as CSSProperties) : undefined}>{node}</div>
    );
    const common = {
      size: 'xs' as const,
      radius: 'sm' as const,
      classNames: { input: 'erpDsInput' },
      styles: { input: fieldBorder },
      autoFocus,
      // 날짜 칸은 **빈 채로 두지 않는다.** DatePickerInput은 값이 없으면 아무것도 안 그려서
      //  빈 초안 줄의 일자가 통째로 빈칸이 된다(무엇을 치는 칸인지 알 수 없다).
      //  서식을 그대로 예시로 쓴다 — 표기 규칙(DATE_FORMAT)과 안내가 한 값에서 나오므로 갈릴 수 없다.
      placeholder: c.placeholder ?? (c.edit === 'date' ? DATE_FORMAT : undefined),
    };
    const keys = commitKeyHandler({
      onCommit: () => { const nk = nextKey(id, c.key); if (nk) goTo(id, nk); else void commit(id); },
      onCancel: () => { if (isDraft(id)) { setDraftValues(draft?.seed ?? {}); setErr(null); } else { closeRow(); setFocusId(id); } },
    });

    switch (c.edit) {
      case 'currency':
        return wrap(<MNumberInput {...common} value={(raw as number | string) ?? ''} onChange={set} onKeyDown={keys}
          hideControls prefix="₩ " thousandSeparator="," decimalScale={0} />);
      case 'number':
        return wrap(<MNumberInput {...common} value={(raw as number | string) ?? ''} onChange={set} onKeyDown={keys} hideControls />);
      case 'date':
        // 달력이 열려 있는 동안 ↑↓·Enter는 **그 팝업의 것**이다 — 격자가 가로채면 날짜를 못 고른다.
        //  그래서 팝업형 칸엔 commit 키를 안 건다(이동은 Tab·Esc가 받는다).
        // ⚠ 빈 값은 반드시 null로 넘긴다. 초안 seed의 ''를 그대로 주면 파싱에 실패해 **"Invalid Date"가 찍힌다**
        //   (?? 는 ''를 통과시킨다 — || 여야 한다). 빈 초안 줄에서 바로 드러났다.
        return wrap(<MDatePicker {...common} value={(raw as string) || null} onChange={set} valueFormat={DATE_FORMAT}
          rightSection={<Icon name="calendar" size="sm" color="secondary" />} />);
      case 'select':
        return wrap(<MSelect {...common} data={c.options ?? []} value={(raw as string) || null} onChange={set}
          searchable={false} rightSection={<Icon name="chevron-down" size="sm" color="secondary" />} />);
      default:
        return wrap(<MTextInput {...common} value={(raw as string) ?? ''} onChange={(e) => set(e.currentTarget.value)} onKeyDown={keys} />);
    }
  };

  const cellNode = (row: SheetRow, c: SheetColumn, editingThisRow: boolean) => {
    const type = readTypeOf(c);
    const editable = canEdit(c, row);
    const cls = ['erpDsCell', cellAlign(type) === 'right' ? 'is-num' : '', WIDTH_CLASS[type] ?? '',
      editingThisRow && editable ? 'is-field' : '', editingThisRow && !editable ? 'is-derived' : ''].filter(Boolean).join(' ');
    // 포커스가 들어온 칸이 곧 활성 칸이다 — 마우스로 눌러 들어오든 키보드로 옮겨오든 한 경로로 잡힌다.
    if (editingThisRow && editable)
      return <div className={cls} onFocus={() => setActive({ id: row.id, key: c.key })}>{editControl(row, c)}</div>;
    const value = editingThisRow ? cellValue(row.id, c.key) : row[c.key];
    // 표시는 DataTable과 **같은 renderCell** — 표현 어휘가 두 부품에서 갈리지 않는다.
    //  클릭으로 칸을 옮기는 건 **이미 열린 줄 안에서만**이다. 닫힌 줄의 칸을 눌러 편집이 열리면
    //  "저장된 행은 읽기"가 무너져 결국 상시 인라인 편집으로 돌아간다(진입은 ⋮「수정」·Enter 하나뿐).
    return (
      <div className={cls} onMouseDown={editingThisRow && editable ? () => goTo(row.id, c.key) : undefined}>
        <span className="erpDsVal">{renderCell(type, value, { badgeColors: c.badgeColors })}</span>
      </div>
    );
  };

  // 펼침(첨부·메모) 트리거 — **행의 편집 상태와 무관하다.**
  //  첨부는 그 행의 *자식 레코드*지 필드 값이 아니라서, 필드 편집을 확정·되돌리는 것과 상관이 없다.
  //  편집 중에 사라지면 "고치는 김에 증빙도 붙이자"가 막힌다(확정 → 재진입 2단계가 강제된다).
  // 규칙은 **모든 행에 하나**다(초안 특례 없음):
  //  딸린 게 있으면 항시(개수와 함께) / 없으면 hover 또는 그 줄이 편집 상태일 때만(CSS `.is-quiet`).
  //  아예 안 그리면 붙일 길을 못 찾고, 상시로 두면 "모든 행에 신호"라는 같은 소음으로 돌아간다.
  const expandBtn = (row: SheetRow) => {
    if (!expand) return null;
    const n = expand.count ? expand.count(row) : 0;
    return (
      <button type="button" className={`erpDsExpBtn${n === 0 ? ' is-quiet' : ''}`}
        aria-label={n > 0 ? `딸린 항목 ${n}건` : '딸린 항목 추가'}
        onClick={() => onExpandChange?.(expandedId === row.id ? null : row.id)}>
        <Icon name={expand.icon ?? 'paperclip'} size="sm" color="secondary" />{n > 0 ? n : ''}
      </button>
    );
  };

  const actionsCell = (row: SheetRow, editingThisRow: boolean) => {
    // 초안 줄은 늘 입력 상자를 갖지만, **손을 타기 전에는 ✕/✓를 안 낸다** — 되돌릴 것도 확정할 것도 없다.
    //  (입력 상자 자체가 "여기에 친다"를 이미 말하고 있다.)
    if (isDraft(row.id) && !draftEngaged) return <div className="erpDsAct">{expandBtn(row)}</div>;
    if (editingThisRow) return (
      <div className="erpDsAct">
        {expandBtn(row)}
        <button type="button" className="erpDsMini" aria-label="되돌림"
          onMouseDown={(e) => { e.preventDefault(); if (isDraft(row.id)) { setDraftValues(draft?.seed ?? {}); setErr(null); } else { closeRow(); setFocusId(row.id); } }}>
          <Icon name="x" size="sm" />
        </button>
        <button type="button" className="erpDsMini" aria-label="확정"
          onMouseDown={(e) => { e.preventDefault(); void commit(row.id); }}>
          <Icon name="check" size="sm" color="primary" />
        </button>
      </div>
    );
    const items: Action[] = [
      { label: '수정', icon: 'edit', onClick: () => openRow(row.id) },
      ...(expand ? [{ label: expandedId === row.id ? '접기' : '펼치기', icon: 'chevron-down' as IconName,
        onClick: () => onExpandChange?.(expandedId === row.id ? null : row.id) }] : []),
      ...(rowActions?.(row) ?? []),
    ];
    return (
      <div className="erpDsAct">
        {expandBtn(row)}
        <Menu trigger={<IconButton icon="dots-vertical" label="행 메뉴" variant="ghost" size="sm" />} items={items} position="bottom" align="end" />
      </div>
    );
  };

  const rowTr = (row: SheetRow, opts: { draft?: boolean } = {}) => {
    const editingThisRow = opts.draft || editingId === row.id;
    const view = editingThisRow ? viewOf(row) : row;
    // 초안 줄의 '편집 중'은 draftEngaged가 정한다 — 유휴 초안은 점선 상자(is-idle),
    //  손을 타면 저장 행을 연 것과 **똑같은** 편집 표현(is-editing)이 된다: 편집 중인 줄은 다 같게 생겼다.
    const rowEditing = opts.draft ? draftEngaged : editingThisRow;
    const cls = ['erpDsRow', opts.draft ? 'is-draft' : '', rowEditing ? 'is-editing' : '',
      opts.draft && !draftEngaged ? 'is-idle' : '',
      focusId === row.id && !rowEditing ? 'is-focus' : ''].filter(Boolean).join(' ');
    return (
      <tr key={row.id} className={cls} tabIndex={focusId === row.id ? 0 : -1}
        // 초안 줄은 **어디를 눌러도** 작성 상태로 들어간다(칸 밖 여백을 눌러도 마찬가지).
        onMouseDown={() => {
          if (opts.draft) { setDraftFocused(true); return; }
          if (!editingThisRow && !editingId) setFocusId(row.id);
        }}
        // 초안 줄의 "손을 탔나" 판정 — 포커스가 줄 안에 있는 동안만 참.
        //  relatedTarget이 줄 안이면(칸 사이 이동) 유지한다. 줄 밖으로 나가야 풀린다.
        onFocus={opts.draft ? () => setDraftFocused(true) : undefined}
        onBlur={opts.draft ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDraftFocused(false); } : undefined}
        onKeyDown={(e) => {
          if (editingThisRow) {
            if (e.key === 'Enter' && isComposingEvent(e)) return;    // IME 가드
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void commit(row.id); return; }
            if (e.key === 'Tab' && active?.id === row.id) {
              const nk = nextKey(row.id, active.key, e.shiftKey);
              if (nk) { e.preventDefault(); goTo(row.id, nk); }
              return;
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              if (opts.draft) { setDraftValues(draft?.seed ?? {}); setErr(null); } else { closeRow(); setFocusId(row.id); }
            }
            return;
          }
          if (e.key === 'Enter') { e.preventDefault(); openRow(row.id); }
        }}>
        {columns.map((c) => (
          <td key={c.key} className={c.grow ? 'is-grow' : undefined}>{cellNode(view, c, editingThisRow)}</td>
        ))}
        <td className="is-act">{actionsCell(row, editingThisRow)}</td>
      </tr>
    );
  };

  const extraRows = (row: SheetRow) => {
    const out: ReactNode[] = [];
    if (err?.id === row.id) out.push(
      <tr key={`${row.id}-err`} className="erpDsErrRow"><td colSpan={columns.length + 1}>
        <div className="erpDsErrLine"><Icon name="alert-triangle" size="sm" color="danger" /><Text variant="caption" color="danger">{err.msg}</Text></div>
      </td></tr>,
    );
    if (expand && expandedId === row.id) out.push(
      <tr key={`${row.id}-exp`} className="erpDsExpRow"><td colSpan={columns.length + 1}>
        <div className="erpDsExpBody">{expand.render(row)}</div>
      </td></tr>,
    );
    return out;
  };

  if (rows.length === 0 && !draft)
    return <EmptyState icon={emptyState?.icon} title={emptyState?.title ?? '데이터 없음'} description={emptyState?.description} />;

  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    onSortChange(sort?.key === key ? { key, direction: sort.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  };

  return (
    <div className="erpDs">
      <div className="erpDsScroll">
        <table className="erpDsTable" role="grid">
          <thead>
            <tr>
              {columns.map((c) => {
                const type = readTypeOf(c);
                const active = sort?.key === c.key;
                const arrow: IconName = active && sort?.direction === 'desc' ? 'chevron-down' : 'chevron-up';
                return (
                  <th key={c.key} style={HEAD_CELL}
                    className={[cellAlign(type) === 'right' ? 'is-num' : '', c.sortable ? 'is-sortable' : '', active ? 'is-sorted' : ''].filter(Boolean).join(' ')}
                    aria-sort={active ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={c.sortable ? () => toggleSort(c.key) : undefined}>
                    {c.label}
                    {c.sortable && <span className="erpDsSortMark"><Icon name={active ? arrow : 'chevron-down'} size="sm" color="secondary" /></span>}
                  </th>
                );
              })}
              <th className="is-act" style={HEAD_CELL} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => [rowTr(r), ...extraRows(r)])}
            {draft && [rowTr(draftRow, { draft: true }), ...extraRows(draftRow)]}
          </tbody>
          {totals && (
            <tfoot>
              <tr>
                {columns.map((c, i) => {
                  const type = readTypeOf(c);
                  const v = totals[c.key];
                  const body = i === 0 && v == null ? totalsLabel
                    : type === 'currency' ? fmtCurrency(v) : type === 'number' ? fmtNumber(v) : (v == null ? '' : String(v));
                  return <td key={c.key} className={cellAlign(type) === 'right' ? 'is-num' : undefined}>{body}</td>;
                })}
                <td className="is-act" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
