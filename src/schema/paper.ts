// ── 문서 정의(장표) — 데이터 세계 ────────────────────────────────
// 회사 문서(명세서·공문·계약서…)를 "24열 × N행 격자 위의 셀"로 적는 직렬화 계약.
// 부품이 아니다. LLM이 생성하고 검증기가 관문 역할을 하는 *데이터*다(헌법 1 — 도메인은 여기로만).
//
// 모델은 엑셀 한 장이다. 다만 셋을 뺐고 셋을 더했다:
//   뺀 것  : 열 너비(넓히려면 병합) · 임의 글자크기/색(닫힌 단계·역할) · 일반 수식
//   더한 것: 데이터 자리(field) · 행 범위 이름표(bands) · 닫힌 집계(agg)
//
// 쪽 나눔은 저작이 아니라 렌더가 한다 — 반복 행이 몇 줄이 될지는 값이 와야 알기 때문.
// 그래서 좌표는 "문서 전체 행 번호"이고 쪽은 도출된다(PAPER_ROWS_PER_PAGE 단위로 자름).
import type { FieldSpec } from './fields';

// ── 지면 상수 (A4 @96dpi) ──────────────────────────────────────
// 210×297mm = 794×1123px. 여백 15mm = 57px. 행 단위 24px는 8px 베이스라인에 떨어지고
// 11px 글자 + 상하 패딩이 딱 들어간다(더 큰 글자는 행 단위 2 = 48px를 먹인다).
//   세로: (1123 − 114) ÷ 24 = 42.04 → 42행 × 24 = 1008px (1px 남음)
//   가로: ( 794 − 114) ÷ 24 = 28.33 → 28행
export const PAPER_CANON = {
  portrait: { w: 794, h: 1123 },
  landscape: { w: 1123, h: 794 },
} as const;
export const PAPER_MARGIN = 57;      // 15mm
export const PAPER_PAGE_ROWS = 42;   // 쪽당 행 수 기본값 → 행 24px

/**
 * 타이포 단계별 «행 단위 대비 글자 크기» 비율 · 줄 간격 · 칸 좌우 여백.
 *
 * ⚠ **`paper.css`의 `--paper-*`·`line-height`·`padding`과 같은 수여야 한다.** 거기는 *그리는* 쪽이고
 *   여기는 *「몇 줄이 될까」를 재는* 쪽이다 — 어긋나면 배치 엔진이 행을 잘못 키운다.
 *   CSS가 TS를 못 읽어서 두 벌이 되는 자리라, 값의 주인은 여기로 두고 CSS에 주석을 걸어 둔다.
 */
export const PAPER_TYPO_RATIO: Record<PaperTypo, number> = {
  display: 0.92, heading: 0.71, subheading: 0.625,
  body: 0.583, 'body-strong': 0.583, caption: 0.48,
};
export const PAPER_LINE_HEIGHT = 1.3;
export const PAPER_CELL_PAD_X = 5;

export type PaperOrientation = keyof typeof PAPER_CANON;

/**
 * 한 쪽에 들어가는 행 수. **서식이 선언한다.**
 * 쪽당 행 수·행 높이·글자 크기 셋은 하나로 묶여 있어서(행수 × 행높이 = 지면 높이) 따로 박으면
 * 하나를 키울 때 딴 게 깨진다. 그래서 **행 수만 선언하고 나머지는 도출한다**
 * (theme.ts의 `neutral = f(primary)`와 같은 사상 — 관계만 박고 값은 안 박는다).
 *
 *   42행 → 24px → 본문 14px(10.5pt)    ← 기본
 *   36행 → 28px → 본문 16px(12.2pt)
 *   31행 → 32px → 본문 18.6px(14pt)     ← 엑셀 24pt 행 + 14pt 글자와 같은 크기
 */
export const pageRowsOf = (spec: { pageRows?: number }) => spec.pageRows ?? PAPER_PAGE_ROWS;

/** 행 한 단위의 픽셀 높이 — 지면에서 도출된다. */
export function rowUnitOf(spec: { pageRows?: number; orientation: PaperOrientation }): number {
  const h = PAPER_CANON[spec.orientation].h - PAPER_MARGIN * 2;
  return Math.floor(h / pageRowsOf(spec));
}

// ── 닫힌 값 ────────────────────────────────────────────────────
// 열 수는 사다리 3단. 24가 기본이고 ×2로 무손실 승급된다(c·cs를 2배).
// 12로 못 만드는 8등분이 24에선 되고, 48은 그보다 더 잘게 나눌 때만.
export type PaperColumns = 12 | 24 | 48;

export type PaperAlign = 'start' | 'center' | 'end';
export type PaperVAlign = 'top' | 'middle' | 'bottom';   // 병합 칸이 생기는 순간 필수가 된다
export type PaperTypo = 'display' | 'heading' | 'subheading' | 'body' | 'body-strong' | 'caption';
export type PaperInk = 'primary' | 'secondary' | 'danger';   // 임의 색 대신 역할 3
/**
 * 채우기 — 역할 토큰 3단, 또는 **종이 절대색** `#RRGGBB`.
 *
 * 헥스를 여는 이유: 한 장표가 음영을 두 단계로 쓰면(열머리 25% · 라벨 15%) 토큰 하나로는 그 구분이
 * 통째로 사라진다. 잉크(`PaperInk`)와 달리 채우기는 **서식이 말하는 뜻**이라 반올림하면 안 된다.
 * 이건 이 파일이 A4를 px로 못박는 것과 같은 예외다 — 종이는 화면이 아니라 고정 좌표계다.
 * 손으로 적는 서식은 토큰을 쓰고, 헥스는 엑셀에서 변환된 값이 지나는 길이다.
 */
export type PaperFill = 'none' | 'shade' | 'brand' | `#${string}`;
export type PaperEdge = 't' | 'r' | 'b' | 'l';
export type PaperFlow = 'wrap' | 'ellipsis';                 // 인쇄물은 wrap이 기본(잘리면 정보가 사라진다)
export type PaperWriting = 'horizontal' | 'vertical';        // 「공급자」처럼 세로로 쓰는 칸(CSS writing-mode)
export type PaperFormat = 'text' | 'number' | 'currency' | 'date' | 'percent' | 'boolean';

/**
 * 집계 — 닫힌 셋. 소비처가 계산해 넘기려면 서식의 그룹 기준을 알아야 해서 계약이 샌다.
 * `of`가 배열인 것은 "총계 = 공급가액 + 세액"처럼 여러 열을 한 칸에서 더하는 실수요 때문.
 */
export type PaperAgg = { fn: 'sum' | 'count' | 'avg'; of: string | string[] };

/**
 * 시스템 값 — 서식이 쓸 수 있지만 소비처가 주지 않는 것. `@` 접두라 사용자 필드와 안 겹친다.
 * 쪽 번호는 분배가 끝나야 알 수 있어서 값으로 받을 수가 없다(2패스).
 */
export const PAPER_SYSTEM_FIELDS = ['@page', '@pages', '@today'] as const;
export type PaperSystemField = (typeof PAPER_SYSTEM_FIELDS)[number];

// ── 셀 ─────────────────────────────────────────────────────────
// 저장은 sparse — 채워진 칸만 적는다(엑셀과 같다). 빈칸은 렌더러가 격자를 채워 만든다.
// 내용은 배타 4종: text | field | image | agg (전부 없으면 빈 칸).
export type PaperCell = {
  r: number;              // 문서 전체 행 번호(0-index). 쪽은 도출된다
  c: number;              // 열(0-index)
  rs?: number;            // 세로 병합(기본 1)
  cs?: number;            // 가로 병합(기본 1) — 넓히는 유일한 수단(열 너비는 없다)
  text?: string;          // 고정 글자
  field?: string;         // 데이터 자리. 반복 안이면 점 경로("lines.qty")
  /**
   * 한 칸에 값이 여럿이거나 글자와 섞인 자리 — `"{{시작}} ~ {{끝}}"`.
   * 실물 서식이 요구한다(계약기간·표준 꼬리 "발행처명 주소 전화"·쪽번호 "1 / 3").
   * 자리표시자 안에는 **필드 이름만** 들어간다(식·함수 없음) — 열린 구멍이 아니라 이어붙이기다.
   */
  template?: string;
  image?: string;         // 이미지 자리(로고·도면). PaperSpec.images 의 이름
  agg?: PaperAgg;         // 집계 결과
  /**
   * 이 칸이 «누구를 대신해 말하는가». 기본은 항목(반복 한 줄마다 한 번).
   * `group`이면 **묶음 전체에 한 번**만 그려지고 그 묶음의 줄 수만큼 세로로 걸친다 —
   * 「경첩」이 15T 댐퍼·무댐퍼·18T 댐퍼·무댐퍼 네 줄에 걸치는 그 칸이다.
   *
   * `groupHeader`와 다르다: groupHeader는 묶음이 바뀔 때 **자기 행을 하나 먹고**,
   * 이건 반복 행들 **옆에 걸친다**. 한국 장표에서 표준이라 리포트 엔진 3사에 없어도 연다.
   * 쪽이 묶음 중간에서 갈리면 걸침도 같이 갈린다(각 쪽이 자기 몫만큼 걸친다).
   */
  scope?: 'item' | 'group';
  /**
   * 이 칸은 그 줄의 **깊이만큼 밀린다**(트리 배열 — `PaperArray.level`).
   *
   * 폭을 안 여는 이유: 들여쓰기 한 단은 **문서가 정할 값이 아니다.** px를 열면 서식마다 갈리고
   * 같은 회사 문서 둘이 다른 계단을 갖는다. 깊이는 데이터가 갖고, 칸은 «민다/안 민다»만 말한다.
   *
   * 격자를 옮기지 않고 **글자만** 민다 — 칸을 통째로 밀면 열이 어긋나 테두리가 계단이 된다.
   * 그래서 보통 **품명 칸 하나에만** 붙인다(수량·단가·금액은 제 열에 그대로 선다).
   */
  indent?: boolean;
  /**
   * 이 칸의 값 앞에 **묶음 번호**를 붙인다 — 「1. 주방」 「2. 후드」.
   *
   * 번호의 주인은 «몇 번째 묶음인가»지 «몇 번째 줄인가»가 아니다. 그래서 묶음을 **여는 줄에만**
   * 붙고(보통 깊이 1), 그 아래 딸린 줄들은 번호를 안 받는다 — 묶음 경계는 `atLevel`이 이미 정했다.
   *
   * 데이터로 안 받는 이유: 소비처가 번호를 열로 들고 있으면 줄을 하나 지울 때마다 다시 매겨야 하고,
   * 그러다 종이의 번호와 데이터의 번호가 갈린다. 번호는 **그 표에서 그 줄이 있는 자리**의 성질이다.
   *
   * ⚠ `mode:'edit'`의 입력 칸에는 안 붙는다 — 고치는 것은 품명이지 「1. 주방」이라는 글자가 아니다.
   */
  number?: boolean;
  format?: PaperFormat;   // 표시 형식(값 표현 — 저장값은 안 건드린다)
  border?: PaperEdge[];   // 그릴 변(얇은 선). 없으면 선 없음 — 격자는 정렬 골격일 뿐이다
  /**
   * 굵은 선을 그릴 변. 장표는 «표 바깥은 굵게, 안쪽은 얇게»가 관습이고 엑셀도 medium/thick을 쓴다.
   * 굵기를 숫자로 열지 않고 **두 단(얇음·굵음)으로 닫는다** — 굵기 사다리가 열리면 문서마다 갈린다.
   */
  borderStrong?: PaperEdge[];
  align?: PaperAlign;     // 기본 start
  valign?: PaperVAlign;   // 기본 middle
  typo?: PaperTypo;       // 기본 body
  ink?: PaperInk;         // 기본 primary
  fill?: PaperFill;       // 기본 none
  flow?: PaperFlow;       // 기본 wrap
  writing?: PaperWriting; // 기본 horizontal
};

// ── 행 ─────────────────────────────────────────────────────────
// 기본 1단위. 서명란·도장 자리처럼 "내용은 없는데 물리 크기가 필요한" 칸 때문에 연다.
// 임의 px이 아니라 단위 수라 인쇄 높이가 예측 가능하고 쪽 계산이 정수로 떨어진다.
export type PaperRow = { r: number; h: number };   // h = 단위 수(1~6)

// ── 반복 원본 ──────────────────────────────────────────────────
// FieldSpec에 배열 타입을 더하지 않는다 — 폼(FormSection)은 배열을 안 다루고 문서만 다루므로,
// 오염시키지 않고 문서 스펙에 따로 둔다.
export type PaperArray = {
  name: string;        // "lines"
  label: string;       // "품목"
  of: FieldSpec[];     // 한 줄의 필드들. 셀은 "lines.qty"로 가리킨다
  /**
   * **이 배열은 트리다.** 깊이를 담은 필드 이름(1부터 — 1이 가장 얕다).
   *
   * 중첩(`children`)이 아니라 **평탄 배열 + 깊이 열**로 받는다. 셋 다 그쪽을 가리킨다:
   * ① 엑셀이 이미 그 모양이다(왼쪽 칸에 레벨을 적는다) ② `buildHierarchyFromRows`가 같은 선례다
   * ③ 쪽 나눔은 평평한 흐름 위에서 도는데 중첩으로 받으면 엔진이 다시 펴야 한다.
   *
   * 깊이는 **줄의 성질이지 값이 아니다** — 인쇄물에 숫자로 찍히는 칸이 아니라
   * 들여쓰기(`PaperCell.indent`)와 묶음 경계(`PaperBand.atLevel`)가 읽어 가는 축이다.
   */
  level?: string;
};

// ── 행 범위 이름표 ─────────────────────────────────────────────
// 앞서 "블록·밴드"라 부르던 것이 전부 여기로 수렴한다 — 엑셀의 *인쇄 제목 행*과 같은 어휘.
export type PaperBandKind =
  | 'pageHeader'    // 매 쪽 위에 반복
  | 'pageFooter'    // 매 쪽 아래에 반복
  | 'columnHeader'  // 반복 표의 열 머리 — 쪽을 넘기면 다시 그린다
  | 'groupHeader'   // 묶음이 바뀔 때 한 번(분류 밴드)
  | 'repeat'        // 데이터 배열만큼 늘어나는 구간(detail)
  | 'groupFooter'   // 묶음이 끝날 때 한 번(소계)
  /**
   * 묶음마다 한 줄 — **반복이 «항목» 축이면 이건 «묶음» 축이다.**
   * 상세 표와 떨어진 자리에서 「종류별로 얼마」를 모아 보이는 구간(사용내역서 하단).
   *
   * `groupFooter`와 다르다: 그건 반복 클러스터 «안»에 끼어 각 묶음 뒤에 발화하고,
   * 이건 자기 구간에서 **묶음 수만큼** 발화한다. 상세를 한 번도 안 그려도 된다.
   * 그 줄의 `{{묶음:배열.기준}}`이 무엇으로 묶을지를 말하고, 집계는 그 묶음 범위만 더한다.
   */
  | 'groupRepeat'
  | 'summary';      // 총계 — 마지막 쪽에만

// 그룹 머리·꼬리는 반복 *안*이 아니라 반복을 **감싸는 형제**다.
// (Jasper·Crystal·RDL 셋 다 groupHeader / detail / groupFooter를 나란히 둔다 —
//  머리는 묶음이 바뀔 때, 본문은 레코드마다, 꼬리는 묶음이 끝날 때 발화하므로 서로 다른 행이다.)
export type PaperBand = {
  kind: PaperBandKind;
  r1: number;          // 행 범위(포함)
  r2: number;
  source?: string;     // repeat: PaperArray.name
  by?: string;         // groupHeader·groupFooter: 묶는 기준("lines.category")
  /**
   * groupHeader·groupFooter: **트리 배열에서 이 깊이의 묶음**이 끝날 때 발화한다(`by`의 형제).
   *
   * 트리에선 묶음 기준이 열이 아니라 **구조**다 — 「주방」 아래 상부장·옵션1·2가 딸린 걸
   * 말해 주는 열이 따로 없고, 깊이 1인 줄이 다시 나오는 것이 곧 앞 묶음의 끝이다.
   * 그래서 `by`(값이 같은 줄끼리)와 달리 `atLevel`은 **깊이 ≤ N인 줄에서 자른다**.
   *
   * 소계는 그 묶음에 **딸린 모든 줄**을 더한다(깊이와 무관하게 전부). 그래서 묶음을 여는 줄은
   * **자기 금액을 가지면 안 된다** — 그게 곧 소계라면 같은 수가 두 번 더해진다.
   * `groupHeader`가 있으면 그 줄은 구획 제목이 되어 반복에서 빠지므로 자연히 값 칸이 없어진다.
   */
  atLevel?: number;
  reprint?: boolean;   // columnHeader·groupHeader: 쪽 넘김 시 재출력(기본 true)
};

// ── 문서 ───────────────────────────────────────────────────────
export type PaperSpec = {
  id: string;
  name: string;
  columns: PaperColumns;
  orientation: PaperOrientation;
  /**
   * 쪽당 행 수(기본 42). 이 하나가 행 높이와 글자 크기를 함께 정한다 — `rowUnitOf` 참조.
   * 글자를 키우려면 이 수를 **줄인다**(42 → 31이면 본문이 10.5pt → 14pt).
   */
  pageRows?: number;
  fields: FieldSpec[];        // 문서 스코프 값(당사자·문서번호…)
  arrays?: PaperArray[];      // 반복 원본
  /**
   * 이미지 자리 이름(로고·직인·도면). `FieldSpec`에 이미지 타입이 없어서 따로 둔다 —
   * `FieldType`에 더하면 폼(FormSection)이 못 그리는 타입을 알게 되어 오염된다.
   */
  images?: string[];
  cells: PaperCell[];         // sparse
  rows?: PaperRow[];          // 1단위가 아닌 행만
  bands?: PaperBand[];
};

/** `"{{a}} ~ {{b}}"` 에서 이름만 뽑는다. 자리표시자 문법은 여기 한 곳에만 산다. */
export const PAPER_TAG = /\{\{\s*([^{}]+?)\s*\}\}/g;
export function paperTagNames(template: string): string[] {
  return [...template.matchAll(PAPER_TAG)].map((m) => m[1]);
}

// ── 검증 ───────────────────────────────────────────────────────
// "LLM/편집기가 뱉은 정의가 렌더러에 가기 전 관문"(buildZodSchema와 같은 자리).
export type PaperIssue = { path: string; message: string };

const BAND_LABEL: Record<PaperBandKind, string> = {
  pageHeader: '매 쪽 머리말', pageFooter: '매 쪽 꼬리말', columnHeader: '열 머리',
  groupHeader: '그룹 머리', repeat: '반복', groupFooter: '그룹 꼬리',
  groupRepeat: '묶음반복', summary: '합계',
};

export function validatePaper(spec: PaperSpec): PaperIssue[] {
  const issues: PaperIssue[] = [];
  const push = (path: string, message: string) => issues.push({ path, message });

  // 필드 이름 집합 — 셀이 가리킬 수 있는 전부.
  const scalar = new Set(spec.fields.map((f) => f.name));
  const arrays = new Map((spec.arrays ?? []).map((a) => [a.name, new Set(a.of.map((f) => f.name))]));
  const images = new Set(spec.images ?? []);
  // 깊이 열을 가진 배열 = 트리. 깊이 열이 그 배열에 실제로 있어야 한다 —
  //  없으면 모든 줄이 깊이 0으로 읽혀 들여쓰기도 묶음도 조용히 사라진다.
  const treeArrays = new Set<string>();
  (spec.arrays ?? []).forEach((a, i) => {
    if (!a.level) return;
    if (arrays.get(a.name)?.has(a.level)) treeArrays.add(a.name);
    else push(`arrays[${i}]`, `깊이 열 «${a.level}»이 배열 «${a.name}»에 없습니다`);
  });
  const knows = (path: string): boolean => {
    if (path.startsWith('@')) return (PAPER_SYSTEM_FIELDS as readonly string[]).includes(path);
    if (scalar.has(path) || images.has(path)) return true;
    const dot = path.indexOf('.');
    if (dot < 0) return false;
    const arr = arrays.get(path.slice(0, dot));
    return arr ? arr.has(path.slice(dot + 1)) : false;
  };

  // ① 범위 — 열을 벗어나는 셀은 렌더 시 조용히 잘린다.
  spec.cells.forEach((cell, i) => {
    const at = `cells[${i}]`;
    const cs = cell.cs ?? 1;
    const rs = cell.rs ?? 1;
    if (cell.r < 0 || cell.c < 0) push(at, '행·열은 0 이상이어야 합니다');
    if (cs < 1 || rs < 1) push(at, '병합 수는 1 이상이어야 합니다');
    if (cell.c + cs > spec.columns) {
      push(at, `열 범위를 벗어납니다 (${cell.c}+${cs} > ${spec.columns})`);
    }
    // ② 내용 배타 — 다섯 중 하나만.
    const filled = [cell.text, cell.field, cell.template, cell.image, cell.agg]
      .filter((x) => x != null).length;
    if (filled > 1) push(at, '글자·데이터·이어붙이기·이미지·집계는 한 칸에 하나만 놓습니다');
    // ③ 참조 무결성 — 없는 필드를 가리키는 칸은 인쇄물에서 빈칸으로 나간다.
    if (cell.field && !knows(cell.field)) push(at, `없는 필드를 가리킵니다: ${cell.field}`);
    if (cell.image && !knows(cell.image)) push(at, `없는 이미지를 가리킵니다: ${cell.image}`);
    if (cell.template) {
      paperTagNames(cell.template)
        .filter((n) => !knows(n))
        .forEach((n) => push(at, `없는 필드를 가리킵니다: ${n}`));
    }
    if (cell.agg) {
      const targets = Array.isArray(cell.agg.of) ? cell.agg.of : [cell.agg.of];
      targets.filter((t) => !knows(t)).forEach((t) => push(at, `집계 대상이 없습니다: ${t}`));
      if (cell.agg.fn === 'avg' && targets.length > 1) push(at, '평균은 대상이 하나여야 합니다');
    }
  });

  // ④ 겹침 0 — 같은 칸을 두 셀이 차지하면 렌더 결과가 정의되지 않는다.
  for (let i = 0; i < spec.cells.length; i++) {
    for (let j = i + 1; j < spec.cells.length; j++) {
      const a = spec.cells[i], b = spec.cells[j];
      const ar2 = a.r + (a.rs ?? 1) - 1, ac2 = a.c + (a.cs ?? 1) - 1;
      const br2 = b.r + (b.rs ?? 1) - 1, bc2 = b.c + (b.cs ?? 1) - 1;
      if (!(ar2 < b.r || a.r > br2 || ac2 < b.c || a.c > bc2)) {
        push(`cells[${i}]`, `cells[${j}]와 겹칩니다 (${a.r},${a.c})`);
      }
    }
  }

  // ⑤ 행 범위 이름표
  const bands = spec.bands ?? [];
  bands.forEach((b, i) => {
    const at = `bands[${i}]`;
    if (b.r2 < b.r1) push(at, '행 범위가 거꾸로입니다');
    if (b.kind === 'repeat') {
      if (!b.source) push(at, '반복은 원본 배열이 필요합니다');
      else if (!arrays.has(b.source)) push(at, `없는 배열을 가리킵니다: ${b.source}`);
    }
    if (b.kind === 'groupHeader' || b.kind === 'groupFooter') {
      // 묶는 기준은 둘 중 하나 — 값이 같은 줄끼리(`by`) 또는 트리의 깊이(`atLevel`).
      if (!b.by && b.atLevel == null) push(at, '그룹은 묶는 기준이 필요합니다');
      if (b.by && b.atLevel != null) push(at, '묶는 기준은 값(by)이나 깊이(atLevel) 하나만 씁니다');
      if (b.by) {
        if (!knows(b.by)) push(at, `없는 필드로 묶으려 합니다: ${b.by}`);
        // 묶을 대상이 없으면 그룹은 발화하지 않는다 — 같은 배열의 반복 구간이 있어야 한다.
        const arr = b.by.slice(0, b.by.indexOf('.'));
        if (!bands.some((x) => x.kind === 'repeat' && x.source === arr)) {
          push(at, `묶을 반복 구간이 없습니다: ${arr || '(배열 미지정)'}`);
        }
      }
      if (b.atLevel != null) {
        if (!Number.isInteger(b.atLevel) || b.atLevel < 1) push(at, '깊이는 1 이상의 정수입니다');
        // 깊이로 자르려면 원본이 트리여야 한다 — 아니면 이 밴드는 한 번도 발화하지 않는다.
        if (!bands.some((x) => x.kind === 'repeat' && treeArrays.has(x.source ?? ''))) {
          push(at, '깊이로 묶을 트리 반복 구간이 없습니다 — 「필드」 시트에서 깊이 열을 정하세요');
        }
      }
    }
    // 같은 종류가 겹치면 어느 쪽이 이기는지 정의되지 않는다(반복 안 그룹만 예외).
    bands.forEach((o, j) => {
      if (j <= i || o.kind !== b.kind) return;
      if (!(o.r2 < b.r1 || o.r1 > b.r2)) push(at, `${BAND_LABEL[b.kind]} 구간끼리 겹칩니다`);
    });
  });

  // ⑥ 걸침 칸 — 반복 구간 밖에는 «묶음»이라는 게 없어서 걸칠 대상이 없다(조용히 안 그려진다).
  const repeats = bands.filter((b) => b.kind === 'repeat');
  spec.cells.forEach((cell, i) => {
    if (cell.scope !== 'group') return;
    const at = `cells[${i}]`;
    if (!cell.field) push(at, '묶음에 걸치는 칸은 묶는 기준이 될 데이터 자리가 필요합니다');
    if (!repeats.some((b) => cell.r >= b.r1 && cell.r <= b.r2)) {
      push(at, '묶음에 걸치는 칸은 반복 구간 안에 있어야 합니다');
    }
  });

  // ⑦ 들여쓰는 칸 — 깊이를 아는 자리에만 산다. 아니면 밀 만큼이 없어 조용히 안 밀린다.
  spec.cells.forEach((cell, i) => {
    if (!cell.indent) return;
    const band = repeats.find((b) => cell.r >= b.r1 && cell.r <= b.r2);
    if (!band) push(`cells[${i}]`, '들여쓰는 칸은 반복 구간 안에 있어야 합니다');
    else if (!treeArrays.has(band.source ?? '')) {
      push(`cells[${i}]`, `«${band.source}»는 트리가 아닙니다 — 「필드」 시트에서 깊이 열을 정하세요`);
    }
  });

  // ⑧ 번호 붙이는 칸 — 묶음이 있어야 «몇 번째»가 성립한다. 구획 제목(그룹머리)이나 반복 안에만 산다.
  const numberable = bands.filter((b) => b.kind === 'repeat' || b.kind === 'groupHeader');
  spec.cells.forEach((cell, i) => {
    if (!cell.number) return;
    if (!numberable.some((b) => cell.r >= b.r1 && cell.r <= b.r2)) {
      push(`cells[${i}]`, '번호 붙이는 칸은 「그룹머리」나 「반복」 구간 안에 있어야 합니다');
    }
    if (!bands.some((b) => (b.kind === 'groupHeader' || b.kind === 'groupFooter')
      && (b.by || b.atLevel != null))) {
      push(`cells[${i}]`, '묶음이 없어 번호가 안 붙습니다 — 그룹 머리나 꼬리로 묶음을 정하세요');
    }
  });

  // ⑨ 행 높이
  (spec.rows ?? []).forEach((row, i) => {
    if (row.h < 1 || row.h > 6) push(`rows[${i}]`, '행 높이는 1~6 단위입니다');
  });

  return issues;
}

/** 값까지 포함한 관문 — 필수 필드가 서식 어디에도 안 놓였으면 인쇄물에서 조용히 빈칸이 된다. */
export function validatePaperCoverage(spec: PaperSpec): PaperIssue[] {
  const placed = new Set(
    spec.cells.flatMap((c) => [
      ...(c.field ? [c.field] : []),
      ...(c.image ? [c.image] : []),
      ...(c.template ? paperTagNames(c.template) : []),
    ]),
  );
  return spec.fields
    .filter((f) => f.required && !placed.has(f.name))
    .map((f) => ({ path: `fields.${f.name}`, message: `필수 값 «${f.label}»의 자리가 서식에 없습니다` }));
}
