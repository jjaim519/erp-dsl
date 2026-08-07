#!/usr/bin/env node
// xlsx → PaperSpec 변환기 (저작 시점 도구).
//   npx erp-paper-import <파일.xlsx> [--out 경로.json] [--id 아이디] [--name 이름]
//
// ⚠ **소비처가 쓰는 도구다.** 서식을 저작하는 주체가 소비처라(패키지가 문서마다 지정해 줄 게 아니다)
//    `bin`으로 낸다. exceljs는 여기서만 필요하니 optional peer — 문서를 안 쓰는 앱은 안 깐다.
//    **출발점도 같이 준다** — `--template <이름>`이 실물 서식을 꺼낸다(빈 격자만 주면 시작을 못 한다).
//    그 실물은 «kk의 내역서»가 아니라 **어휘의 시연**이다: 레벨1이 공사 구획인지 공종인지는
//    도메인을 아는 쪽이 정한다.
//
//  · **도메인을 이해하지 않는다.** `{{품목.품명}}`을 읽어 `field: "품목.품명"`으로 옮길 뿐,
//    「품목」이 뭔지 모른다. 이름을 정하는 건 엑셀을 편집한 사람이다(= 소비처).
//  · ExcelJS는 여기서만 쓴다 — 변환은 저작 시점이고 런타임은 PaperSpec만 본다(배포 의존성 0).
//  · 엑셀 서식은 **토큰으로 스냅**한다(9pt→body, 회색→shade). 그래서 엑셀에서 본 것과
//    100% 같지는 않다 — 임의 px·임의 색을 들이지 않기 위한 의도된 손실이다.
import ExcelJS from 'exceljs';
import { copyFile, writeFile } from 'node:fs/promises';
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
const SPAN_KO = '묶음';           // {{묶음:부속.종류}} — 「경첩」처럼 반복 여러 줄에 세로로 걸치는 칸
const INDENT_KO = '들여';         // {{들여:품목.품명}} — 트리 배열에서 그 줄의 깊이만큼 밀리는 칸
const LEVEL_KO = '깊이';          // 「필드」 시트의 종류 — 이 열이 그 배열을 «트리»로 만든다
const NUMBER_KO = '번호';         // {{번호:품목.품명}} — 묶음을 여는 줄 앞에 「1. 」을 붙인다
const SYSTEM_KO = { '@쪽': '@page', '@총쪽': '@pages', '@오늘': '@today' };

const TAG = /\{\{\s*([^{}]+?)\s*\}\}/g;

// ── 서식 스냅 ─────────────────────────────────────────────────
// 엑셀의 임의 값을 우리 닫힌 어휘로 내린다. 여기가 "의도된 손실"이 일어나는 유일한 자리다.
//
// ⚠ **절대값을 기준으로 삼지 않는다.** 엑셀·넘버스가 저장하며 자기 기본값(행 높이·폰트 크기)으로
//    다시 쓰기 때문이다. 실제로 세 번 깨졌다 — 행 18pt→24pt, 폰트 9pt→11pt, 색은 테마 색이라 argb 없음.
//    그래서 «그 파일에서 가장 흔한 값»을 1로 놓고 **비율로** 스냅한다.
//    ⚠ 작은 쪽 경계는 **비율로 잡되 엑셀의 눈금이 굵다**는 걸 감안해야 한다. 잔글씨는 보통
//       본문보다 «1pt» 작을 뿐이라 본문이 9pt면 잔글씨는 8pt = 0.889다. 경계를 0.85로 두면
//       그게 통째로 본문이 된다(실제로 산출내역서의 라벨·산식 주석·꼬리말 14칸이 그랬다).
//       그래서 «본문보다 조금이라도 작으면 잔글씨»로 읽는다 — 큰 쪽 경계와 달리 단계가 하나뿐이라
//       넉넉히 잡아도 갈 곳이 없다.
function snapTypo(font = {}, base = 11) {
  const ratio = (font.size ?? base) / base;
  if (ratio >= 1.6) return 'display';
  if (ratio >= 1.3) return 'heading';
  if (ratio >= 1.15) return 'subheading';
  if (ratio <= 0.95) return 'caption';
  return font.bold ? 'body-strong' : 'body';
}

// 색 — 채우기는 **엑셀의 값을 그대로** 옮긴다. 치수(행 높이·글자 크기)를 비율로 스냅하는 것과
//  반대인데, 이유가 다르다: 치수는 앱이 저장하며 제 기본값으로 **다시 쓰지만** 색은 안 그런다.
//  그리고 한 문서가 음영을 두 단계로 쓰면(열머리 25% · 라벨 15%) «음영» 토큰 하나로는 그 구분이
//  통째로 사라진다 — 실제로 갑지가 그랬다. 색은 서식이 말하는 뜻이라 반올림하면 안 된다.
//
//  ⚠ 엑셀 테마 색은 argb가 없고 `{theme, tint}`로 온다. 둘 다 풀어야 헥스가 나온다.
const rgbOf = (argb) => (argb && argb.length >= 6
  ? [argb.slice(-6, -4), argb.slice(-4, -2), argb.slice(-2)].map((h) => parseInt(h, 16))
  : null);

// styles.xml의 `theme` 번호는 테마 파일의 **정의 순서와 다르다** — 앞의 두 쌍이 뒤집혀 있다
//  (0=lt1, 1=dk1, 2=lt2, 3=dk2, 그 뒤로 accent1..6 · hlink · folHlink).
const THEME_ORDER = ['lt1', 'dk1', 'lt2', 'dk2',
  'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];

function themePalette(wb) {
  const xml = String(wb._themes?.theme1 ?? '');
  const by = new Map();
  for (const [, tag, hex] of xml.matchAll(
    /<a:(\w+)>\s*<a:(?:srgbClr val|sysClr [^>]*lastClr)="([0-9A-Fa-f]{6})"/g,
  )) by.set(tag, hex.toUpperCase());
  return THEME_ORDER.map((k) => by.get(k)).filter(Boolean).length ? by : null;
}

// tint는 RGB가 아니라 **광도(HLS의 L)**에 걸린다 — 회색은 두 방식이 같지만 채도가 있는 색은
//  RGB로 곱하면 색조까지 흐려져 엑셀 화면과 어긋난다. 그래서 문서대로 L만 건드린다.
function applyTint([r, g, b], tint) {
  if (!tint) return [r, g, b];
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  let L = (max + min) / 2;
  const d = max - min;
  const S = d === 0 ? 0 : d / (L > 0.5 ? 2 - max - min : max + min);
  let H = 0;
  if (d !== 0) {
    if (max === R) H = ((G - B) / d + (G < B ? 6 : 0)) / 6;
    else if (max === G) H = ((B - R) / d + 2) / 6;
    else H = ((R - G) / d + 4) / 6;
  }
  L = tint < 0 ? L * (1 + tint) : L * (1 - tint) + tint;
  if (S === 0) return [L, L, L].map((v) => Math.round(v * 255));
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  const hue = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(H + 1 / 3), hue(H), hue(H - 1 / 3)].map((v) => Math.round(v * 255));
}

const hexOf = ([r, g, b]) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** 엑셀 색(argb · theme+tint) → `#RRGGBB`. 못 풀면 undefined. */
function colorOf(color, theme) {
  if (!color) return undefined;
  const direct = rgbOf(color.argb);
  if (direct) return hexOf(direct);
  if (color.theme != null && theme) {
    const base = rgbOf(theme.get(THEME_ORDER[color.theme]));
    if (base) return hexOf(applyTint(base, color.tint ?? 0));
  }
  return undefined;
}

function readFill(fill, theme) {
  if (!fill || fill.pattern !== 'solid') return undefined;
  const hex = colorOf(fill.fgColor, theme);
  return hex ?? 'shade';        // 못 푼 색(indexed 등) — 채워진 건 확실하니 음영으로 둔다
}
function snapInk(font = {}, base = 11) {
  const rgb = rgbOf(font.color?.argb);
  if (!rgb) return undefined;
  const [r, g, b] = rgb;
  if (r > 120 && Math.max(r, g, b) - Math.min(r, g, b) < 24) return 'secondary';   // 흐린 회색 글자
  if (r - Math.max(g, b) > 60) return 'danger';                                    // 붉은 글자
  void base;
  return undefined;
}
const ALIGN = { left: 'start', center: 'center', right: 'end' };
const VALIGN = { top: 'top', middle: 'middle', bottom: 'bottom' };

// 선 굵기 — 엑셀은 thin/medium/thick/double… 여러 단이지만 우리는 **두 단으로 닫는다**.
//  hair·thin·dotted·dashed → 얇음 / 그 밖(medium·thick·double) → 굵음.
const THIN_STYLES = new Set(['hair', 'thin', 'dotted', 'dashed', 'dashDot', 'dashDotDot']);

// ⚠ **병합 칸의 테두리는 마스터 칸에 다 있지 않다.** 엑셀은 범위에 「상자 테두리」를 걸면
//    각 변을 그 변에 닿는 칸에 나눠 적는다 — 위·왼쪽은 마스터가 갖지만 **오른쪽·아래는
//    범위의 오른쪽·아래 «슬레이브» 칸**이 갖는다. 마스터만 읽으면 그 두 변을 통째로 잃는다
//    (실제로 그랬다 — 굵은 외곽이 위·왼쪽만 나오고 오른쪽·아래가 하나도 안 나왔다).
//    그래서 각 변을 그 변의 «테두리 줄» 전체에서 모으고, 한 줄 안에서는 **굵은 쪽이 이긴다**
//    (PaperDoc의 선 지도와 같은 규칙 — 경계선은 굵어야 맞다).
function readBorder(ws, r, c, rs, cs) {
  const pick = (coords, side) => {
    let found;
    for (const [rr, cc] of coords) {
      const st = ws.getCell(rr, cc).style?.border?.[side]?.style;
      if (!st) continue;
      if (!THIN_STYLES.has(st)) return 'strong';
      found = 'thin';
    }
    return found;
  };
  const rows = Array.from({ length: rs }, (_, i) => r + i);
  const cols = Array.from({ length: cs }, (_, i) => c + i);
  const sides = {
    t: pick(cols.map((cc) => [r, cc]), 'top'),
    r: pick(rows.map((rr) => [rr, c + cs - 1]), 'right'),
    b: pick(cols.map((cc) => [r + rs - 1, cc]), 'bottom'),
    l: pick(rows.map((rr) => [rr, c]), 'left'),
  };
  const thin = [], strong = [];
  for (const [edge, weight] of Object.entries(sides)) {
    if (weight === 'strong') strong.push(edge);
    else if (weight === 'thin') thin.push(edge);
  }
  return {
    border: thin.length ? thin : undefined,
    borderStrong: strong.length ? strong : undefined,
  };
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

  const first = tags[0][1].trim();
  const colon = first.indexOf(':');

  // 묶음 걸침 — {{묶음:부속.종류}}. 반복 한 줄에 적지만 그려질 땐 그 묶음의 줄 수만큼 세로로 걸친다.
  //  「경첩」이 15T 댐퍼·무댐퍼·18T 댐퍼·무댐퍼 네 줄 옆에 걸치는 칸이 이것이다.
  //  엑셀에서 세로 병합으로 그리면 줄 수가 저작 시점에 박히지만, 이건 값이 와야 정해진다.
  if (tags.length === 1 && colon > 0 && first.slice(0, colon) === SPAN_KO) {
    return { field: first.slice(colon + 1).trim(), scope: 'group' };
  }

  // 들여쓰기 — {{들여:품목.품명}}. 그 줄의 깊이만큼 «글자만» 밀린다(격자는 안 움직인다).
  //  묶음(scope:'group')과 같은 자리에 두는 이유: 둘 다 «이 칸이 반복 줄에서 어떻게 처신하는가»다.
  if (tags.length === 1 && colon > 0 && first.slice(0, colon) === INDENT_KO) {
    return { field: first.slice(colon + 1).trim(), indent: true };
  }

  // 번호 — {{번호:품목.품명}}. 구획 제목의 「1. 주방」. 묶음을 여는 줄에만 붙는다.
  if (tags.length === 1 && colon > 0 && first.slice(0, colon) === NUMBER_KO) {
    return { field: first.slice(colon + 1).trim(), number: true };
  }

  // 집계 — {{합계:품목.금액,품목.세액}}
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

    // 「깊이」는 값의 종류가 아니라 **줄의 성질**이다 — 숫자로 받되 그 배열을 트리로 만든다.
    //  (종이에 찍히는 칸이 아니라 들여쓰기·묶음 경계가 읽어 가는 축이다.)
    const isLevel = koType === LEVEL_KO;
    const type = isLevel ? 'number' : (TYPE_KO[koType] ?? 'text');
    kind.set(arrayName ? `${arrayName}.${name}` : name, type);
    const spec = { name, label, type, ...(required ? { required: true } : {}) };
    if (arrayName) {
      if (!arrays.has(arrayName)) arrays.set(arrayName, { name: arrayName, label: arrayName, of: [] });
      arrays.get(arrayName).of.push(spec);
      if (isLevel) arrays.get(arrayName).level = name;
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

  // **계층 등록표는 문서가 아니다.** 세 시트 이름은 같지만(양식·필드·안내) 「양식」이 «그릴 레이아웃»이
  //  아니라 «채울 표»다 — 태그도 Z열 역할도 없다. 그대로 변환하면 터지지 않고 **쓰레기가 나온다**
  //  (쪽당 1행 → 441pt 글자). 조용히 이상한 걸 뱉느니 여기서 막는다. 마커를 따로 두지 않는 이유는
  //  사용자가 새로 배울 문법을 늘리지 않기 위해서다 — 있는 것만으로 충분히 갈린다.
  {
    let tag = false, band = false;
    ws.eachRow((row) => {
      row.eachCell((cell, c) => {
        if (c === BAND_COL && String(cell.value ?? '').trim() in BAND_KO) band = true;
        else if (c < BAND_COL && TAG.test(String(cell.value ?? ''))) tag = true;
        TAG.lastIndex = 0;
      });
    });
    if (!tag && !band) {
      throw new Error(
        '이 파일은 문서 서식이 아닙니다 — 「양식」에 값 자리({{…}})도 Z열 역할도 없습니다.\n'
        + '  계층 등록표라면 변환하지 않습니다: 소비 앱이 업로드받아 buildHierarchyFromRows로 읽습니다.\n'
        + '  문서를 만들려면  npx erp-paper-import --template  으로 빈 서식부터 꺼내세요.',
      );
    }
  }

  const { fields, arrays, images, kind } = readFields(wb.getWorksheet(SHEET_FIELDS));
  const theme = themePalette(wb);   // 테마 색을 헥스로 풀 때 쓴다(없으면 argb만 읽힌다)

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

  // 기준 폰트 크기 검출 — 이 파일에서 가장 흔한 크기가 곧 «본문»이다(위 snapTypo 주석).
  //  ⚠ **병합 슬레이브를 세면 안 된다.** ExcelJS는 슬레이브에서 마스터의 값·폰트를 그대로 돌려주므로,
  //   18pt 제목을 18칸×2행으로 병합하면 그 한 칸이 **36표**가 되어 다수결을 이긴다. 그러면 base가
  //   제목 크기로 잡혀 **모든 글자가 한 단계씩 밀린다**(제목→body-strong, 본문→caption).
  //   내용이 많은 손그림 서식에선 안 드러나고 **빈 템플릿처럼 글자가 적을수록 확실히 깨진다.**
  const sizeFreq = new Map();
  for (let r = 1; r <= maxRow; r++)
    for (let c = 1; c <= columns; c++) {
      if (covered.has(`${r}:${c}`)) continue;
      const cell = ws.getCell(r, c);
      if (cell.value == null || String(cell.value).trim() === '') continue;
      const s = cell.style?.font?.size ?? 11;
      sizeFreq.set(s, (sizeFreq.get(s) ?? 0) + 1);
    }
  const baseSize = [...sizeFreq.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 11;

  for (let r = 1; r <= maxRow; r++) {
    for (let c = 1; c <= columns; c++) {
      if (covered.has(`${r}:${c}`)) continue;
      const cell = ws.getCell(r, c);
      const st = cell.style ?? {};
      const content = readContent(cell.value, kind);
      const span = merges.get(`${r}:${c}`);
      const { border, borderStrong } = readBorder(ws, r, c, span?.rs ?? 1, span?.cs ?? 1);
      const fill = readFill(st.fill, theme);
      const align = ALIGN[st.alignment?.horizontal];
      const valign = VALIGN[st.alignment?.vertical];
      const hasContent = Object.keys(content).length > 0;
      if (!hasContent && !border && !borderStrong && !fill && !span) continue;   // 진짜 빈 칸은 안 적는다(sparse)

      const typo = hasContent ? snapTypo(st.font, baseSize) : undefined;
      const ink = hasContent ? snapInk(st.font, baseSize) : undefined;
      // 집계 칸은 **더한 열의 서식**을 물려받는다. 안 물려받으면 같은 금액 열에서
      //  항목은 «₩1,200,000»인데 소계만 «1200000»으로 찍힌다(합계 줄이 딴 나라 숫자가 된다).
      //  개수(count)는 예외 — 세는 결과는 돈이 아니라 수다.
      const aggOf = content.agg && content.agg.fn !== 'count'
        ? (Array.isArray(content.agg.of) ? content.agg.of[0] : content.agg.of) : undefined;
      const fmt = content.field
        ? FORMAT_OF[kind.get(content.field)]
        : (aggOf ? FORMAT_OF[kind.get(aggOf)] : undefined);

      cells.push({
        r: r - 1, c: c - 1,
        ...(span?.rs > 1 ? { rs: span.rs } : {}),
        ...(span?.cs > 1 ? { cs: span.cs } : {}),
        ...content,
        ...(fmt ? { format: fmt } : {}),
        ...(border ? { border } : {}),
        ...(borderStrong ? { borderStrong } : {}),
        ...(align && align !== 'start' ? { align } : {}),
        ...(valign && valign !== 'middle' ? { valign } : {}),
        ...(typo && typo !== 'body' ? { typo } : {}),
        ...(ink ? { ink } : {}),
        ...(fill ? { fill } : {}),
        ...(st.alignment?.textRotation === 'vertical' ? { writing: 'vertical' } : {}),
      });
    }
  }

  // 행 높이 — **기준 높이를 파일에서 검출한다**(18pt로 못 박지 않는다).
  //  엑셀/넘버스가 저장하면서 행 높이를 자기 기본값으로 다시 쓰는 일이 있다(18 → 24로 바뀌어 왔다).
  //  절대값을 믿으면 문서 전체가 «2단위»로 읽혀 쪽이 반으로 준다. 그래서 *가장 흔한 높이*를 1단위로 보고
  //  그 배수만 여러 단위로 친다 — 저작자가 실제로 키운 행만 잡히고 앱이 만든 드리프트는 무시된다.
  const heights = [];
  for (let r = 1; r <= maxRow; r++) heights.push(Math.round(ws.getRow(r).height ?? 18));
  const freq = new Map();
  heights.forEach((h) => freq.set(h, (freq.get(h) ?? 0) + 1));
  const base = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] || 18;

  const rows = [];
  heights.forEach((h, i) => {
    const units = Math.max(1, Math.round(h / base));
    if (units > 1) rows.push({ r: i, h: units });
  });
  const totalUnits = heights.reduce((s, h) => s + Math.max(1, Math.round(h / base)), 0);
  if (totalUnits > maxRow) warn.push(`행 단위 합계 ${totalUnits} > ${maxRow} — 쪽이 넘칩니다(키운 행을 줄이세요)`);
  if (base !== 18) warn.push(`기준 행 높이가 ${base}pt로 검출됐습니다(템플릿 기본은 18pt). 앱이 저장하며 바꾼 값일 수 있습니다`);

  // 밴드 — 반복 원본·그룹 기준은 그 행이 쓰는 필드 경로에서 도출한다.
  const pathsIn = (r1, r2) => cells
    .filter((x) => x.r >= r1 - 1 && x.r <= r2 - 1)
    .flatMap((x) => [
      ...(x.field ? [x.field] : []),
      ...(x.agg ? (Array.isArray(x.agg.of) ? x.agg.of : [x.agg.of]) : []),
    ])
    .filter((p) => p.includes('.'));

  // 이 서식의 반복 원본이 트리인가 — 「반복」 줄이 쓰는 배열에 깊이 열이 있으면 그렇다.
  //  (밴드를 훑기 전에 정해 둔다 — 그룹 머리·꼬리가 이 답에 따라 다른 기준을 받는다.)
  const repeatRows = readBands(ws, maxRow).filter((b) => b.kind === 'repeat');
  const treeRepeat = repeatRows.some((b) => {
    const arr = pathsIn(b.r1, b.r2)[0]?.split('.')[0];
    return !!arr && !!arrays.get(arr)?.level;
  });

  const bands = readBands(ws, maxRow).map((b) => {
    const out = { kind: b.kind, r1: b.r1 - 1, r2: b.r2 - 1 };
    if (b.kind === 'repeat') {
      const arr = pathsIn(b.r1, b.r2)[0]?.split('.')[0];
      if (arr) out.source = arr;
      else warn.push(`${b.r1}행 「반복」에 배열 필드가 없습니다 — 원본을 못 정합니다`);
    }
    // 그룹 머리만 자기 행에서 기준을 도출한다(밴드 칸이 곧 그 기준값이라).
    //  단 **트리면 기준은 깊이다** — 「1. 주방」 칸의 필드는 품명이고, 그걸 `by`로 잡으면
    //  품명이 같은 줄끼리 묶여 「상부장」이 온 문서에서 한 덩어리가 된다(구획이 무너진다).
    if (b.kind === 'groupHeader') {
      if (treeRepeat) { out.atLevel = 1; return out; }
      const by = pathsIn(b.r1, b.r2)[0];
      if (by) out.by = by;
      else warn.push(`${b.r1}행 「그룹머리」에 묶음 기준 필드가 없습니다`);
    }
    return out;
  });
  // 그룹 꼬리(소계)는 **항상 그룹 머리와 같은 기준**이다. 자기 행에서 뽑으면 집계 대상(금액 등)을
  //  기준으로 오해한다 — 실제로 `투입.공수`가 잡혔었다. 그래서 도출하지 않고 무조건 물려받는다.
  bands.filter((b) => b.kind === 'groupFooter').forEach((b) => {
    const gh = bands.find((x) => x.kind === 'groupHeader' && (x.by || x.atLevel != null));
    if (gh) { if (gh.by) b.by = gh.by; else b.atLevel = gh.atLevel; return; }
    // 트리 반복이면 묶음 기준이 **구조**다 — 「그룹머리」 없이도 소계가 성립한다(깊이 1이 다시 나오면 끝).
    //  그래서 깊이 1을 기본으로 준다. 저작자는 Z열에 「그룹꼬리」만 적으면 되고, 깊이를 적을 칸이 없다
    //  (깊이별 소계는 아직 안 연다 — 반복 하나에 그룹꼬리 하나가 지금 엔진의 전제다).
    const tree = bands.some((x) => x.kind === 'repeat' && arrays.get(x.source)?.level);
    if (tree) b.atLevel = 1;
    else warn.push(`${b.r1 + 1}행 「그룹꼬리」에 짝이 되는 「그룹머리」가 없습니다`);
  });

  // 「반복」의 원본은 「필드」 시트에 **배열로 선언**돼 있어야 한다. 안 해도 그리기는 되기 때문에
  //  조용히 지나가는데, 편집 모드는 「필드」가 아는 이름만 입력으로 바꾸므로 반복 안이 통째로 죽는다.
  bands.filter((b) => b.kind === 'repeat' && b.source).forEach((b) => {
    if (!arrays.has(b.source)) {
      warn.push(`「반복」 원본 «${b.source}»가 「필드」 시트에 배열로 없습니다 — 그 시트 「배열」 열에 «${b.source}»를 적으세요(그리기는 되지만 편집 모드에서 입력이 안 됩니다)`);
    }
  });

  // 점 경로가 **그 목록에 없는 칸**을 가리키면 그 열이 통째로 빈다 — 값이 없는 게 아니라
  //  이름이 어긋난 것이라 데이터를 아무리 넣어도 안 나온다(「양식」은 «수량»인데 「필드」는 «개수»였다).
  //  조용히 빈 열이라 인쇄해 보고서야 안다.
  cells.filter((c) => c.field?.includes('.')).forEach((c) => {
    const [an, fn] = [c.field.slice(0, c.field.indexOf('.')), c.field.slice(c.field.indexOf('.') + 1)];
    const arr = arrays.get(an);
    if (arr && !arr.of.some((f) => f.name === fn)) {
      warn.push(`${c.r + 1}행의 «{{${c.field}}}»에서 «${fn}»이(가) 목록 「${an}」에 없습니다(있는 것: ${arr.of.map((f) => f.name).join('·')}) — 그 열이 통째로 빕니다`);
    }
  });

  // 칸이 «배열 이름»을 점 없이 가리키면 목록이 통째로 그 칸에 찍힌다(`[object Object]`).
  //  이름 충돌을 고칠 때 「필드」 시트만 고치고 「양식」의 태그를 안 바꾸면 딱 이 상태가 된다 —
  //  아래 «겹침» 검사는 이미 안 겹치므로 조용히 지나간다.
  cells.filter((c) => c.field && !c.field.includes('.') && arrays.has(c.field)).forEach((c) => {
    warn.push(`${c.r + 1}행의 «{{${c.field}}}»는 배열 이름입니다 — 그 칸에 목록이 통째로 찍힙니다([object Object]). 태그를 다른 이름으로 바꾸세요`);
  });

  // 배열 이름과 문서 필드 이름이 겹치면 **값 그릇이 하나뿐**이라 둘이 한자리를 다툰다
  //  (배열을 넘기면 문서 칸에 `[object Object]`가 찍힌다 — 갑지의 「부속」이 그랬다).
  arrays.forEach((_, an) => {
    if (fields.some((f) => f.name === an)) {
      warn.push(`«${an}»가 배열 이름이면서 문서 필드입니다 — 값 하나를 둘이 다투므로 한쪽을 개명하세요`);
    }
  });

  // 쪽당 행 수 — **꼬리말 행이 곧 지면 바닥**이다(정의상). 없으면 마지막 내용 행, 그것도 없으면 42.
  //  이 하나가 행 높이와 글자 크기를 함께 정한다(schema/paper.ts `rowUnitOf`).
  //  글자를 키우려면 서식에서 이 수를 줄인다 — 꼬리말을 위로 올리면 된다.
  const footers = bands.filter((b) => b.kind === 'pageFooter');
  if (footers.length > 1) {
    warn.push(`꼬리말이 ${footers.length}군데입니다(${footers.map((b) => b.r1 + 1).join('·')}행) — 첫 번째만 씁니다. 나머지는 본문으로 흘러 밑이 잘립니다`);
  }
  const footerBand = footers[0];
  const lastContent = cells.reduce((m, c) => Math.max(m, c.r + (c.rs ?? 1)), 0);
  const pageRows = opts.pageRows
    ?? (footerBand ? footerBand.r2 + 1 : Math.max(lastContent, 1));
  const bodyPx = Math.floor((1123 - 114) / pageRows) * 0.583;
  warn.push(`쪽당 ${pageRows}행 → 행 ${Math.floor((1123 - 114) / pageRows)}px · 본문 ${bodyPx.toFixed(1)}px (인쇄 ${(bodyPx * 0.75).toFixed(1)}pt)`);

  // 회사 문서가 한 벌로 읽히려면 셋은 어느 서식에나 있어야 한다 — **좌상단 로고 · 가운데 문서명 · 꼬리말.**
  //  경고로만 둔다(실패 아님): 진짜 이 셋이 없어야 맞는 문서가 있을 수 있고, 그 판단은 저작자 몫이다.
  //  문서명은 기계가 못 가린다(고정 글자 중 어느 것이 제목인지 모른다) — 로고·꼬리말만 본다.
  if (!cells.some((c) => c.image)) {
    warn.push('좌상단 **로고 자리**가 없습니다 — 모든 문서가 공유하는 셋(로고·문서명·꼬리말) 중 하나입니다');
  }
  if (!bands.some((b) => b.kind === 'pageFooter')) {
    warn.push('**꼬리말**이 없습니다 — 매 쪽 발행처·쪽번호가 빠지고, 지면 바닥을 못 읽어 쪽 높이가 내용 높이로 잡힙니다');
  }

  const id = opts.id ?? basename(file).replace(/\.xlsx$/i, '').replace(/^paper-(sample-)?/, '');
  const name = opts.name
    ?? cells.find((x) => x.typo === 'display' && x.text)?.text?.replace(/\s+/g, ' ').trim()
    ?? id;

  return {
    spec: {
      id, name, columns, orientation,
      ...(pageRows !== 42 ? { pageRows } : {}),
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

// 서식 꺼내기 — 저작은 여기서 시작한다(24열 격자·표준 머리·「필드」·「안내」 시트가 들어 있다).
//
// **빈 서식만 주면 소비처는 시작을 못 한다.** 이 시스템은 «소비처가 표를 못 만든다»에서 출발했는데,
//  빈 격자 하나를 건네면 그 자리로 되돌아간다. 그래서 **실물 서식을 함께 낸다** — 고쳐 쓰는 게
//  처음부터 그리는 것보다 압도적으로 쉽고, 밴드·태그 어휘를 «작동하는 예»로 배운다.
//  (package.json의 `files`에 이 셋이 다 올라 있어야 한다 — 안 그러면 설치본에 없다.)
const TEMPLATES = {
  '빈서식': ['빈서식.xlsx', '표준 머리·꼬리만 있는 24×42 격자'],
  '내역서': ['내역서.xlsx', '구획 제목 + 깊이 트리 + 구획별 소계'],
  //  계층 등록표는 **문서가 아니다**(아래 «문서가 아닙니다» 참조). 같은 세 시트를 쓰고
  //  같은 명령으로 꺼내지만, 변환 대상은 아니고 소비 앱이 런타임에 읽는다.
  '계층': ['계층.xlsx', '계층 초기 등록표 — 사용자가 채워 올리는 표(문서 아님)'],
};

if (argv.includes('--template')) {
  const arg = flag('template');
  const named = arg && !arg.startsWith('--') && !arg.endsWith('.xlsx');   // 이름이냐 경로냐
  const key = named ? arg : '빈서식';
  if (!TEMPLATES[key]) {
    console.error(`[paper-import] «${key}»라는 서식이 없습니다. 쓸 수 있는 이름:`);
    for (const [k, [, desc]] of Object.entries(TEMPLATES)) console.error(`  ${k.padEnd(8)} ${desc}`);
    process.exit(2);
  }
  const [srcName] = TEMPLATES[key];
  const dest = resolve(flag('out') ?? (named ? `${key}.xlsx` : (arg && !arg.startsWith('--') ? arg : srcName)));
  await copyFile(new URL(`../public/${srcName}`, import.meta.url), dest);
  console.error(`[paper-import] ${key} 서식을 꺼냈습니다 → ${dest}`);
  process.exit(0);
}

if (!file) {
  console.error('사용법: erp-paper-import <파일.xlsx> [--out 경로.json] [--id 아이디] [--name 이름] [--rows 쪽당행수]');
  console.error(`        erp-paper-import --template [이름|경로.xlsx] [--out 경로.xlsx]`);
  console.error(`        이름: ${Object.keys(TEMPLATES).join(' · ')}   (없으면 빈 서식)`);
  process.exit(2);
}

const { spec, warn } = await convert(resolve(file), {
  id: flag('id'), name: flag('name'),
  pageRows: flag('rows') ? Number(flag('rows')) : undefined,
});
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
