// 24×42 문서 서식 템플릿(.xlsx) 생성 — 저작 도구는 엑셀이고, 이 파일이 그 출발점이다.
//  · 표준 머리·꼬리가 박힌 시작 템플릿 + 실물 예제 둘(라인 문서 · 서술 문서)을 public/ 에 떨군다.
//  · ExcelJS는 **dev 의존성**이다. 변환은 저작 시점에 하고 런타임은 PaperSpec만 본다
//    (SheetJS를 dev 도구에만 두는 기존 규율 그대로 — 배포 DSL 의존성 0).
//
// 한 쪽 = 24열 × 42행. 행 24px = 18pt(정확히 떨어진다). A4 세로 여백 15mm 기준.
import ExcelJS from 'exceljs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public');

const COLS = 24;
const ROWS = 42;
const ROW_PT = 18;        // 24px @96dpi (18 × 96/72 = 24). 42행 × 24 = 1008px ≈ 가용 높이 1009px
const BAND_COL = 26;      // Z열 — 인쇄 영역 밖. 여기에 밴드 이름을 적는다

// 열 너비 — 엑셀의 "너비"는 px가 아니라 *기본 글꼴의 최대 숫자 폭(MDW)* 단위라 역산해야 한다.
//   pixels = Trunc(((256×width + Trunc(128/MDW)) / 256) × MDW)      [OOXML]
// A4 세로 794px − 여백 15mm×2(114px) = 가용 680px → 680/24 = 28.33 → 정수 28px.
// (첫 판의 3.35는 23px/열 = 552px밖에 안 돼 폭의 3분의 2만 찼다.)
const MDW = 7;            // Calibri 11 @96dpi
const TARGET_COL_PX = Math.floor((794 - 114) / COLS);   // 28
const COL_W = Math.round((((TARGET_COL_PX / MDW) * 256 - Math.trunc(128 / MDW)) / 256) * 100) / 100;
const colPx = (w) => Math.trunc(((256 * w + Math.trunc(128 / MDW)) / 256) * MDW);

const GREY = 'FFE4E4E4';
const HINT = 'FF9CA1AD';
const THIN = { style: 'thin', color: { argb: 'FF6E7480' } };
const ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const BANDS = ['머리말', '꼬리말', '열머리', '그룹머리', '반복', '그룹꼬리', '합계'];

// ── 골격 ───────────────────────────────────────────────────────
function setupSheet(ws) {
  ws.properties.defaultRowHeight = ROW_PT;
  for (let c = 1; c <= COLS; c++) ws.getColumn(c).width = COL_W;
  ws.getColumn(BAND_COL).width = 14;
  for (let r = 1; r <= ROWS; r++) ws.getRow(r).height = ROW_PT;

  // A4 · 여백 15mm(0.59in) · 배율 100% 고정(축소·확대 없이 1:1로 나가야 격자가 곧 쪽이다)
  //  ⚠ 가로 가운데 맞춤을 켠다. 격자 폭(24×28px = 177.8mm)이 인쇄 가능 폭(180mm)보다
  //    2.2mm 좁아서, 안 켜면 그 여유가 전부 오른쪽으로 몰려 왼쪽으로 치우쳐 보인다.
  //    여백을 16.1mm로 바꿔도 되지만 그건 열 폭이 정확히 28px로 렌더될 때만 맞는 계산이라
  //    (기본 글꼴이 다르면 27~29px로 갈린다) 엑셀이 실측해 가운데로 미는 쪽이 안전하다.
  ws.pageSetup = {
    paperSize: 9, orientation: 'portrait',
    margins: { left: 0.59, right: 0.59, top: 0.59, bottom: 0.59, header: 0, footer: 0 },
    fitToPage: false, scale: 100,
    horizontalCentered: true, verticalCentered: false,
  };
  ws.pageSetup.printArea = `A1:${ws.getColumn(COLS).letter}${ROWS}`;

  const head = ws.getCell(1, BAND_COL);
  head.value = '▼ 이 행의 역할';
  head.font = { size: 9, bold: true, color: { argb: HINT } };
  for (let r = 2; r <= ROWS; r++) {
    ws.getCell(r, BAND_COL).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`"${BANDS.join(',')}"`],
    };
  }
  return ws;
}

function put(ws, r, c, value, opt = {}) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  cell.font = {
    name: '맑은 고딕', size: opt.size ?? 9, bold: !!opt.bold,
    color: { argb: opt.hint ? HINT : 'FF16181C' },
  };
  cell.alignment = {
    horizontal: opt.align ?? 'left',
    vertical: opt.valign ?? 'middle',
    wrapText: !!opt.wrap,
    textRotation: opt.vertical ? 'vertical' : undefined,
    indent: opt.indent ?? 0,
  };
  if (opt.border !== false) cell.border = ALL;
  if (opt.shade) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
  if ((opt.cs ?? 1) > 1 || (opt.rs ?? 1) > 1) {
    ws.mergeCells(r, c, r + (opt.rs ?? 1) - 1, c + (opt.cs ?? 1) - 1);
  }
  return cell;
}

const band = (ws, r, name) => {
  const c = ws.getCell(r, BAND_COL);
  c.value = name;
  c.font = { size: 9, color: { argb: HINT } };
};

// ── 표준 머리 ──────────────────────────────────────────────────
// ⚠ 행 높이를 절대 바꾸지 않는다. 높은 칸은 **세로 병합**으로 만든다.
//   (행마다 높이를 키우면 42행이 42단위가 아니게 되어 «42행 = 한 쪽» 불변이 깨진다.
//    첫 판이 그래서 세로로 넘쳤다: 756pt + 제목 18 + 비고 36 = 810pt > 가용 756pt.)
//
// 기본은 **2단위(5%)** — 로고를 제목 행에 넣는다.
//   한국 장표는 제목이 가운데 크게라, 로고만 왼쪽에 두면 좌우가 비대칭이 된다.
//   그래서 오른쪽을 문서번호·작성일자로 채워 균형을 잡는다(장표 관습).
// 레터헤드(발행처명·사업자번호·주소·전화)를 켜면 +2단위 → 4단위(≈10%). 기본은 끔.
function standardHead(ws, title, opts = {}) {
  let r = 1;

  if (opts.letterhead) {
    put(ws, r, 1, '{{발행처로고}}', { cs: 3, rs: 2, align: 'center', hint: true, border: false });
    put(ws, r, 4, '{{발행처명}}', { cs: 12, bold: true, size: 12, border: false });
    put(ws, r + 1, 4, '{{발행처사업자번호}}　{{발행처주소}}　{{발행처전화}}',
      { cs: 12, size: 8, border: false });
    if (opts.approval) {
      ['담당', '검토', '승인'].forEach((label, i) => {
        const c = 16 + i * 3;
        put(ws, r, c, label, { cs: 3, align: 'center', shade: true, size: 8 });
        put(ws, r + 1, c, `{{${['담당자', '검토자', '승인자'][i]}}}`,
          { cs: 3, align: 'center', hint: true, size: 8 });
      });
    }
    r += 2;
  }

  // 제목 밴드 — [로고 3] [제목 14, 세로 병합 2] [문서번호·작성일자 7]
  if (!opts.letterhead) {
    put(ws, r, 1, '{{발행처로고}}', { cs: 3, rs: 2, align: 'center', hint: true, border: false });
  }
  put(ws, r, 4, title, { cs: 14, rs: 2, align: 'center', bold: true, size: 18, border: false });
  put(ws, r,     18, '문서번호', { cs: 3, align: 'center', shade: true, size: 8 });
  put(ws, r,     21, '{{문서번호}}', { cs: 4, size: 8 });
  put(ws, r + 1, 18, '작성일자', { cs: 3, align: 'center', shade: true, size: 8 });
  put(ws, r + 1, 21, '{{작성일자}}', { cs: 4, size: 8 });

  return r + 2;   // 본문이 시작되는 행
}

// ── 표준 꼬리 (r42) ────────────────────────────────────────────
function standardFoot(ws) {
  put(ws, 42, 1,  '{{발행처명}}　{{발행처주소}}　{{발행처전화}}',
    { cs: 18, size: 8, hint: true, border: false });
  put(ws, 42, 19, '{{@쪽}} / {{@총쪽}}', { cs: 6, align: 'right', size: 8, hint: true, border: false });
  ws.getCell(42, 1).border = { top: THIN };
  ws.getCell(42, 19).border = { top: THIN };
  band(ws, 42, '꼬리말');
}

// ── 필드 시트 ──────────────────────────────────────────────────
// 표준 머리·꼬리가 쓰는 필드는 어느 서식에나 들어가므로 항상 먼저 깔린다.
const STANDARD_FIELDS = [
  { n: '발행처로고', l: '발행처 로고', t: '이미지', r: '', a: '' },
  { n: '발행처명', l: '발행처 이름', t: '글자', r: '필수', a: '' },
  { n: '발행처사업자번호', l: '발행처 사업자번호', t: '글자', r: '', a: '' },
  { n: '발행처주소', l: '발행처 주소', t: '글자', r: '', a: '' },
  { n: '발행처전화', l: '발행처 전화', t: '글자', r: '', a: '' },
  { n: '문서번호', l: '문서번호', t: '글자', r: '필수', a: '' },
  { n: '작성일자', l: '작성일자', t: '날짜', r: '필수', a: '' },
  { n: '담당자', l: '담당자', t: '글자', r: '', a: '' },
  { n: '검토자', l: '검토자', t: '글자', r: '', a: '' },
  { n: '승인자', l: '승인자', t: '글자', r: '', a: '' },
];

function fieldSheet(wb, extra = []) {
  const ws = wb.addWorksheet('필드');
  ws.columns = [
    { header: '이름', key: 'n', width: 20 },
    { header: '라벨', key: 'l', width: 22 },
    { header: '종류', key: 't', width: 12 },
    { header: '필수', key: 'r', width: 8 },
    { header: '배열', key: 'a', width: 14 },
  ];
  ws.getRow(1).font = { bold: true, size: 10 };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };

  const mark = ws.addRow({ n: '── 표준(모든 문서 공통) ──' });
  mark.font = { size: 9, color: { argb: HINT } };
  STANDARD_FIELDS.forEach((f) => ws.addRow(f));
  if (extra.length) {
    const m2 = ws.addRow({ n: '── 이 문서 전용 ──' });
    m2.font = { size: 9, color: { argb: HINT } };
    extra.forEach((f) => ws.addRow(f));
  }
  for (let r = 2; r <= 80; r++) {
    ws.getCell(r, 3).dataValidation = {
      type: 'list', allowBlank: true,
      formulae: ['"글자,숫자,금액,날짜,여러 줄,선택,예아니오,이미지,깊이"'],
    };
    ws.getCell(r, 4).dataValidation = { type: 'list', allowBlank: true, formulae: ['"필수"'] };
  }
  return ws;
}

// ── 안내 시트 ──────────────────────────────────────────────────
function guideSheet(wb) {
  const ws = wb.addWorksheet('안내');
  ws.getColumn(1).width = 26;
  ws.getColumn(2).width = 80;
  const line = (a, b, bold) => {
    const row = ws.addRow([a, b]);
    row.font = { name: '맑은 고딕', size: 10, bold: !!bold };
    row.alignment = { vertical: 'middle', wrapText: true };
    row.height = bold ? 26 : 18;
  };
  line('시작하는 법', '', true);
  line('', '「양식」 시트의 24열 × 42행이 A4 한 쪽입니다. 표준 머리(1~7행)와 꼬리(42행)는 이미 놓여 있으니 8행부터 채우면 됩니다.');
  line('', '칸을 병합하고 테두리를 그려서 문서를 만듭니다. 회색 글씨는 값이 들어갈 자리 표시입니다.');
  line('', '');
  line('건드리지 말 것', '', true);
  line('열 너비', '넓은 칸이 필요하면 옆 칸과 «병합»합니다. 열 너비를 바꾸면 24열 격자가 깨집니다.');
  line('행 높이', '기본 18pt(=한 칸). 높은 칸은 36pt·54pt처럼 18의 배수로 둡니다.');
  line('', '');
  line('값이 들어갈 자리', '', true);
  line('{{문서번호}}', '「필드」 시트에 적은 이름을 두 겹 중괄호로 씁니다.');
  line('{{품목.품명}}', '반복되는 줄의 값. 「필드」 시트에서 배열 칸에 «품목»이라 적은 필드들입니다.');
  line('{{합계:품목.금액}}', '집계. 합계 · 개수 · 평균 셋만 됩니다. 쉼표로 여러 열을 더할 수 있습니다.');
  line('{{들여:품목.품명}}', '트리 줄. 그 줄의 «깊이»만큼 글자가 밀립니다. 보통 품명 칸 하나에만 붙입니다 — 수량·단가는 제 열에 그대로 서야 세로로 읽힙니다.');
  line('{{번호:품목.품명}}', '구획 제목의 번호 — 「1. 주방」 「2. 후드」. 묶음을 여는 줄에만 붙고, 번호는 데이터가 아니라 그 표에서의 «자리»에서 나옵니다.');
  line('{{@쪽}} {{@총쪽}}', '쪽 번호. 값으로 줄 수 없어 시스템이 채웁니다.');
  line('', '');
  line('행의 역할 (Z열)', '', true);
  line('머리말 / 꼬리말', '매 쪽 위·아래에 반복됩니다.');
  line('열머리', '표의 제목 줄. 쪽이 넘어가면 다시 그려집니다.');
  line('그룹머리 / 그룹꼬리', '묶음이 바뀔 때 / 끝날 때 한 번. 소계 자리입니다.');
  line('', '트리에서는 「그룹머리」 없이 「그룹꼬리」만 적어도 됩니다 — 깊이 1인 줄이 다시 나오는 것이 곧 앞 묶음의 끝이라, 묶음 기준을 구조가 이미 말하고 있습니다.');
  line('', '「열머리」를 「그룹머리」 «아래»에 두면 구획마다 열머리가 다시 납니다. «위»에 두면 표 전체에 한 번입니다 — 적힌 순서가 곧 발화 순서입니다.');
  line('반복', '이 줄이 데이터 개수만큼 늘어납니다.');
  line('합계', '마지막 쪽에만 나옵니다.');
  line('', '');
  line('줄마다 깊이가 다른 표', '', true);
  line('', '내역서처럼 「주방 › 상부장 › 옵션1」이 딸리는 표는, 깊이를 담을 열을 하나 만들고 「필드」 시트에서 그 열의 종류를 «깊이»로 둡니다(1이 가장 얕습니다).');
  line('', '그 열은 종이에 안 찍힙니다 — 들여쓰기와 소계 경계가 읽어 가는 축입니다. 서식에는 «반복» 줄이 하나만 있고, 몇 줄이 될지는 값이 정합니다.');
  line('', '깊이 1을 «구획 제목»으로 쓰면(「그룹머리」로 두면) 그 줄은 반복에서 빠집니다 — 제목이 가져가므로 같은 이름이 두 번 나오지 않습니다. 이때 제목 줄은 자기 금액을 갖지 않고, 그 구획의 수는 소계가 말합니다.');
  line('', '들여쓰기는 «그려지는 줄 중 가장 얕은 깊이»가 기준입니다. 제목이 깊이 1을 가져가면 깊이 2가 기준선이 되어 표가 통째로 밀려 들어가지 않습니다.');
  line('', '');
  line('표준 머리에 있는 것', '', true);
  line('', '로고 · 발행처 이름/사업자번호/주소/전화 · 결재란(담당·검토·승인) · 문서 제목 · 문서번호 · 작성일자.');
  line('', '이 필드들은 모든 문서가 공유합니다. 서식이 정하는 것은 «어디에 놓느냐»뿐이라, 회사 정보가 바뀌면 한 번만 고치면 전 문서가 따라옵니다.');
  line('', '필요 없는 문서에서는 지워도 됩니다(예: 결재란 없는 명세서).');
  line('', '');
  line('확인', '인쇄 미리보기에서 24열이 한 쪽 안에 들어가고 배율이 100%인지 보세요.');
  return ws;
}


// ── ① 시작 템플릿 ──────────────────────────────────────────────
async function starter() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'erp-dsl';
  const ws = setupSheet(wb.addWorksheet('양식'));
  const from = standardHead(ws, '문 서 제 목');
  put(ws, from + 1, 1,
    '▽ 여기부터 본문입니다. 칸을 병합하고 테두리를 그려 만드세요. 높은 칸은 «세로 병합»으로. (이 줄은 지우세요)',
    { cs: 24, hint: true, border: false });
  standardFoot(ws);
  fieldSheet(wb);
  guideSheet(wb);
  await wb.xlsx.writeFile(`${OUT}/paper-template.xlsx`);
  return 'paper-template.xlsx';
}

// ── ② 산출내역서 (SW 개발) ─────────────────────────────────────
// 소프트웨어 사업의 원가 구조는 건설과 다르다 — 재료비·노무비·경비가 아니라
//   직접인건비(월평균임금 × 투입공수) + 제경비 + 기술료 + 직접경비.  (SW사업 대가산정 가이드)
// 형식(2단 병합 헤더·단계별 그룹·소계·총계)은 건설 내역서 관습을 그대로 쓴다 — 업종 무관한 장표 문법이라.
async function sampleCostBreakdown() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'erp-dsl';
  const ws = setupSheet(wb.addWorksheet('양식'));
  standardHead(ws, '산 출 내 역 서');

  // r3~4 사업 개요
  put(ws, 3, 1,  '사 업 명', { cs: 3, align: 'center', shade: true });
  put(ws, 3, 4,  '{{사업명}}', { cs: 9 });
  put(ws, 3, 13, '발 주 처', { cs: 3, align: 'center', shade: true });
  put(ws, 3, 16, '{{발주처}}', { cs: 9 });
  put(ws, 4, 1,  '계약기간', { cs: 3, align: 'center', shade: true });
  put(ws, 4, 4,  '{{계약시작}} ~ {{계약종료}}', { cs: 9 });
  put(ws, 4, 13, '산정방식', { cs: 3, align: 'center', shade: true });
  put(ws, 4, 16, '{{산정방식}}', { cs: 9 });

  // r6 구획
  put(ws, 6, 1, '■ 1. 투입공수 (직접인건비)', { cs: 24, shade: true, bold: true });

  // r7~8 두 단 헤더 — 「투입공수」가 인원·기간·M/M 셋을 거느린다(병합의 본보기)
  put(ws, 7, 1,  '단계',   { cs: 2, rs: 2, align: 'center', shade: true, bold: true });
  put(ws, 7, 3,  '직무',   { cs: 4, rs: 2, align: 'center', shade: true, bold: true });
  put(ws, 7, 7,  '등급',   { cs: 2, rs: 2, align: 'center', shade: true, bold: true });
  put(ws, 7, 9,  '투입공수', { cs: 6, align: 'center', shade: true, bold: true });
  put(ws, 7, 15, '월평균임금', { cs: 3, rs: 2, align: 'center', shade: true, bold: true });
  put(ws, 7, 18, '금액',   { cs: 4, rs: 2, align: 'center', shade: true, bold: true });
  put(ws, 7, 22, '비고',   { cs: 3, rs: 2, align: 'center', shade: true, bold: true });
  put(ws, 8, 9,  '인원',   { cs: 2, align: 'center', shade: true, size: 8 });
  put(ws, 8, 11, '기간(월)', { cs: 2, align: 'center', shade: true, size: 8 });
  put(ws, 8, 13, 'M/M',   { cs: 2, align: 'center', shade: true, size: 8 });
  band(ws, 7, '열머리');
  band(ws, 8, '열머리');

  put(ws, 9, 1, '{{투입.단계}}', { cs: 24, shade: true, bold: true });
  band(ws, 9, '그룹머리');

  put(ws, 10, 1,  '', { cs: 2 });
  put(ws, 10, 3,  '{{투입.직무}}', { cs: 4 });
  put(ws, 10, 7,  '{{투입.등급}}', { cs: 2, align: 'center' });
  put(ws, 10, 9,  '{{투입.인원}}', { cs: 2, align: 'center' });
  put(ws, 10, 11, '{{투입.기간}}', { cs: 2, align: 'center' });
  put(ws, 10, 13, '{{투입.공수}}', { cs: 2, align: 'right' });
  put(ws, 10, 15, '{{투입.월임금}}', { cs: 3, align: 'right' });
  put(ws, 10, 18, '{{투입.금액}}', { cs: 4, align: 'right' });
  put(ws, 10, 22, '{{투입.비고}}', { cs: 3 });
  band(ws, 10, '반복');

  put(ws, 11, 1,  '소　계', { cs: 12, align: 'right', shade: true });
  put(ws, 11, 13, '{{합계:투입.공수}}', { cs: 2, align: 'right' });
  put(ws, 11, 15, '', { cs: 3, shade: true });
  put(ws, 11, 18, '{{합계:투입.금액}}', { cs: 4, align: 'right' });
  put(ws, 11, 22, '', { cs: 3, shade: true });
  band(ws, 11, '그룹꼬리');

  put(ws, 12, 1,  '직접인건비 계', { cs: 12, align: 'right', shade: true, bold: true });
  put(ws, 12, 13, '{{합계:투입.공수}}', { cs: 2, align: 'right', bold: true });
  put(ws, 12, 15, '', { cs: 3, shade: true });
  put(ws, 12, 18, '{{합계:투입.금액}}', { cs: 4, align: 'right', bold: true });
  put(ws, 12, 22, '', { cs: 3, shade: true });
  band(ws, 12, '합계');

  // r14~ 원가 집계 — 비율 계산(제경비·기술료)은 소비처가 산출해 넘긴다(§주석)
  put(ws, 14, 1, '■ 2. 원가 집계', { cs: 24, shade: true, bold: true });
  const cost = (r, label, formula, tag, strong) => {
    put(ws, r, 1,  label,   { cs: 12, shade: true, bold: !!strong });
    put(ws, r, 13, formula, { cs: 6, align: 'center', size: 8, hint: true });
    put(ws, r, 19, tag,     { cs: 6, align: 'right', bold: !!strong });
  };
  cost(15, '직접인건비', '투입공수 × 월평균임금', '{{직접인건비}}');
  cost(16, '제경비',     '직접인건비 × {{제경비율}}', '{{제경비}}');
  cost(17, '기술료',     '(직접인건비 + 제경비) × {{기술료율}}', '{{기술료}}');
  cost(18, '직접경비',   '아래 3항 합계', '{{직접경비계}}');
  cost(19, '소　계',     '', '{{소계}}', true);
  cost(20, '부가가치세', '소계 × 10%', '{{부가세}}');
  cost(21, '총　계',     '', '{{총계}}', true);

  // r23~ 직접경비 명세 — 두 번째 반복 구간
  put(ws, 23, 1, '■ 3. 직접경비 명세', { cs: 24, shade: true, bold: true });
  put(ws, 24, 1,  '항목', { cs: 6, align: 'center', shade: true, bold: true });
  put(ws, 24, 7,  '규격', { cs: 6, align: 'center', shade: true, bold: true });
  put(ws, 24, 13, '수량', { cs: 2, align: 'center', shade: true, bold: true });
  put(ws, 24, 15, '단가', { cs: 4, align: 'center', shade: true, bold: true });
  put(ws, 24, 19, '금액', { cs: 4, align: 'center', shade: true, bold: true });
  put(ws, 24, 23, '비고', { cs: 2, align: 'center', shade: true, bold: true });
  band(ws, 24, '열머리');
  put(ws, 25, 1,  '{{경비.항목}}', { cs: 6 });
  put(ws, 25, 7,  '{{경비.규격}}', { cs: 6 });
  put(ws, 25, 13, '{{경비.수량}}', { cs: 2, align: 'center' });
  put(ws, 25, 15, '{{경비.단가}}', { cs: 4, align: 'right' });
  put(ws, 25, 19, '{{경비.금액}}', { cs: 4, align: 'right' });
  put(ws, 25, 23, '{{경비.비고}}', { cs: 2 });
  band(ws, 25, '반복');
  put(ws, 26, 1,  '소　계', { cs: 18, align: 'right', shade: true, bold: true });
  put(ws, 26, 19, '{{합계:경비.금액}}', { cs: 4, align: 'right', bold: true });
  put(ws, 26, 23, '', { cs: 2, shade: true });
  band(ws, 26, '합계');

  // 산정 근거 — 세로 병합 3칸(행 높이를 바꾸지 않는다)
  put(ws, 28, 1, '산정 근거', { cs: 3, rs: 3, align: 'center', shade: true, valign: 'top' });
  put(ws, 28, 4, '{{산정근거}}', { cs: 21, rs: 3, valign: 'top', wrap: true });

  standardFoot(ws);
  fieldSheet(wb, [
    { n: '사업명', l: '사업명', t: '글자', r: '필수', a: '' },
    { n: '발주처', l: '발주처', t: '글자', r: '필수', a: '' },
    { n: '계약시작', l: '계약 시작일', t: '날짜', r: '', a: '' },
    { n: '계약종료', l: '계약 종료일', t: '날짜', r: '', a: '' },
    { n: '산정방식', l: '산정방식', t: '선택', r: '', a: '' },
    { n: '직접인건비', l: '직접인건비', t: '금액', r: '필수', a: '' },
    { n: '제경비율', l: '제경비율', t: '글자', r: '', a: '' },
    { n: '제경비', l: '제경비', t: '금액', r: '', a: '' },
    { n: '기술료율', l: '기술료율', t: '글자', r: '', a: '' },
    { n: '기술료', l: '기술료', t: '금액', r: '', a: '' },
    { n: '직접경비계', l: '직접경비 계', t: '금액', r: '', a: '' },
    { n: '소계', l: '소계', t: '금액', r: '', a: '' },
    { n: '부가세', l: '부가가치세', t: '금액', r: '', a: '' },
    { n: '총계', l: '총계', t: '금액', r: '필수', a: '' },
    { n: '산정근거', l: '산정 근거', t: '여러 줄', r: '', a: '' },
    { n: '단계', l: '단계', t: '글자', r: '', a: '투입' },
    { n: '직무', l: '직무', t: '글자', r: '필수', a: '투입' },
    { n: '등급', l: '등급', t: '글자', r: '', a: '투입' },
    { n: '인원', l: '투입인원', t: '숫자', r: '', a: '투입' },
    { n: '기간', l: '투입기간(월)', t: '숫자', r: '', a: '투입' },
    { n: '공수', l: '투입공수(M/M)', t: '숫자', r: '', a: '투입' },
    { n: '월임금', l: '월평균임금', t: '금액', r: '', a: '투입' },
    { n: '금액', l: '금액', t: '금액', r: '', a: '투입' },
    { n: '비고', l: '비고', t: '글자', r: '', a: '투입' },
    { n: '항목', l: '항목', t: '글자', r: '', a: '경비' },
    { n: '규격', l: '규격', t: '글자', r: '', a: '경비' },
    { n: '수량', l: '수량', t: '숫자', r: '', a: '경비' },
    { n: '단가', l: '단가', t: '금액', r: '', a: '경비' },
    { n: '금액', l: '금액', t: '금액', r: '', a: '경비' },
    { n: '비고', l: '비고', t: '글자', r: '', a: '경비' },
  ]);
  guideSheet(wb);
  await wb.xlsx.writeFile(`${OUT}/paper-sample-cost-breakdown.xlsx`);
  return 'paper-sample-cost-breakdown.xlsx';
}

// ── ③ 내역서 (트리 — 구획 제목 + 깊이) ────────────────────────
// 오너의 실물 스케치(public/test-template.xlsx) 구조 그대로다.
//
// **깊이 1은 항목이 아니라 구획의 머리다.** 자기 단가가 없고 그 구획의 소계와 같은 수를 말한다 —
//  그래서 24열을 통째로 먹는 제목 줄로 서고(「1. 주방」), 값 칸이 아예 없다.
//  깊이 2·3만 항목이라 실제로 밀리는 계단은 하나뿐이다.
//
// **열머리가 구획 «안»에 있다.** 제목 아래에 공사·단위·수량…이 오고, 구획이 바뀌면 통째로 다시 난다.
//  밴드 순서가 그걸 말한다 — 시트에 적힌 순서가 곧 발화 순서다(열머리가 그룹머리 위면 표 전체에 한 번).
async function sampleTreeLedger() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'erp-dsl';
  const ws = setupSheet(wb.addWorksheet('양식'));
  standardHead(ws, '내 역 서');

  // r3 개요
  put(ws, 3, 1,  '현 장 명', { cs: 3, align: 'center', shade: true });
  put(ws, 3, 4,  '{{현장명}}', { cs: 9 });
  put(ws, 3, 13, '고 객 명', { cs: 3, align: 'center', shade: true });
  put(ws, 3, 16, '{{고객명}}', { cs: 9 });

  // 열 배분 — 품명 8 · 단위 2 · 수량 2 · 단가 4 · 금액 4 · 비고 4 = 24
  //  ⚠ 돈 열은 **4칸(112px) 아래로 못 내린다.** 3칸(84px)이면 ₩9,428,000이 끝자리부터 잘린다
  //     (14px 글자로 10자 ≈ 78px + 좌우 여백 10px). 잘린 금액은 빈칸보다 나쁘다 — 틀린 수로 읽힌다.
  const COL = { name: [1, 8], unit: [9, 2], qty: [11, 2], price: [13, 4], amount: [17, 4], note: [21, 4] };

  // r5 구획 제목 — 「1. 주방」. 번호는 값이 아니라 **자리**에서 나온다({{번호:…}}).
  put(ws, 5, 1, '{{번호:품목.품명}}', { cs: 24, shade: true, bold: true });
  band(ws, 5, '그룹머리');

  // r6 열머리 — 구획 제목 «아래»라 구획마다 다시 난다.
  const head = (label, [c, cs]) => put(ws, 6, c, label, { cs, align: 'center', shade: true, bold: true });
  head('공　사', COL.name); head('단위', COL.unit); head('수량', COL.qty);
  head('단가', COL.price); head('금액', COL.amount); head('비고', COL.note);
  band(ws, 6, '열머리');

  // r7 반복 — **품명 칸 하나만** 들여쓴다. 수량·단가·금액은 제 열에 그대로 서야 세로로 읽힌다.
  put(ws, 7, COL.name[0],   '{{들여:품목.품명}}', { cs: COL.name[1] });
  put(ws, 7, COL.unit[0],   '{{품목.단위}}',      { cs: COL.unit[1], align: 'center' });
  put(ws, 7, COL.qty[0],    '{{품목.수량}}',      { cs: COL.qty[1], align: 'right' });
  put(ws, 7, COL.price[0],  '{{품목.단가}}',      { cs: COL.price[1], align: 'right' });
  put(ws, 7, COL.amount[0], '{{품목.금액}}',      { cs: COL.amount[1], align: 'right' });
  put(ws, 7, COL.note[0],   '{{품목.비고}}',      { cs: COL.note[1] });
  band(ws, 7, '반복');

  // r8 그룹꼬리 — 소계. 구획 제목이 자기 금액을 안 갖는 대신 여기가 그 구획의 수를 말한다.
  put(ws, 8, 1,             '소　계', { cs: COL.amount[0] - 1, align: 'right', shade: true, bold: true });
  put(ws, 8, COL.amount[0], '{{합계:품목.금액}}', { cs: COL.amount[1], align: 'right', bold: true });
  put(ws, 8, COL.note[0],   '', { cs: COL.note[1], shade: true });
  band(ws, 8, '그룹꼬리');

  // r10 총계 — 마지막 쪽에만. (오너 스케치엔 없다. 필요 없으면 이 줄과 Z열 「합계」를 지운다.)
  put(ws, 10, 1,             '총　계', { cs: COL.amount[0] - 1, align: 'right', shade: true, bold: true });
  put(ws, 10, COL.amount[0], '{{합계:품목.금액}}', { cs: COL.amount[1], align: 'right', bold: true });
  put(ws, 10, COL.note[0],   '', { cs: COL.note[1], shade: true });
  band(ws, 10, '합계');

  standardFoot(ws);
  fieldSheet(wb, [
    { n: '현장명', l: '현장명', t: '글자', r: '필수', a: '' },
    { n: '고객명', l: '고객명', t: '글자', r: '', a: '' },
    // ⚠ «깊이»가 이 배열을 트리로 만든다. 이 한 줄이 빠지면 들여쓰기도 구획도 통째로 죽는다.
    { n: '레벨', l: '깊이', t: '깊이', r: '', a: '품목' },
    { n: '품명', l: '품명', t: '글자', r: '필수', a: '품목' },
    { n: '단위', l: '단위', t: '글자', r: '', a: '품목' },
    { n: '수량', l: '수량', t: '숫자', r: '', a: '품목' },
    { n: '단가', l: '단가', t: '금액', r: '', a: '품목' },
    { n: '금액', l: '금액', t: '금액', r: '', a: '품목' },
    { n: '비고', l: '비고', t: '글자', r: '', a: '품목' },
  ]);
  guideSheet(wb);
  await wb.xlsx.writeFile(`${OUT}/paper-sample-tree-ledger.xlsx`);
  return 'paper-sample-tree-ledger.xlsx';
}

await mkdir(OUT, { recursive: true });
const made = [await starter(), await sampleCostBreakdown(), await sampleTreeLedger()];
console.log(`[paper] public/ 에 생성:\n        ${made.join('\n        ')}`);
console.log(
  `        격자 ${COLS}열 × ${ROWS}행\n` +
  `        폭  ${COL_W} → ${colPx(COL_W)}px × ${COLS}열 = ${colPx(COL_W) * COLS}px  (가용 ${794 - 114}px)\n` +
  `        높이 ${ROW_PT}pt 고정 → 24px × ${ROWS}행 = ${24 * ROWS}px  (가용 ${1123 - 114}px)`,
);
