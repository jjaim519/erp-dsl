// 문서 배치 엔진 — 순수 함수. PaperSpec + 값 → 쪽 배열.
//  React 밖에 두는 이유: 쪽 나눔은 "몇 줄이 되는가"의 계산이라 렌더와 분리해야 검증이 된다
//  (_calendarLanes·hierarchyImport 선례).
//
// 쪽 나눔을 저작이 아니라 여기서 하는 근거: 반복 행이 몇 줄이 될지는 값이 와야 안다.
// 그리고 브라우저 인쇄에 맡기면 매 쪽 머리말이 안 붙고(사파리는 첫 장만) 표가 행 중간에서 잘린다.
import {
  rowsPerPage, PAPER_ROW_UNIT,
  type PaperSpec, type PaperCell, type PaperBand, type PaperAgg,
} from '../schema/paper';

export type OutCell = { spec: PaperCell; text: string };
export type OutRow = { h: number; cells: OutCell[] };
export type OutPage = { header: OutRow[]; body: OutRow[]; footer: OutRow[]; pad: number };

type Scope = { item?: Record<string, unknown>; group?: Record<string, unknown>[] };

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
function aggregate(agg: PaperAgg, rows: Record<string, unknown>[]): number {
  const paths = Array.isArray(agg.of) ? agg.of : [agg.of];
  const keys = paths.map((p) => (p.includes('.') ? p.slice(p.indexOf('.') + 1) : p));
  if (agg.fn === 'count') return rows.length;
  const total = rows.reduce((sum, row) => sum + keys.reduce((s, k) => s + toNumber(row[k]), 0), 0);
  return agg.fn === 'avg' ? (rows.length ? total / rows.length : 0) : total;
}

// ── 행 조립 ────────────────────────────────────────────────────
function rowHeight(spec: PaperSpec, r: number): number {
  return spec.rows?.find((x) => x.r === r)?.h ?? 1;
}

function buildRow(
  spec: PaperSpec, r: number, values: Record<string, unknown>, scope: Scope,
  page: { n: number; total: number },
): OutRow {
  const cells = spec.cells
    .filter((c) => c.r === r)
    .map<OutCell>((c) => {
      let text = '';
      if (c.text != null) text = c.text;
      else if (c.field === '@page') text = String(page.n);
      else if (c.field === '@pages') text = String(page.total);
      else if (c.field === '@today') text = '';                 // 소비처가 주입(부품은 시계를 안 본다)
      else if (c.field) text = format(readField(c.field, values, scope), c.format);
      else if (c.agg) text = format(aggregate(c.agg, scope.group ?? []), c.format ?? 'number');
      return { spec: c, text };
    });
  return { h: rowHeight(spec, r), cells };
}

// ── 반복 묶음 ──────────────────────────────────────────────────
// 밴드 순서는 columnHeader → groupHeader → repeat → groupFooter 를 전제한다
// (리포트 엔진들의 배치 순서 그대로). 그 밖의 순서는 지금 다루지 않는다.
type Cluster = {
  columnHeader?: PaperBand; groupHeader?: PaperBand; repeat: PaperBand; groupFooter?: PaperBand;
  from: number; to: number;
};

function findCluster(spec: PaperSpec): Cluster | null {
  const bands = spec.bands ?? [];
  const repeat = bands.find((b) => b.kind === 'repeat');
  if (!repeat) return null;
  const columnHeader = bands.find((b) => b.kind === 'columnHeader');
  const groupHeader = bands.find((b) => b.kind === 'groupHeader');
  const groupFooter = bands.find((b) => b.kind === 'groupFooter');
  const all = [columnHeader, groupHeader, repeat, groupFooter].filter(Boolean) as PaperBand[];
  return {
    columnHeader, groupHeader, repeat, groupFooter,
    from: Math.min(...all.map((b) => b.r1)),
    to: Math.max(...all.map((b) => b.r2)),
  };
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ── 본체 ───────────────────────────────────────────────────────
export function layoutPaper(
  spec: PaperSpec,
  values: Record<string, unknown> = {},
): OutPage[] {
  const bands = spec.bands ?? [];
  const maxRow = spec.cells.reduce((m, c) => Math.max(m, c.r + (c.rs ?? 1) - 1), 0);
  const cluster = findCluster(spec);
  const pageBand = {
    header: bands.find((b) => b.kind === 'pageHeader'),
    footer: bands.find((b) => b.kind === 'pageFooter'),
  };
  const summary = bands.find((b) => b.kind === 'summary');

  const inBand = (r: number, b?: PaperBand) => !!b && r >= b.r1 && r <= b.r2;
  const pin = { n: 1, total: 1 };   // 1패스에선 임시값. 총 쪽수가 나오면 2패스에서 다시 짠다.

  // ① 흐름 만들기 — 반복을 값만큼 펼치고, 그룹 경계에서 머리·꼬리를 끼운다.
  const flow: { row: OutRow; keep?: 'columnHeader' | 'groupHeader' }[] = [];
  const allItems = (cluster
    ? ((values[cluster.repeat.source ?? ''] as Record<string, unknown>[]) ?? [])
    : []);

  for (let r = 0; r <= maxRow; r++) {
    if (inBand(r, pageBand.header) || inBand(r, pageBand.footer)) continue;

    if (cluster && r === cluster.from) {
      // 열 머리
      if (cluster.columnHeader) {
        range(cluster.columnHeader.r1, cluster.columnHeader.r2).forEach((cr) =>
          flow.push({ row: buildRow(spec, cr, values, {}, pin), keep: 'columnHeader' }));
      }
      // 그룹으로 묶어 펼치기(그룹 기준이 없으면 한 덩어리)
      const byKey = cluster.groupHeader?.by ?? cluster.groupFooter?.by;
      const key = byKey ? byKey.slice(byKey.indexOf('.') + 1) : null;
      const groups: Record<string, unknown>[][] = [];
      if (key) {
        const order: string[] = [];
        const map = new Map<string, Record<string, unknown>[]>();
        allItems.forEach((it) => {
          const k = String(it[key] ?? '');
          if (!map.has(k)) { map.set(k, []); order.push(k); }
          map.get(k)!.push(it);
        });
        order.forEach((k) => groups.push(map.get(k)!));
      } else if (allItems.length) groups.push(allItems);

      groups.forEach((items) => {
        const scope: Scope = { item: items[0], group: items };
        if (cluster.groupHeader) {
          range(cluster.groupHeader.r1, cluster.groupHeader.r2).forEach((gr) =>
            flow.push({ row: buildRow(spec, gr, values, scope, pin), keep: 'groupHeader' }));
        }
        items.forEach((item) => {
          range(cluster.repeat.r1, cluster.repeat.r2).forEach((dr) =>
            flow.push({ row: buildRow(spec, dr, values, { item, group: items }, pin) }));
        });
        if (cluster.groupFooter) {
          range(cluster.groupFooter.r1, cluster.groupFooter.r2).forEach((fr) =>
            flow.push({ row: buildRow(spec, fr, values, scope, pin) }));
        }
      });
      r = cluster.to;
      continue;
    }

    // 합계는 전체 배열을 스코프로 본다(마지막 쪽에만 나오도록 아래에서 뒤에 붙는다).
    const scope: Scope = inBand(r, summary) ? { group: allItems } : {};
    flow.push({ row: buildRow(spec, r, values, scope, pin) });
  }

  // ② 쪽 나누기 — 행 경계에서만 자른다(반쪽 행이 안 생긴다).
  const budget = rowsPerPage(spec.orientation);
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
    if (used + step.row.h > bodyBudget) {
      flush();
      const reprint = [
        ...(cluster?.columnHeader?.reprint !== false ? lastColumnHeader : []),
        ...(cluster?.groupHeader?.reprint !== false ? lastGroupHeader : []),
      ];
      reprint.forEach((row) => { cur.push(row); used += row.h; });
    }
    cur.push(step.row);
    used += step.row.h;
    if (step.keep === 'columnHeader') lastColumnHeader = [step.row];
    if (step.keep === 'groupHeader') lastGroupHeader = [step.row];
  }
  flush();
  if (!pages.length) pages.push([]);

  // ③ 2패스 — 총 쪽수가 나왔으니 @page/@pages를 실제 값으로 다시 짠다.
  const total = pages.length;
  const rebuild = (rows: OutRow[], n: number): OutRow[] =>
    rows.map((row) => ({
      h: row.h,
      cells: row.cells.map((c) =>
        c.spec.field === '@page' ? { ...c, text: String(n) }
        : c.spec.field === '@pages' ? { ...c, text: String(total) }
        : c),
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
  rowUnit: PAPER_ROW_UNIT,
  rowsPerPage: rowsPerPage(spec.orientation),
});
