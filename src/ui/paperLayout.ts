// 문서 배치 엔진 — 순수 함수. PaperSpec + 값 → 쪽 배열.
//  React 밖에 두는 이유: 쪽 나눔은 "몇 줄이 되는가"의 계산이라 렌더와 분리해야 검증이 된다
//  (_calendarLanes·hierarchyImport 선례).
//
// 쪽 나눔을 저작이 아니라 여기서 하는 근거: 반복 행이 몇 줄이 될지는 값이 와야 안다.
// 그리고 브라우저 인쇄에 맡기면 매 쪽 머리말이 안 붙고(사파리는 첫 장만) 표가 행 중간에서 잘린다.
import {
  pageRowsOf, rowUnitOf, PAPER_TAG,
  type PaperSpec, type PaperCell, type PaperBand, type PaperAgg,
} from '../schema/paper';

/**
 * `at`은 반복 몇 번째 항목의 칸인가 — 편집 모드가 값을 되쓸 때 필요하다(보기에선 안 쓴다).
 * `depth`는 들여쓸 계단 수(트리 배열의 깊이 − 1). `indent` 칸에만 실린다.
 */
export type OutCell = { spec: PaperCell; text: string; at?: number; depth?: number };
/**
 * `group`은 이 행이 어느 묶음에 속하는지 — 걸침 칸(`scope: 'group'`)을 쪽 나눔 **뒤에** 붙이려고 남긴다.
 * `repeat`는 어느 반복 밴드에서 나온 줄인지 — 표의 **마감선**을 쪽 나눔 뒤에 다시 잡으려고 남긴다.
 */
export type OutRow = { h: number; cells: OutCell[]; group?: number; repeat?: number };
export type OutPage = { header: OutRow[]; body: OutRow[]; footer: OutRow[]; pad: number };

type Scope = {
  item?: Record<string, unknown>;
  group?: Record<string, unknown>[];
  at?: number;            // 반복 원본에서의 항목 번호(묶음 안 순번이 아니라 **원본 순번**)
  depth?: number;         // **표시 깊이**(가장 얕은 줄이 1). 들여쓰는 칸이 읽는다 — 원본 깊이가 아니다
  ordinal?: number;       // 몇 번째 묶음인가(1부터). 번호 붙이는 칸이 읽는다
};

// ── 값 경로 ────────────────────────────────────────────────────
// "부속.개수" 같은 점 경로를 읽고 쓴다. **경로 규칙은 여기 한 곳에만 산다** —
//  배치(읽기)와 편집(쓰기)이 규칙을 따로 가지면 조용히 어긋난다.
export function paperRead(
  values: Record<string, unknown>, field: string, at?: number,
): unknown {
  const dot = field.indexOf('.');
  if (dot < 0) return values[field];
  if (at == null) return undefined;
  const list = values[field.slice(0, dot)] as Record<string, unknown>[] | undefined;
  return list?.[at]?.[field.slice(dot + 1)];
}

/** 되쓰기 — 원본은 안 건드리고 **다음 값 전체**를 만든다(소비처는 setState 하나로 받는다). */
export function paperWrite(
  values: Record<string, unknown>, field: string, at: number | undefined, next: unknown,
): Record<string, unknown> {
  const dot = field.indexOf('.');
  if (dot < 0) return { ...values, [field]: next };
  if (at == null) return values;
  const name = field.slice(0, dot), key = field.slice(dot + 1);
  const list = ((values[name] as Record<string, unknown>[] | undefined) ?? []).slice();
  list[at] = { ...list[at], [key]: next };
  return { ...values, [name]: list };
}

// ── 표시 형식 ──────────────────────────────────────────────────
// 저장값은 안 건드리고 표현만 바꾼다. 통화·숫자는 기존 셀 어휘와 같은 ko-KR 포맷.
const fmtNumber = (n: number) => n.toLocaleString('ko-KR');
const fmtCurrency = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

function format(v: unknown, kind: PaperCell['format']): string {
  if (v == null || v === '') return '';
  switch (kind) {
    case 'number':   return typeof v === 'number' ? fmtNumber(v) : String(v);
    case 'currency': return typeof v === 'number' ? fmtCurrency(v) : String(v);
    case 'percent':  return typeof v === 'number' ? `${v}%` : String(v);
    case 'boolean':  return v ? '✓' : '—';
    default:         return String(v);
  }
}

// ── 값 해석 ────────────────────────────────────────────────────
// "lines.qty"는 반복 스코프의 항목에서, "docNo"는 문서 스코프에서 읽는다.
function readField(path: string, values: Record<string, unknown>, scope: Scope): unknown {
  const dot = path.indexOf('.');
  if (dot >= 0) return scope.item?.[path.slice(dot + 1)];
  return values[path];
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// 집계 — 서식이 선언하고 여기서 계산한다(소비처가 하면 그룹 기준을 알아야 해서 계약이 샌다).
//  대상 배열은 **집계식이 스스로 말한다**(`투입.금액` → `투입`). 그래야 문서에 반복 구간이 여럿일 때
//  총계가 엉뚱한 배열을 더하지 않는다 — 실제로 직접경비 소계가 인건비 스코프로 계산돼 0이 나왔다.
//  단 그룹 꼬리(소계)는 «지금 묶음»이 스코프라 그쪽이 우선한다.
function aggregate(
  agg: PaperAgg, values: Record<string, unknown>, scope: Scope,
): number {
  const paths = Array.isArray(agg.of) ? agg.of : [agg.of];
  const keys = paths.map((p) => (p.includes('.') ? p.slice(p.indexOf('.') + 1) : p));
  const arrName = paths[0]?.includes('.') ? paths[0].slice(0, paths[0].indexOf('.')) : '';
  const rows = scope.group
    ?? ((values[arrName] as Record<string, unknown>[] | undefined) ?? []);
  if (agg.fn === 'count') return rows.length;
  const total = rows.reduce((sum, row) => sum + keys.reduce((s, k) => s + toNumber(row[k]), 0), 0);
  return agg.fn === 'avg' ? (rows.length ? total / rows.length : 0) : total;
}

// ── 행 조립 ────────────────────────────────────────────────────
function rowHeight(spec: PaperSpec, r: number): number {
  return spec.rows?.find((x) => x.r === r)?.h ?? 1;
}

function buildCell(
  c: PaperCell, values: Record<string, unknown>, scope: Scope,
  page: { n: number; total: number },
): OutCell {
  const one = (name: string): string => {
    if (name === '@page') return String(page.n);
    if (name === '@pages') return String(page.total);
    if (name === '@today') return '';        // 소비처가 주입(부품은 시계를 안 본다)
    return format(readField(name, values, scope), c.format);
  };
  let text = '';
  if (c.text != null) text = c.text;
  else if (c.template != null) text = c.template.replace(PAPER_TAG, (_, n: string) => one(n.trim()));
  else if (c.field) text = one(c.field);
  else if (c.agg) text = format(aggregate(c.agg, values, scope), c.format ?? 'number');
  // 묶음 번호 — 「1. 주방」. **표시에만 붙는다**: 값에 섞으면 편집 모드에서 번호까지 고치게 되고,
  //  줄을 하나 지울 때마다 데이터의 번호와 종이의 번호가 갈린다.
  if (c.number && scope.ordinal && text) text = `${scope.ordinal}. ${text}`;
  return {
    spec: c, text,
    ...(scope.at != null ? { at: scope.at } : {}),
    // 밀 계단 수. 깊이 1이 기준선이라 «깊이 − 1»이다(맨 얕은 줄은 안 밀린다).
    //  여기서 수로 굳혀 내보낸다 — 렌더가 값을 다시 읽으면 깊이 열이 어디 있는지 알아야 한다.
    ...(c.indent && scope.depth ? { depth: Math.max(0, scope.depth - 1) } : {}),
  };
}

/** 묶음에 걸치는 칸은 항목마다 그리지 않는다 — 쪽을 나눈 뒤에 묶음 단위로 한 번 붙인다. */
const spansGroup = (c: PaperCell) => c.scope === 'group';

function buildRow(
  spec: PaperSpec, r: number, values: Record<string, unknown>, scope: Scope,
  page: { n: number; total: number },
  pick: (c: PaperCell) => boolean = () => true,
): OutRow {
  const cells = spec.cells
    .filter((c) => c.r === r && pick(c))
    .map<OutCell>((c) => buildCell(c, values, scope, page));
  return { h: rowHeight(spec, r), cells };
}

// ── 반복 묶음 ──────────────────────────────────────────────────
// 밴드 순서는 columnHeader → groupHeader → repeat → groupFooter 를 전제한다
// (리포트 엔진들의 배치 순서 그대로). 그 밖의 순서는 지금 다루지 않는다.
type Cluster = {
  columnHeader?: PaperBand; groupHeader?: PaperBand; repeat: PaperBand; groupFooter?: PaperBand;
  from: number; to: number;
};

// 문서에 반복 구간이 **여럿**일 수 있다(산출내역서: 투입공수 · 직접경비).
//  각 repeat를 축으로, 그 위의 열머리·그룹머리와 아래의 그룹꼬리를 «다음 repeat를 넘지 않는 선에서» 붙인다.
function findClusters(spec: PaperSpec): Cluster[] {
  const bands = [...(spec.bands ?? [])].sort((a, b) => a.r1 - b.r1);
  const repeats = bands.filter((b) => b.kind === 'repeat');
  return repeats.map((repeat, i) => {
    const prev = repeats[i - 1];
    const next = repeats[i + 1];
    const above = (k: PaperBand['kind']) =>
      bands.filter((b) => b.kind === k && b.r2 < repeat.r1 && (!prev || b.r1 > prev.r2)).pop();
    const below = (k: PaperBand['kind']) =>
      bands.find((b) => b.kind === k && b.r1 > repeat.r2 && (!next || b.r2 < next.r1));
    const columnHeader = above('columnHeader');
    const groupHeader = above('groupHeader');
    const groupFooter = below('groupFooter');
    const all = [columnHeader, groupHeader, repeat, groupFooter].filter(Boolean) as PaperBand[];
    return {
      columnHeader, groupHeader, repeat, groupFooter,
      from: Math.min(...all.map((b) => b.r1)),
      to: Math.max(...all.map((b) => b.r2)),
    };
  });
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ── 본체 ───────────────────────────────────────────────────────
export function layoutPaper(
  spec: PaperSpec,
  values: Record<string, unknown> = {},
): OutPage[] {
  const bands = spec.bands ?? [];
  const maxRow = spec.cells.reduce((m, c) => Math.max(m, c.r + (c.rs ?? 1) - 1), 0);
  const clusters = findClusters(spec);
  const clusterAt = new Map(clusters.map((c) => [c.from, c]));
  const pageBand = {
    header: bands.find((b) => b.kind === 'pageHeader'),
    footer: bands.find((b) => b.kind === 'pageFooter'),
  };
  const summary = bands.find((b) => b.kind === 'summary');
  // 묶음 축의 반복 — 반복 클러스터에 안 붙는다(자기 구간이다). 시작 행으로 찾는다.
  const groupRepeatAt = new Map(
    bands.filter((b) => b.kind === 'groupRepeat').map((b) => [b.r1, b]),
  );

  const inBand = (r: number, b?: PaperBand) => !!b && r >= b.r1 && r <= b.r2;
  const pin = { n: 1, total: 1 };   // 1패스에선 임시값. 총 쪽수가 나오면 2패스에서 다시 짠다.

  // ① 흐름 만들기 — 반복을 값만큼 펼치고, 그룹 경계에서 머리·꼬리를 끼운다.
  const flow: { row: OutRow; keep?: 'columnHeader' | 'groupHeader'; reset?: boolean }[] = [];
  // 걸침 칸은 여기 모아 두고 쪽 나눔이 끝난 뒤에 붙인다(묶음이 쪽을 넘어가면 쪽마다 갈라야 하므로).
  const groupSpans = new Map<number, OutCell[]>();
  let groupSeq = 0;

  for (let r = 0; r <= maxRow; r++) {
    if (inBand(r, pageBand.header) || inBand(r, pageBand.footer)) continue;

    // ── 묶음반복 — **묶음 수만큼** 한 줄씩. 반복이 «항목» 축이면 이건 «묶음» 축이다.
    //  상세 표와 떨어진 자리에서 「종류별로 얼마」를 모아 보이는 구간(사용내역서 하단).
    //  새로 지은 건 «자리»뿐이다 — 값은 이미 다 있었다: `{{묶음:부속.종류}}`는 scope.item에서 그 묶음의
    //  종류를 읽고, `{{합계:부속.금액}}`은 scope.group이 있으면 **그 묶음 범위만** 더한다(aggregate 참조).
    //  ⚠ 여기선 걸침 칸을 «걸치지» 않는다(rs=1) — 한 묶음이 한 줄이라 걸칠 대상이 없다.
    //    그래서 groupSpans에 안 넣고 그냥 그린다.
    const gRep = groupRepeatAt.get(r);
    if (gRep) {
      const by = gRep.by ?? '';
      const dot = by.indexOf('.');
      const items = (values[dot < 0 ? by : by.slice(0, dot)] as Record<string, unknown>[]) ?? [];
      const key = dot < 0 ? '' : by.slice(dot + 1);
      const order: string[] = [];
      const map = new Map<string, Record<string, unknown>[]>();
      items.forEach((it) => {
        const k = String(key ? it[key] ?? '' : '');
        if (!map.has(k)) { map.set(k, []); order.push(k); }
        map.get(k)!.push(it);
      });
      order.forEach((k, i) => {
        const group = map.get(k)!;
        const scope: Scope = { item: group[0], group, ordinal: i + 1 };
        range(gRep.r1, gRep.r2).forEach((rr) => flow.push({ row: buildRow(spec, rr, values, scope, pin) }));
      });
      r = gRep.r2;
      continue;
    }

    const cluster = clusterAt.get(r);
    if (cluster) {
      const allItems = (values[cluster.repeat.source ?? ''] as Record<string, unknown>[]) ?? [];
      // 새 반복 묶음이 시작되면 앞 묶음의 재출력 머리를 잊는다(딴 표의 열머리를 물려주면 안 된다).
      flow.push({ row: { h: 0, cells: [] }, reset: true });
      const colHead = () => {
        if (!cluster.columnHeader) return;
        range(cluster.columnHeader.r1, cluster.columnHeader.r2).forEach((cr) =>
          flow.push({ row: buildRow(spec, cr, values, {}, pin), keep: 'columnHeader' }));
      };
      // 열 머리 — **시트에 적힌 순서가 곧 발화 순서다.** 열머리가 그룹머리 «위»면 표 전체에 한 번이고,
      //  «아래»면 구획 안의 줄이라 묶음마다 다시 난다(내역서: 「1. 주방」 밑에 공사·단위·수량… 이 다시 온다).
      //  전에는 앞의 순서만 다뤘다 — 뒤 순서를 안 열면 구획형 표에서 열머리가 첫 묶음에만 붙는다.
      const headInGroup = !!cluster.columnHeader && !!cluster.groupHeader
        && cluster.columnHeader.r1 > cluster.groupHeader.r2;
      if (!headInGroup) colHead();
      // 묶음에 걸치는 칸 — 반복 구간 안의 `scope: 'group'` 칸. 이 칸이 있으면 **자기가 묶음 기준**이다
      //  (「경첩」 칸이 곧 «종류로 묶는다»는 선언이라, 그룹 머리 밴드 없이도 묶임이 성립한다).
      const spanSpecs = range(cluster.repeat.r1, cluster.repeat.r2)
        .flatMap((rr) => spec.cells.filter((c) => c.r === rr && spansGroup(c)));

      // 이 반복의 원본이 **트리인가** — 깊이 열을 가진 배열이면 줄마다 깊이가 있다.
      const levelKey = spec.arrays?.find((a) => a.name === cluster.repeat.source)?.level;
      const depthOf = (it: Record<string, unknown>) =>
        (levelKey ? Number(it[levelKey]) : 0) || (levelKey ? 1 : 0);

      // 그룹으로 묶어 펼치기(그룹 기준이 없으면 한 덩어리)
      const byKey = cluster.groupHeader?.by ?? cluster.groupFooter?.by ?? spanSpecs[0]?.field;
      const key = byKey ? byKey.slice(byKey.indexOf('.') + 1) : null;
      const atLevel = cluster.groupHeader?.atLevel ?? cluster.groupFooter?.atLevel;
      const groups: Record<string, unknown>[][] = [];
      if (levelKey && atLevel != null) {
        // 트리의 묶음은 **구조가 정한다** — 깊이 ≤ N인 줄이 나오면 앞 묶음이 거기서 끝난다.
        //  값으로 묶는 것(아래 key)과 달리 재배열이 없다: 트리는 적힌 순서가 곧 의미다
        //  (같은 이름의 「옵션」이 딴 공사 밑에 또 있어도 한 덩어리로 뭉치면 안 된다).
        allItems.forEach((it) => {
          if (!groups.length || depthOf(it) <= atLevel) groups.push([it]);
          else groups[groups.length - 1].push(it);
        });
      } else if (key) {
        const order: string[] = [];
        const map = new Map<string, Record<string, unknown>[]>();
        allItems.forEach((it) => {
          const k = String(it[key] ?? '');
          if (!map.has(k)) { map.set(k, []); order.push(k); }
          map.get(k)!.push(it);
        });
        order.forEach((k) => groups.push(map.get(k)!));
      } else if (allItems.length) groups.push(allItems);

      // **묶음을 여는 줄은 머리가 가져간다.** 트리에 그룹머리가 있으면 깊이 ≤ atLevel인 그 줄이
      //  구획 제목이 되므로(「1. 주방」), 반복에서 또 그리면 같은 이름이 두 번 나온다.
      //  머리가 없으면 그 줄은 항목으로 남는다(줄마다 자기 금액을 갖는 표가 그렇다).
      const headTakesFirst = !!cluster.groupHeader && !!levelKey && atLevel != null;
      const itemsOf = (g: Record<string, unknown>[]) => (headTakesFirst ? g.slice(1) : g);
      // 들여쓰기의 기준선 = **실제로 그려지는 줄 중 가장 얕은 깊이.** 구획 제목이 깊이 1을 가져가면
      //  항목은 깊이 2에서 시작하는데, 그때 깊이−1을 계단으로 쓰면 표 전체가 한 칸 밀려 들어간다.
      //  묶음별이 아니라 **표 전체**에서 잡는다 — 묶음마다 기준이 다르면 열이 묶음마다 출렁인다.
      const drawn = groups.flatMap(itemsOf);
      const baseDepth = drawn.length ? Math.min(...drawn.map(depthOf)) : 1;

      groups.forEach((group, gi) => {
        const items = itemsOf(group);
        // 묶음 번호 — «몇 번째 묶음인가». 구획 제목이 있으면 그 줄이, 없으면 묶음의 첫 줄이 받는다.
        const scope: Scope = { item: group[0], group, ordinal: gi + 1 };
        if (cluster.groupHeader) {
          range(cluster.groupHeader.r1, cluster.groupHeader.r2).forEach((gr) =>
            flow.push({ row: buildRow(spec, gr, values, scope, pin), keep: 'groupHeader' }));
        }
        if (headInGroup) colHead();
        let gid: number | undefined;
        if (spanSpecs.length) {
          gid = ++groupSeq;
          groupSpans.set(gid, spanSpecs.map((c) => buildCell(c, values, scope, pin)));
        }
        items.forEach((item, ii) => {
          // 원본 순번을 실어 보낸다 — 묶음으로 재배열돼도 편집이 되쓸 자리는 «원본의 그 항목»이다.
          const at = allItems.indexOf(item);
          const rowScope: Scope = {
            item, group, at,
            depth: depthOf(item) - baseDepth + 1,
            ...(!cluster.groupHeader && ii === 0 ? { ordinal: gi + 1 } : {}),
          };
          range(cluster.repeat.r1, cluster.repeat.r2).forEach((dr) =>
            flow.push({
              row: {
                ...buildRow(spec, dr, values, rowScope, pin, (c) => !spansGroup(c)),
                group: gid,
                repeat: cluster.repeat.r1,
              },
            }));
        });
        if (cluster.groupFooter) {
          range(cluster.groupFooter.r1, cluster.groupFooter.r2).forEach((fr) =>
            flow.push({ row: buildRow(spec, fr, values, scope, pin) }));
        }
      });
      // 묶음이 끝나면 재출력 머리를 지운다 — 안 그러면 표가 끝난 뒤 쪽이 넘어갈 때
      //  다음 쪽 머리에 «다 끝난 표의 열머리»가 딸려 나온다(실제로 그랬다).
      flow.push({ row: { h: 0, cells: [] }, reset: true });
      r = cluster.to;
      continue;
    }

    // 합계(summary)는 스코프를 안 준다 — 집계식이 자기 배열을 스스로 말하므로(aggregate 주석),
    //  반복 구간이 여럿이어도 각 총계가 제 배열을 더한다.
    void summary;
    flow.push({ row: buildRow(spec, r, values, {}, pin) });
  }

  // 문서 끝의 빈 행은 내용이 아니라 여백이다 — 그대로 두면 쪽을 넘겨 백지가 한 장 더 나온다.
  //  (꼬리말이 42행에 있고 본문이 29행에서 끝나면 그 사이 12행이 전부 이것이다.)
  //  «사이»의 빈 행은 저작자가 띄운 간격이라 남긴다 — 뒤쪽만 자른다.
  while (flow.length && !flow[flow.length - 1].reset && flow[flow.length - 1].row.cells.length === 0) {
    flow.pop();
  }

  // ② 쪽 나누기 — 행 경계에서만 자른다(반쪽 행이 안 생긴다).
  const budget = pageRowsOf(spec);
  const header = pageBand.header
    ? range(pageBand.header.r1, pageBand.header.r2).map((r) => buildRow(spec, r, values, {}, pin)) : [];
  const footer = pageBand.footer
    ? range(pageBand.footer.r1, pageBand.footer.r2).map((r) => buildRow(spec, r, values, {}, pin)) : [];
  const chrome = [...header, ...footer].reduce((s, x) => s + x.h, 0);
  const bodyBudget = budget - chrome;

  const pages: OutRow[][] = [];
  let cur: OutRow[] = [];
  let used = 0;
  // 쪽이 넘어가면 다시 그릴 것(열 머리·그룹 머리) — 마지막으로 지나온 것을 기억한다.
  let lastColumnHeader: OutRow[] = [];
  let lastGroupHeader: OutRow[] = [];

  const flush = () => { if (cur.length) { pages.push(cur); cur = []; used = 0; } };

  for (const step of flow) {
    // 반복 묶음 경계 — 앞 표의 열머리·그룹머리를 다음 표에 물려주지 않는다.
    if (step.reset) { lastColumnHeader = []; lastGroupHeader = []; continue; }
    if (used + step.row.h > bodyBudget) {
      flush();
      [...lastColumnHeader, ...lastGroupHeader].forEach((row) => { cur.push(row); used += row.h; });
    }
    cur.push(step.row);
    used += step.row.h;
    if (step.keep === 'columnHeader') lastColumnHeader = [step.row];
    if (step.keep === 'groupHeader') lastGroupHeader = [step.row];
  }
  flush();
  if (!pages.length) pages.push([]);

  // ③ 걸침 칸 붙이기 — **쪽을 나눈 뒤에** 한다. 쪽마다 «같은 묶음이 연달아 있는 구간»을 찾아
  //  그 구간의 첫 행에 걸고, 걸치는 길이는 그 쪽에 남은 줄 수다. 묶음이 쪽을 넘어가면 구간이 둘로
  //  나뉘어 각 쪽이 자기 몫만큼만 걸친다 — 인쇄 표에서 「경첩」이 다음 장에 다시 적히는 그 모양.
  //  (나누기 *전에* rs를 박으면 쪽 경계를 뚫고 나가 종이 밖에 그려진다.)
  if (groupSpans.size) {
    pages.forEach((rows) => {
      for (let i = 0; i < rows.length;) {
        const gid = rows[i].group;
        if (gid == null) { i++; continue; }
        let j = i;
        while (j + 1 < rows.length && rows[j + 1].group === gid) j++;
        const rs = j - i + 1;
        const spans = (groupSpans.get(gid) ?? [])
          .map((c) => ({ ...c, spec: { ...c.spec, rs } }));
        rows[i] = { ...rows[i], cells: [...rows[i].cells, ...spans] };
        i = j + 1;
      }
    });
  }

  // ④ 표의 마감선 — **반복 밴드에 그은 «아래» 변은 그 줄이 아니라 표 전체의 바닥**을 뜻한다.
  //  한 줄짜리 밴드를 N번 복제하면 그 굵은 선도 N번 복제돼 **행 사이마다 굵은 선이 깔린다**
  //  (엑셀에서 본 것과 다르다 — 거기선 표 밑에 한 번 그은 선이다). 저작으로는 못 피한다:
  //  같은 한 줄이 «첫 줄이자 마지막 줄»이라 아래 선을 빼면 표가 열린 채로 끝난다.
  //
  //  선 소유권(각 칸은 «자기 위·왼쪽»을 그린다)에서 답이 나온다 — 반복 줄의 아래 선은 원래
  //  «밑 칸이 자기 윗선으로» 그릴 몫이라 중간 줄에선 군더더기고, 굵은 쪽이 이기는 규칙 때문에
  //  그 군더더기가 얇은 구분선을 이겨 버린다. 그러니 **아래 변은 마지막 줄만 갖는다.**
  //  쪽이 갈리면 쪽마다 자기 바닥을 갖는다(표가 장 끝에서 열린 채 끊기지 않게).
  //
  //  ③ **뒤에** 도는 게 중요하다 — 걸침 칸(rs>1)도 자기 아래 변을 갖고 있어서, 그게 묶음마다
  //  찍히면 「경첩」·「레일」 밑에 굵은 선이 하나씩 생긴다. 걸침 칸은 밑변이 닿는 줄로 판정한다.
  pages.forEach((rows) => {
    const last = new Map<number, number>();
    rows.forEach((row, i) => { if (row.repeat != null) last.set(row.repeat, i); });
    if (!last.size) return;
    rows.forEach((row, i) => {
      if (row.repeat == null) return;
      const bottom = last.get(row.repeat);
      const cells = row.cells.map((c) => {
        if (i + (c.spec.rs ?? 1) - 1 === bottom) return c;
        const drop = (edges?: PaperCell['border']) => {
          const kept = (edges ?? []).filter((e) => e !== 'b');
          return kept.length === (edges ?? []).length ? edges : kept;
        };
        const border = drop(c.spec.border);
        const borderStrong = drop(c.spec.borderStrong);
        if (border === c.spec.border && borderStrong === c.spec.borderStrong) return c;
        return { ...c, spec: { ...c.spec, border, borderStrong } };
      });
      rows[i] = { ...row, cells };
    });
  });

  // ⑤ 2패스 — 총 쪽수가 나왔으니 @page/@pages를 실제 값으로 다시 짠다.
  //  머리말·꼬리말은 항상 문서 스코프라(반복 안이 아니다) 여기서 안전하게 다시 채운다.
  const total = pages.length;
  const rebuild = (rows: OutRow[], n: number): OutRow[] =>
    rows.map((row) => ({
      h: row.h,
      cells: row.cells.map((c) => {
        if (c.spec.field === '@page') return { ...c, text: String(n) };
        if (c.spec.field === '@pages') return { ...c, text: String(total) };
        if (c.spec.template && /@(page|pages|쪽|총쪽)/.test(c.spec.template)) {
          const text = c.spec.template.replace(PAPER_TAG, (_, raw: string) => {
            const name = raw.trim();
            if (name === '@page') return String(n);
            if (name === '@pages') return String(total);
            if (name === '@today') return '';
            return format(readField(name, values, {}), c.spec.format);
          });
          return { ...c, text };
        }
        return c;
      }),
    }));

  return pages.map((body, i) => {
    const used2 = body.reduce((s, x) => s + x.h, 0);
    return {
      header: rebuild(header, i + 1),
      body,
      footer: rebuild(footer, i + 1),
      pad: Math.max(0, bodyBudget - used2),   // 꼬리말을 바닥에 붙이는 빈 행
    };
  });
}

/** 지면 픽셀 — 렌더러가 종이 크기를 잡을 때. */
export const paperMetrics = (spec: PaperSpec) => ({
  rowUnit: rowUnitOf(spec),
  rowsPerPage: pageRowsOf(spec),
});
