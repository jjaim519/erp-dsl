// xlsx → PaperSpec 변환기 (저작 시점 도구).
//   node scripts/paper-import.mjs <파일.xlsx> [--out 경로.json] [--id 아이디] [--name 이름]
//
//  · **도메인을 이해하지 않는다.** `{{품목.품명}}`을 읽어 `field: "품목.품명"`으로 옮길 뿐,
//    「품목」이 뭔지 모른다. 이름을 정하는 건 엑셀을 편집한 사람이다(= 소비처).
//  · ExcelJS는 여기서만 쓴다 — 변환은 저작 시점이고 런타임은 PaperSpec만 본다(배포 의존성 0).
//  · 엑셀 서식은 **토큰으로 스냅**한다(9pt→body, 회색→shade). 그래서 엑셀에서 본 것과
//    100% 같지는 않다 — 임의 px·임의 색을 들이지 않기 위한 의도된 손실이다.
import ExcelJS from 'exceljs';
import { writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const SHEET_FORM = '양식';
const SHEET_FIELDS = '필드';
const BAND_COL = 26;              // Z열
const COLS_FALLBACK = 24;

// ── 한글 → 내부 토큰 (표에는 한글만 보인다 — buildHierarchyFromRows 선례) ──
const BAND_KO = {
  '머리말': 'pageHeader', '꼬리말': 'pageFooter', '열머리': 'columnHeader',
  '그룹머리': 'groupHeader', '반복': 'repeat', '그룹꼬리': 'groupFooter', '합계': 'summary',
};
const TYPE_KO = {
  '글자': 'text', '숫자': 'number', '금액': 'currency', '날짜': 'date',
  '여러 줄': 'textarea', '선택': 'select', '예아니오': 'checkbox',
};
const FORMAT_OF = {
  number: 'number', currency: 'currency', date: 'date', checkbox: 'boolean',
};
const AGG_KO = { '합계': 'sum', '개수': 'count', '평균': 'avg' };
const SYSTEM_KO = { '@쪽': '@page', '@총쪽': '@pages', '@오늘': '@today' };

const TAG = /\{\{\s*([^{}]+?)\s*\}\}/g;

// ── 서식 스냅 ─────────────────────────────────────────────────
// 엑셀의 임의 값을 우리 닫힌 어휘로 내린다. 여기가 "의도된 손실"이 일어나는 유일한 자리다.
function snapTypo(font = {}) {
  const size = font.size ?? 9;
  if (size >= 16) return 'display';
  if (size >= 13) return 'heading';
  if (size >= 11) return 'subheading';
  if (size <= 8) return 'caption';
  return font.bold ? 'body-strong' : 'body';
}
const isGrey = (argb) => {
  if (!argb || argb.length < 6) return false;
  const [r, g, b] = [argb.slice(-6, -4), argb.slice(-4, -2), argb.slice(-2)].map((h) => parseInt(h, 16));
  return Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && r > 200 && r < 250;   // 옅은 회색
};
function snapFill(fill) {
  if (!fill || fill.pattern !== 'solid') return undefined;
  const argb = fill.fgColor?.argb;
  if (!argb) return undefined;
  return isGrey(argb) ? 'shade' : 'brand';   // 회색 = 라벨 음영, 그 밖의 채움 = 브랜드
}
function snapInk(font = {}) {
  const argb = font.color?.argb;
  if (!argb) return undefined;
  if (isGrey(argb) || /9CA1AD$/i.test(argb)) return 'secondary';
  if (/^FF(B|C|D)[0-9A-F]{5}$/i.test(argb) && argb.slice(-4, -2) < '60') return 'danger';
  return undefined;
}
const ALIGN = { left: 'start', center: 'center', right: 'end' };
const VALIGN = { top: 'top', middle: 'middle', bottom: 'bottom' };

function snapBorder(border) {
  if (!border) return undefined;
  const on = ['top', 'right', 'bottom', 'left']
    .filter((k) => border[k]?.style)
    .map((k) => k[0]);            // t · r · b · l
  return on.length ? on : undefined;
}

// ── 셀 값 → 내용 ──────────────────────────────────────────────
// 태그가 없으면 고정 글자 / 하나면 데이터 자리 / 여럿이거나 글자와 섞이면 이어붙이기.
function readContent(raw, fieldKind) {
  const s = typeof raw === 'object' && raw !== null
    ? (raw.richText ? raw.richText.map((t) => t.text).join('') : raw.result ?? raw.text ?? '')
    : raw;
  const text = String(s ?? '').trim();
  if (!text) return {};

  const tags = [...text.matchAll(TAG)];
  if (tags.length === 0) return { text };

  const norm = (n) => SYSTEM_KO[n] ?? n;

  // 집계 — {{합계:품목.금액,품목.세액}}
  const first = tags[0][1].trim();
  const colon = first.indexOf(':');
  if (tags.length === 1 && colon > 0 && AGG_KO[first.slice(0, colon)]) {
    const of = first.slice(colon + 1).split(',').map((x) => x.trim()).filter(Boolean);
    return { agg: { fn: AGG_KO[first.slice(0, colon)], of: of.length === 1 ? of[0] : of } };
  }

  // 태그 하나 + 그 밖에 글자가 없으면 순수 데이터 자리
  const onlyTag = tags.length === 1 && text.replace(TAG, '').trim() === '';
  if (onlyTag) {
    const name = norm(first);
    return fieldKind.get(name) === 'image' ? { image: name } : { field: name };
  }

  // 그 외 — 이어붙이기(시스템 이름은 내부 토큰으로 치환해 둔다)
  return { template: text.replace(TAG, (_, n) => `{{${norm(n.trim())}}}`) };
}

// ── 필드 시트 ─────────────────────────────────────────────────
function readFields(ws) {
  const fields = [];
  const arrays = new Map();
  const images = [];
  const kind = new Map();          // 이름 → 'image' | FieldType
  if (!ws) return { fields, arrays, images, kind };

  ws.eachRow((row, r) => {
    if (r === 1) return;                                   // 헤더
    const cell = (c) => String(row.getCell(c).value ?? '').trim();
    const name = cell(1);
    if (!name || name.startsWith('──')) return;            // 구분선 행
    const label = cell(2) || name;
    const koType = cell(3);
    const required = cell(4) === '필수';
    const arrayName = cell(5);

    if (koType === '이미지') { images.push(name); kind.set(name, 'image'); return; }

    const type = TYPE_KO[koType] ?? 'text';
    kind.set(arrayName ? `${arrayName}.${name}` : name, type);
    const spec = { name, label, type, ...(required ? { required: true } : {}) };
    if (arrayName) {
      if (!arrays.has(arrayName)) arrays.set(arrayName, { name: arrayName, label: arrayName, of: [] });
      arrays.get(arrayName).of.push(spec);
    } else {
      fields.push(spec);
    }
  });
  return { fields, arrays, images, kind };
}

// ── 밴드 ──────────────────────────────────────────────────────
// Z열의 이름표를 읽어 연속 행을 한 구간으로 묶는다.
function readBands(ws, maxRow) {
  const raw = [];
  for (let r = 1; r <= maxRow; r++) {
    const v = String(ws.getCell(r, BAND_COL).value ?? '').trim();
    const kind = BAND_KO[v];
    if (kind) raw.push({ kind, r });
  }
  const bands = [];
  for (const { kind, r } of raw) {
    const last = bands[bands.length - 1];
    if (last && last.kind === kind && last.r2 === r - 1) last.r2 = r;
    else bands.push({ kind, r1: r, r2: r });
  }
  return bands;
}

// ── 본체 ──────────────────────────────────────────────────────
async function convert(file, opts) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet(SHEET_FORM);
  if (!ws) throw new Error(`「${SHEET_FORM}」 시트를 찾지 못했습니다.`);

  const { fields, arrays, images, kind } = readFields(wb.getWorksheet(SHEET_FIELDS));

  // 열 수 — 인쇄 영역에서 도출하고 사다리(12·24·48)로 스냅.
  const area = ws.pageSetup?.printArea ?? '';
  const m = area.match(/:([A-Z]+)(\d+)/);
  const detected = m ? ws.getColumn(m[1]).number : COLS_FALLBACK;
  const columns = [12, 24, 48].find((n) => n >= detected) ?? 48;
  const maxRow = m ? Number(m[2]) : 42;
  const orientation = ws.pageSetup?.orientation === 'landscape' ? 'landscape' : 'portrait';

  // 병합 — 마스터 칸만 남기고 나머지는 건너뛴다.
  const merges = new Map();       // "r:c" → {rs, cs}
  const covered = new Set();
  for (const range of Object.values(ws.model?.merges ?? {})) {
    const [a, b] = String(range).split(':');
    const s = ws.getCell(a), e = ws.getCell(b);
    merges.set(`${s.row}:${s.col}`, { rs: e.row - s.row + 1, cs: e.col - s.col + 1 });
    for (let r = s.row; r <= e.row; r++)
      for (let c = s.col; c <= e.col; c++) if (!(r === s.row && c === s.col)) covered.add(`${r}:${c}`);
  }

  const cells = [];
  const warn = [];
  for (let r = 1; r <= maxRow; r++) {
    for (let c = 1; c <= columns; c++) {
      if (covered.has(`${r}:${c}`)) continue;
      const cell = ws.getCell(r, c);
      const st = cell.style ?? {};
      const content = readContent(cell.value, kind);
      const border = snapBorder(st.border);
      const fill = snapFill(st.fill);
      const align = ALIGN[st.alignment?.horizontal];
      const valign = VALIGN[st.alignment?.vertical];
      const span = merges.get(`${r}:${c}`);
      const hasContent = Object.keys(content).length > 0;
      if (!hasContent && !border && !fill && !span) continue;    // 진짜 빈 칸은 안 적는다(sparse)

      const typo = hasContent ? snapTypo(st.font) : undefined;
      const ink = hasContent ? snapInk(st.font) : undefined;
      const fmt = content.field ? FORMAT_OF[kind.get(content.field)] : undefined;

      cells.push({
        r: r - 1, c: c - 1,
        ...(span?.rs > 1 ? { rs: span.rs } : {}),
        ...(span?.cs > 1 ? { cs: span.cs } : {}),
        ...content,
        ...(fmt ? { format: fmt } : {}),
        ...(border ? { border } : {}),
        ...(align && align !== 'start' ? { align } : {}),
        ...(valign && valign !== 'middle' ? { valign } : {}),
        ...(typo && typo !== 'body' ? { typo } : {}),
        ...(ink ? { ink } : {}),
        ...(fill ? { fill } : {}),
        ...(st.alignment?.textRotation === 'vertical' ? { writing: 'vertical' } : {}),
      });
    }
  }

  // 행 높이 — 18pt(=1단위)가 아닌 행만. 템플릿은 균일해서 보통 비어 있다.
  const rows = [];
  for (let r = 1; r <= maxRow; r++) {
    const h = Math.round((ws.getRow(r).height ?? 18) / 18);
    if (h > 1) rows.push({ r: r - 1, h });
  }

  // 밴드 — 반복 원본·그룹 기준은 그 행이 쓰는 필드 경로에서 도출한다.
  const pathsIn = (r1, r2) => cells
    .filter((x) => x.r >= r1 - 1 && x.r <= r2 - 1)
    .flatMap((x) => [
      ...(x.field ? [x.field] : []),
      ...(x.agg ? (Array.isArray(x.agg.of) ? x.agg.of : [x.agg.of]) : []),
    ])
    .filter((p) => p.includes('.'));

  const bands = readBands(ws, maxRow).map((b) => {
    const out = { kind: b.kind, r1: b.r1 - 1, r2: b.r2 - 1 };
    if (b.kind === 'repeat') {
      const arr = pathsIn(b.r1, b.r2)[0]?.split('.')[0];
      if (arr) out.source = arr;
      else warn.push(`${b.r1}행 「반복」에 배열 필드가 없습니다 — 원본을 못 정합니다`);
    }
    // 그룹 머리만 자기 행에서 기준을 도출한다(밴드 칸이 곧 그 기준값이라).
    if (b.kind === 'groupHeader') {
      const by = pathsIn(b.r1, b.r2)[0];
      if (by) out.by = by;
      else warn.push(`${b.r1}행 「그룹머리」에 묶음 기준 필드가 없습니다`);
    }
    return out;
  });
  // 그룹 꼬리(소계)는 **항상 그룹 머리와 같은 기준**이다. 자기 행에서 뽑으면 집계 대상(금액 등)을
  //  기준으로 오해한다 — 실제로 `투입.공수`가 잡혔었다. 그래서 도출하지 않고 무조건 물려받는다.
  bands.filter((b) => b.kind === 'groupFooter').forEach((b) => {
    const gh = bands.find((x) => x.kind === 'groupHeader' && x.by);
    if (gh) b.by = gh.by;
    else warn.push(`${b.r1 + 1}행 「그룹꼬리」에 짝이 되는 「그룹머리」가 없습니다`);
  });

  const id = opts.id ?? basename(file).replace(/\.xlsx$/i, '').replace(/^paper-(sample-)?/, '');
  const name = opts.name
    ?? cells.find((x) => x.typo === 'display' && x.text)?.text?.replace(/\s+/g, ' ').trim()
    ?? id;

  return {
    spec: {
      id, name, columns, orientation,
      fields,
      ...(arrays.size ? { arrays: [...arrays.values()] } : {}),
      ...(images.length ? { images } : {}),
      cells,
      ...(rows.length ? { rows } : {}),
      ...(bands.length ? { bands } : {}),
    },
    warn,
  };
}

// ── CLI ───────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith('--'));
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
if (!file) {
  console.error('사용법: node scripts/paper-import.mjs <파일.xlsx> [--out 경로.json] [--id 아이디] [--name 이름]');
  process.exit(2);
}

const { spec, warn } = await convert(resolve(file), { id: flag('id'), name: flag('name') });
const json = JSON.stringify(spec, null, 2);
const out = flag('out');
if (out) await writeFile(resolve(out), json + '\n', 'utf8');
else process.stdout.write(json + '\n');

const stat = `[paper-import] ${spec.name} · ${spec.columns}열 · 셀 ${spec.cells.length}`
  + ` · 밴드 ${(spec.bands ?? []).length} · 필드 ${spec.fields.length}`
  + ` · 배열 ${(spec.arrays ?? []).length} · 이미지 ${(spec.images ?? []).length}`;
console.error(stat);
warn.forEach((w) => console.error(`  ⚠ ${w}`));
if (out) console.error(`  → ${out}`);
