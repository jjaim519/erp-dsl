// 24×42 문서 서식 템플릿(.xlsx) 생성 — 저작 도구는 엑셀이고, 이 파일이 그 출발점이다.
//  · 표준 머리·꼬리가 박힌 시작 템플릿 + 실물 예제들을 public/ 에 떨군다. 패키지가 함께 배포한다.
//
// **여기서 나온 xlsx는 «어휘의 시연»이지 어느 회사의 문서가 아니다.** 레벨1이 공사 구획인지
//  공종인지, 어떤 열이 필요한지는 **도메인을 아는 소비처**가 정한다(README §8-2). 이 파일이 붙잡는 것은
//  그 반대편 — 음영 두 단·굵은 선·글자 사다리·열 배분 같은 **장표 문법**이고, 값을 열면 문서마다 갈린다.
//
// ⚠ **진실은 «누가 만들었나»가 가른다.** 여기서 생성한 것(paper-*.xlsx)은 이 코드가 진실이라
//  손으로 고치면 다음 실행에 덮인다 — 표현을 바꾸려면 **이 파일을 고친다**(그래야 판단이 주석에 남는다:
//  「16px는 사다리에 없다」·「돈 열은 4칸 아래로 못 내린다」). 반대로 엑셀에서 직접 그린 서식
//  (kk-gabji.xlsx 등)은 **그 xlsx가 진실**이고 여기 넣지 않는다 — 손으로 그린 걸 코드로 옮겨 적으면
//  두 벌만 생긴다.
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
// 음영 2단 — 구획·열머리(GREY)보다 **한 단계 어두운** 합계 계열. 장표는 「머리 < 합계」로 무게를 올린다.
//  토큰 하나로 뭉치면 그 구분이 통째로 사라져서(갑지 선례) 변환기가 헥스를 그대로 나른다.
const GREY2 = 'FFD0D0D0';
const HINT = 'FF9CA1AD';
const THIN = { style: 'thin', color: { argb: 'FF6E7480' } };
const ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };
// 굵은 선 — 「표 바깥은 굵게, 안쪽은 얇게」. 변환기는 style만 보고 두 단으로 닫는다(medium→굵음).
const MED = { style: 'medium', color: { argb: 'FF16181C' } };
const SIDE = { t: 'top', l: 'left', r: 'right', b: 'bottom' };
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
  // opt.outer — 굵게 그릴 변('tlrb' 중 몇 자). 나머지는 얇게.
  //  ⚠ 병합보다 **먼저** 걸어야 한다: ExcelJS는 mergeCells 시점에 마스터 스타일을 슬레이브에 복사하고,
  //    변환기는 오른쪽·아래 변을 그 «슬레이브»에서 읽는다(안 그러면 두 변을 통째로 잃는다).
  if (opt.border !== false) {
    const b = { ...ALL };
    for (const side of opt.outer ?? '') b[SIDE[side]] = MED;
    cell.border = b;
  }
  if (opt.shade || opt.shade2) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opt.shade2 ? GREY2 : GREY } };
  }
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
// **모든 문서가 같은 것 셋 — 좌상단 로고 · 가운데 문서명 · 꼬리말.** 회사의 문서들이 한 벌로 읽히게 하는
//  최소 골격이고, 서식이 정하는 것은 «그 밖에 무엇을 더 놓느냐»뿐이다. 셋 중 하나라도 빠지면
//  같은 회사에서 나온 종이로 안 읽힌다 — 변환기가 로고·꼬리말이 없으면 경고한다.
//  (문서번호·작성일자·결재란은 문서마다 다르다. 그건 통일 대상이 아니다.)
//
//  ⚠ **꼬리말은 «칸이 비어도» 있어야 한다.** 변환기가 지면 바닥을 거기서 읽기 때문이다 —
//   없으면 쪽 높이가 내용 높이로 잡혀 글자가 두 배 넘게 커진다. 실제로 갑지(kk-gabji.xlsx)가
//   **내용 없는 꼬리말 한 줄**을 그 용도로만 쓴다(오너 결정): 현장에 나가는 한 장짜리라 쪽번호가
//   의미 없고 발행처도 아는 사람들 사이에서 도는 종이라, 한 벌로 읽히는 일은 로고·문서명이 맡는다.
//   **그 빈 줄을 «실수»로 보고 지우면 갑지가 조용히 깨진다.**
//
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

  // titleOnly — 문서번호·작성일자를 안 쓰는 문서(현장 내역서처럼 한 장짜리).
  //  ⚠ 그 둘이 빠지면 **제목의 균형추가 사라진다** — 로고만 왼쪽에 남아 제목이 왼쪽으로 밀린다.
  //    그래서 오른쪽에 **로고와 같은 폭의 빈자리**를 둔다: 제목 4~21의 중심(12.5)이 지면 중심과 같다.
  //    내용으로 균형을 잡는 게 원칙이고(문서번호·작성일자), 그 값이 없는 문서에선 여백이 그 일을 한다.
  if (opts.titleOnly) {
    put(ws, r, 4, title, { cs: 18, rs: 2, align: 'center', bold: true, size: 18, border: false });
    return r + 2;
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

// opts.optional — 표준 필드에서 「필수」를 뗀다. 서식이 그 값을 안 놓는 문서에 쓴다
//  (필수인데 자리가 없으면 검증이 «필수 값의 자리가 없습니다»로 막는다 — 이름은 남겨 둔다:
//   지우면 나중에 다시 놓을 때 명단부터 만들어야 한다).
function fieldSheet(wb, extra = [], opts = {}) {
  const optional = new Set(opts.optional ?? []);
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

  if (!opts.bare) {
    const mark = ws.addRow({ n: '── 표준(모든 문서 공통) ──' });
    mark.font = { size: 9, color: { argb: HINT } };
  }
  if (!opts.bare) STANDARD_FIELDS.forEach((f) => ws.addRow(optional.has(f.n) ? { ...f, r: '' } : f));
  if (extra.length) {
    if (!opts.bare) {
      const m2 = ws.addRow({ n: '── 이 문서 전용 ──' });
      m2.font = { size: 9, color: { argb: HINT } };
    }
    extra.forEach((f) => ws.addRow(f));
  }
  const types = opts.types ?? '글자,숫자,금액,날짜,여러 줄,선택,예아니오,이미지,깊이';
  for (let r = 2; r <= 80; r++) {
    ws.getCell(r, 3).dataValidation = { type: 'list', allowBlank: true, formulae: [`"${types}"`] };
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
  line('세로 정렬', '엑셀은 세로 정렬을 안 정하면 «아래»에 붙여 그리지만, 인쇄물은 «가운데»로 나갑니다. 엑셀 화면과 결과를 맞추려면 세로 정렬을 «가운데»로 지정해 두세요(결과가 바뀌지는 않습니다).');
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
// 머리는 **로고 + 문서명**뿐이다(`titleOnly`). 문서번호·작성일자·결재란은 안 깐다 —
//  실제로 그린 문서(갑지)가 그 셋을 다 지우고 시작했다. **틀은 모든 문서에 공통인 것만** 담는다:
//  없는 걸 지우는 것보다 필요한 걸 더하는 게 싸고, 「필드」 시트에 이름은 남아 있어 되놓기도 쉽다.
//  꼬리말은 남긴다 — 발행처 한 줄·쪽번호는 어느 문서에나 붙고, 무엇보다 **꼬리말 행이 곧 지면 바닥**이라
//  이게 없으면 변환할 때마다 `--rows`를 손으로 줘야 한다(발주서가 그래서 10행으로 읽혔다).
async function starter() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'erp-dsl';
  const ws = setupSheet(wb.addWorksheet('양식'));
  const from = standardHead(ws, '문 서 제 목', { titleOnly: true });
  put(ws, from + 1, 1,
    '▽ 여기부터 본문입니다. 칸을 병합하고 테두리를 그려 만드세요. 높은 칸은 «세로 병합»으로. (이 줄은 지우세요)',
    { cs: 24, hint: true, border: false });
  standardFoot(ws);
  //  머리가 안 놓는 값(문서번호·작성일자·결재)은 「필수」를 뗀다 — 필수인데 자리가 없으면
  //  검증이 «필수 값의 자리가 없습니다»로 막는다. 이름은 남겨 둔다(되놓을 때 명단부터 만들지 않게).
  fieldSheet(wb, [], { optional: ['문서번호', '작성일자'] });
  guideSheet(wb);
  await wb.xlsx.writeFile(`${OUT}/paper-template.xlsx`);
  return 'paper-template.xlsx';
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
  // 문서번호·작성일자를 안 쓴다 — 제목은 오른쪽 빈자리를 짝으로 삼아 지면 가운데에 선다.
  standardHead(ws, '내 역 서', { titleOnly: true });

  // r3 개요 — 현장명 한 줄이 전 폭을 쓴다(짝이 될 값이 없어 반으로 가르면 오른쪽이 빈다).
  put(ws, 3, 1, '현 장 명', { cs: 3, align: 'center', shade: true });
  put(ws, 3, 4, '{{현장명}}', { cs: 21 });

  // 열 배분 — 품명 8 · 단위 2 · 수량 2 · 단가 4 · 금액 4 · 비고 4 = 24
  //  ⚠ 돈 열은 **4칸(112px) 아래로 못 내린다.** 3칸(84px)이면 ₩9,428,000이 끝자리부터 잘린다
  //     (14px 글자로 10자 ≈ 78px + 좌우 여백 10px). 잘린 금액은 빈칸보다 나쁘다 — 틀린 수로 읽힌다.
  const COL = { name: [1, 8], unit: [9, 2], qty: [11, 2], price: [13, 4], amount: [17, 4], note: [21, 4] };

  // r5 구획 제목 — 「1. 주방」. 번호는 값이 아니라 **자리**에서 나온다({{번호:…}}).
  //  가운데 정렬 — 구획 제목은 한 칸을 채우는 «머리»지 왼쪽에서 시작하는 항목이 아니다.
  put(ws, 5, 1, '{{번호:품목.품명}}', { cs: 24, shade: true, bold: true, align: 'center', outer: 'tlr' });
  band(ws, 5, '그룹머리');

  // r6 열머리 — 구획 제목 «아래»라 구획마다 다시 난다.
  //  ⚠ 굵은 세로선은 **양 끝 칸이 나눠 갖는다** — 첫 칸이 왼쪽, 끝 칸이 오른쪽.
  const head = (label, [c, cs], outer) =>
    put(ws, 6, c, label, { cs, align: 'center', shade: true, bold: true, ...(outer ? { outer } : {}) });
  head('공　사', COL.name, 'l'); head('단위', COL.unit); head('수량', COL.qty);
  head('단가', COL.price); head('금액', COL.amount); head('비고', COL.note, 'r');
  band(ws, 6, '열머리');

  // r7 반복 — **품명 칸 하나만** 들여쓴다. 수량·단가·금액은 제 열에 그대로 서야 세로로 읽힌다.
  //  이 줄이 값 개수만큼 늘어나므로 좌·우 굵은 선도 그만큼 이어져 **묶음의 옆구리**가 된다.
  put(ws, 7, COL.name[0],   '{{들여:품목.품명}}', { cs: COL.name[1], outer: 'l' });
  put(ws, 7, COL.unit[0],   '{{품목.단위}}',      { cs: COL.unit[1], align: 'center' });
  put(ws, 7, COL.qty[0],    '{{품목.수량}}',      { cs: COL.qty[1], align: 'right' });
  put(ws, 7, COL.price[0],  '{{품목.단가}}',      { cs: COL.price[1], align: 'right' });
  put(ws, 7, COL.amount[0], '{{품목.금액}}',      { cs: COL.amount[1], align: 'right' });
  put(ws, 7, COL.note[0],   '{{품목.비고}}',      { cs: COL.note[1], outer: 'r' });
  band(ws, 7, '반복');

  // r8 그룹꼬리 — 소계. 구획 제목이 자기 금액을 안 갖는 대신 여기가 그 구획의 수를 말한다.
  //  **세 칸을 같은 음영으로** 칠한다: 금액 칸만 비면 합계 줄이 중간에서 끊어져 보인다.
  //  아래 굵은 선이 묶음의 **바닥**이라, 구획 제목의 위 선과 만나 「제목~소계」가 한 상자가 된다.
  put(ws, 8, 1,             '소　계', { cs: COL.amount[0] - 1, align: 'right', shade2: true, bold: true, outer: 'lb' });
  put(ws, 8, COL.amount[0], '{{합계:품목.금액}}', { cs: COL.amount[1], align: 'right', shade2: true, bold: true, outer: 'b' });
  put(ws, 8, COL.note[0],   '', { cs: COL.note[1], shade2: true, outer: 'rb' });
  band(ws, 8, '그룹꼬리');

  // r10~11 총계 — 마지막 쪽에만. **2행(48px)을 쓰고 글자를 한 단 올린다**(소계 14 → 17).
  //  ⚠ 16px는 사다리에 없다 — 42행 지면의 단은 14·15·17이고, 15는 소계와 1px 차이라 안 갈린다.
  //  (오너 스케치엔 없던 줄이다. 필요 없으면 이 세 칸과 Z10을 지운다.)
  //  총계는 **비고를 안 쓴다** — 금액 칸이 비고까지 먹어 오른쪽 끝까지 간다(소계와 달리 두 칸).
  //   합계 줄에 빈 비고를 남기면 문서가 거기서 안 끝난 것처럼 보인다.
  put(ws, 10, 1,             '총　계', { cs: COL.amount[0] - 1, rs: 2, align: 'right', shade2: true, bold: true, size: 12, outer: 'tlb' });
  put(ws, 10, COL.amount[0], '{{합계:품목.금액}}',
    { cs: COL.amount[1] + COL.note[1], rs: 2, align: 'right', shade2: true, bold: true, size: 12, outer: 'trb' });
  band(ws, 10, '합계');
  band(ws, 11, '합계');

  standardFoot(ws);
  //  문서번호·작성일자는 이 서식이 안 놓는다 — 이름은 남기고 「필수」만 뗀다(다시 놓으면 그대로 산다).
  fieldSheet(wb, [
    { n: '현장명', l: '현장명', t: '글자', r: '필수', a: '' },
    // ⚠ «깊이»가 이 배열을 트리로 만든다. 이 한 줄이 빠지면 들여쓰기도 구획도 통째로 죽는다.
    { n: '레벨', l: '깊이', t: '깊이', r: '', a: '품목' },
    { n: '품명', l: '품명', t: '글자', r: '필수', a: '품목' },
    { n: '단위', l: '단위', t: '글자', r: '', a: '품목' },
    { n: '수량', l: '수량', t: '숫자', r: '', a: '품목' },
    { n: '단가', l: '단가', t: '금액', r: '', a: '품목' },
    { n: '금액', l: '금액', t: '금액', r: '', a: '품목' },
    { n: '비고', l: '비고', t: '글자', r: '', a: '품목' },
  ], { optional: ['문서번호', '작성일자'] });
  guideSheet(wb);
  await wb.xlsx.writeFile(`${OUT}/paper-sample-tree-ledger.xlsx`);
  return 'paper-sample-tree-ledger.xlsx';
}

await mkdir(OUT, { recursive: true });
// ── ③ 계층 등록표 ──────────────────────────────────────────────
// 문서 서식과 **같은 세 시트**(양식·필드·안내)를 쓴다. 다른 건 「양식」이 «그릴 레이아웃»이 아니라
//  «채울 표»라는 것뿐이다 — 파일을 열었을 때 규칙이 하나여야 저작하는 사람이 안 헷갈린다.
//  (문서로 렌더되지 않으므로 24열 격자·Z열 역할·인쇄 영역이 없다. 변환기는 그걸로 둘을 가른다.)
//
// ⚠ **「양식」에는 헤더 행만 둔다.** 예시는 「안내」에 그린다 — 예시를 데이터 시트에 두면
//   지우라고 적어둬도 안 지우고 그대로 올려서 «남의 회사 현장»이 등록된다. 넘겨주는 파일은
//   **그대로 올려도 0건**이 나와야 한다.
//
// 열의 «뜻»은 전부 「필드」가 말한다. 전에는 헤더에 `면적(숫자)`처럼 괄호로 박아 두고
//  「헤더 글자는 바꾸지 마세요」라고 경고했는데, 그건 사람이 읽는 이름과 기계가 읽는 계약을
//  한 칸에 욱여넣은 것이었다. 이제 헤더는 이름이고 종류는 「필드」에 있다.
const HIERARCHY_TYPES = '분류,이름,부제,배지,배지색,썸네일,글자,숫자,금액,날짜,퍼센트,예아니오';
const HIERARCHY_FIELDS = [
  // 「분류」가 폴더 단계다 — 몇 개를 두든 그만큼 깊어진다(전에는 «품목명 왼쪽»이라는 암묵 규칙이었다).
  { n: '대분류', l: '대분류', t: '분류', r: '', a: '' },
  { n: '중분류', l: '중분류', t: '분류', r: '', a: '' },
  { n: '품목명', l: '품목명', t: '이름', r: '필수', a: '' },
  { n: '부제', l: '부제', t: '부제', r: '', a: '' },
  { n: '상태', l: '상태', t: '배지', r: '', a: '' },
  { n: '상태색', l: '상태 색', t: '배지색', r: '', a: '' },
  { n: '썸네일', l: '썸네일', t: '썸네일', r: '', a: '' },
  //  아래 둘은 «이 도메인의» 예다. 지우고 자기 열을 넣으면 된다 — 그게 이 표의 확장 방식이다.
  { n: '면적', l: '면적', t: '숫자', r: '', a: '' },
  { n: '계약일', l: '계약일', t: '날짜', r: '', a: '' },
];

async function hierarchyTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'erp-dsl';

  // 「양식」 — 헤더 한 줄. 데이터 표라 격자·인쇄 설정이 없다.
  const ws = wb.addWorksheet('양식');
  ws.columns = HIERARCHY_FIELDS.map((f) => ({ header: f.n, key: f.n, width: Math.max(10, f.n.length * 2 + 6) }));
  const head = ws.getRow(1);
  head.font = { name: '맑은 고딕', size: 10, bold: true };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
  head.border = { bottom: MED };
  ws.views = [{ state: 'frozen', ySplit: 1 }];   // 길게 채워도 머리가 따라온다

  fieldSheet(wb, HIERARCHY_FIELDS, { bare: true, types: HIERARCHY_TYPES });

  // 「안내」 — 문서용과 규칙이 다르므로 여기서 직접 쓴다. 예시 표가 여기 산다.
  const g = wb.addWorksheet('안내');
  g.getColumn(1).width = 16;
  for (let c = 2; c <= 8; c++) g.getColumn(c).width = 14;
  const line = (cells, opt = {}) => {
    const row = g.addRow(cells);
    row.font = { name: '맑은 고딕', size: 10, bold: !!opt.bold, color: { argb: opt.hint ? HINT : 'FF16181C' } };
    row.alignment = { vertical: 'middle', wrapText: !!opt.wrap };
    row.height = opt.bold ? 26 : 18;
    return row;
  };
  line(['이 파일 채우는 법 — 계층 등록표'], { bold: true });
  line(['', '「양식」 시트 한 장만 채우면 됩니다. 이 안내와 「필드」 시트는 설명·설정용입니다.']);
  line([]);
  line(['채우는 규칙'], { bold: true });
  line(['', '· 왼쪽 「대분류 / 중분류」가 폴더입니다. 왼쪽이 큰 분류, 오른쪽이 작은 분류.']);
  line(['', '· 같은 폴더에 품목이 여럿이면 폴더 칸을 똑같이 반복해 적으세요.']);
  line(['', '· 폴더만 먼저 만들려면 폴더 칸만 적고 「품목명」을 비워 두세요.']);
  line(['', '· 더 깊은 분류가 필요하면 「필드」 시트에 종류가 「분류」인 줄을 더하고, 「양식」에 그 열을 넣으세요.']);
  line([]);
  line(['예시 — 이 표를 「양식」 시트에 옮겨 적으면 이렇게 됩니다'], { bold: true });
  const ex = [
    ['대분류', '중분류', '품목명', '부제', '상태', '상태색', '면적', '계약일'],
    ['현장', '강남 현장', '거실 도면', 'rev.2', '승인', '성공', 32, '2026-05-02'],
    ['현장', '강남 현장', '주방 도면', 'rev.1', '검토중', '경고', 18, '2026-05-10'],
    ['현장', '판교 현장', '', '', '', '', '', ''],
    ['거래처', '가구상사', '계약서', '', '확정', '성공', '', '2026-04-01'],
  ];
  ex.forEach((cells, i) => {
    const row = line(cells, { hint: true });
    if (i === 0) row.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: HINT } };
    row.eachCell((c) => { c.border = { top: THIN, left: THIN, bottom: THIN, right: THIN }; });
  });
  line(['', '「판교 현장」 줄처럼 품목명을 비우면 폴더만 생깁니다.'], { hint: true });
  line([]);
  line(['「필드」 시트'], { bold: true });
  line(['', '· 「양식」의 각 열이 무엇인지 여기서 말합니다. 「이름」이 「양식」의 헤더와 같아야 합니다.']);
  line(['', '· 종류: 분류(폴더) · 글자 · 숫자 · 금액 · 날짜 · 퍼센트 · 예아니오 · 배지 · 배지색 · 썸네일']);
  line(['', '· 배지색에 적는 값: 성공 / 경고 / 위험 / 정보 / 기본. 비우면 기본입니다.']);
  line(['', '· 「품목명」 오른쪽 첫 열이 카드의 핵심값이 됩니다 — 중요한 지표를 앞에 두세요.']);

  await wb.xlsx.writeFile(`${OUT}/hierarchy-template.xlsx`);
  return 'hierarchy-template.xlsx';
}

const made = [await starter(), await sampleTreeLedger(), await hierarchyTemplate()];
console.log(`[paper] public/ 에 생성:\n        ${made.join('\n        ')}`);
console.log(
  `        격자 ${COLS}열 × ${ROWS}행\n` +
  `        폭  ${COL_W} → ${colPx(COL_W)}px × ${COLS}열 = ${colPx(COL_W) * COLS}px  (가용 ${794 - 114}px)\n` +
  `        높이 ${ROW_PT}pt 고정 → 24px × ${ROWS}행 = ${24 * ROWS}px  (가용 ${1123 - 114}px)`,
);
