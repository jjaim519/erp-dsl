// hierarchyImport — 엑셀 계층 등록표를 HierarchyExplorer 데이터로 바꾸는 순수 함수.
//  · 의존성 0 — 파일 해독(SheetJS 등)은 호출 측(소비 앱)이 하고, 여기엔 **「필드」와 「양식」 두 장**이
//    행 배열로 들어온다. 계층 등록표도 문서 서식과 **같은 세 시트**(양식·필드·안내)를 쓰기 때문이다.
//
//  · **열의 뜻은 「필드」 시트가 말한다.** 전에는 헤더에 `면적(숫자)`처럼 괄호로 박아 두고
//    「헤더 글자는 바꾸지 마세요」라고 경고했는데, 그건 *사람이 읽는 이름*과 *기계가 읽는 계약*을
//    한 칸에 욱여넣은 것이었다. 이제 헤더는 이름이고 종류는 「필드」에 있다.
//
//  · 역할도 전부 종류로 선언한다 — 전에는 「품목명」이 코드에 박혀 있고 부제·배지·썸네일이
//    *열 이름*으로 고정돼 있었다(그 이름을 바꾸면 조용히 안 잡혔다). 이제 이름은 자유다:
//
//      분류    폴더 단계. **선언 순서가 곧 깊이**라 몇 개를 두든 그만큼 깊어진다
//      이름    품목의 제목(필수·하나)
//      부제 · 배지 · 배지색 · 썸네일    ObjectCard 역할 슬롯
//      그 밖(글자·숫자·금액·날짜·퍼센트·예아니오)    값. **첫 번째가 핵심값**, 나머지는 보조
//
//  · 산출: { nodes(TreeNodeData[]), objectsByPath } — 익스플로러 selectedId(=경로)로 조회한다.
import type { TreeNodeData } from './Tree';
import type { HierarchyObject } from './HierarchyExplorer';
import type { CellType, BadgeColor } from './_cells';

const SEP = '>';   // 트리 노드 id 표기용 구분자(사용자는 칸으로 입력, 문법 노출 없음)

// 한글 입력값 → 내부 토큰(비전공자 친화: 표에는 한글만 보인다).
const TONE_KO: Record<string, BadgeColor> = { 성공: 'success', 경고: 'warning', 위험: 'danger', 정보: 'info', 기본: 'neutral' };
const TYPE_KO: Record<string, CellType> = { 숫자: 'number', 금액: 'currency', 날짜: 'date', 퍼센트: 'percent', 예아니오: 'boolean', 글자: 'text', 텍스트: 'text' };

/** 「필드」 시트 한 줄. `name`이 「양식」 헤더와 같아야 한다(문서 서식에서 이름이 태그와 같아야 하는 것과 같은 규칙). */
export type HierarchyField = {
  name: string;
  label?: string;
  /** 분류 · 이름 · 부제 · 배지 · 배지색 · 썸네일 · 글자 · 숫자 · 금액 · 날짜 · 퍼센트 · 예아니오 */
  type: string;
  required?: boolean;
};

export type HierarchyImport = {
  nodes: TreeNodeData[];
  objectsByPath: Record<string, HierarchyObject[]>;
};

const pathId = (segs: string[]) => segs.join(` ${SEP} `); // ["현장","강남 현장"] → "현장 > 강남 현장"

// 경로(세그먼트 배열) 목록 → 중첩 트리. id=정규화 경로, label=마지막 segment.
function buildTree(paths: string[][]): TreeNodeData[] {
  const root: TreeNodeData[] = [];
  const seen = new Map<string, TreeNodeData>();
  for (const segs of paths) {
    let level = root;
    const acc: string[] = [];
    for (const seg of segs) {
      acc.push(seg);
      const key = pathId(acc);
      let node = seen.get(key);
      if (!node) { node = { id: key, label: seg, children: [] }; seen.set(key, node); level.push(node); }
      level = node.children!;
    }
  }
  return root;
}

// 셀 타입에 맞춰 값 정규화(숫자류는 number로). 표시 포맷은 renderCell이 담당.
function coerce(v: unknown, type: CellType): unknown {
  const s = String(v ?? '').trim();
  if (s === '') return '';
  if (type === 'number' || type === 'currency' || type === 'percent') {
    const n = Number(s.replace(/,/g, ''));
    return Number.isNaN(n) ? s : n;
  }
  if (type === 'boolean') return /^(true|y|yes|예|o|1)$/i.test(s);
  return s;
}

/**
 * @param fields 「필드」 시트 — 열의 뜻
 * @param rows   「양식」 시트 — 0행=헤더(=필드 이름), 1행~=데이터
 *
 * · 폴더 경로는 「분류」 열을 선언 순서대로 채운 만큼(빈 칸에서 멈춘다).
 * · 「이름」이 비면 그 줄은 **빈 폴더만** 만든다. 폴더가 하나도 없는 줄(미아)은 버린다.
 */
export function buildHierarchyFromRows(fields: HierarchyField[], rows: unknown[][]): HierarchyImport {
  const objectsByPath: Record<string, HierarchyObject[]> = {};
  const paths: string[][] = [];
  if (!fields.length || rows.length < 1) return { nodes: [], objectsByPath };

  // 헤더로 열 위치를 찾는다 — 사용자가 열 순서를 바꿔도 「필드」의 이름이 짝을 잡아준다.
  const head = (rows[0] ?? []).map((c) => String(c ?? '').trim());
  const col = new Map(fields.map((f) => [f.name, head.indexOf(f.name)]));
  const missing = fields.filter((f) => (col.get(f.name) ?? -1) < 0).map((f) => f.name);
  if (missing.length) {
    throw new Error(`「양식」 시트 헤더에서 못 찾은 열: ${missing.join(' · ')} — 「필드」 시트의 «이름»과 같아야 합니다.`);
  }

  const of = (t: string) => fields.filter((f) => f.type === t);
  const folders = of('분류');
  const titleField = of('이름')[0];
  if (!titleField) throw new Error('「필드」 시트에 종류가 「이름」인 줄이 있어야 합니다 — 품목의 제목이 될 열입니다.');

  const idx = (f?: HierarchyField) => (f ? col.get(f.name)! : -1);
  const subIdx = idx(of('부제')[0]);
  const badgeIdx = idx(of('배지')[0]);
  const toneIdx = idx(of('배지색')[0]);
  const thumbIdx = idx(of('썸네일')[0]);

  // 값 열 — 역할이 아닌 것들. **선언 순서가 곧 카드의 정보 위계**다(첫 번째가 핵심값).
  const ROLES = new Set(['분류', '이름', '부제', '배지', '배지색', '썸네일']);
  const valueCols = fields
    .filter((f) => !ROLES.has(f.type))
    .map((f) => ({ i: col.get(f.name)!, label: f.label || f.name, type: TYPE_KO[f.type] ?? 'text' }));

  const at = (row: unknown[], i: number) => (i < 0 ? '' : String(row[i] ?? '').trim());

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    // 폴더 경로 — 선언 순서로 채운 칸을 모으되 빈 칸에서 멈춘다(중간 공백은 끝으로 본다).
    const segs: string[] = [];
    for (const f of folders) { const v = at(row, col.get(f.name)!); if (!v) break; segs.push(v); }
    if (!segs.length) continue;                  // 폴더 없는 줄(빈 줄·미아 품목) 버림
    paths.push(segs);                            // 품목이 없어도 폴더는 세운다
    const title = at(row, col.get(titleField.name)!);
    if (!title) continue;                        // 폴더만 만드는 줄

    const path = pathId(segs);
    const badgeLabel = at(row, badgeIdx);
    const dyn = valueCols
      .map((c) => ({ label: c.label, type: c.type, value: coerce(row[c.i], c.type) }))
      .filter((f) => f.value !== '' && f.value != null);
    const [headline, ...attributes] = dyn;

    (objectsByPath[path] ??= []).push({
      id: `${path}#${r}`,
      title,
      subtitle: at(row, subIdx) || undefined,
      status: badgeLabel ? { label: badgeLabel, tone: TONE_KO[at(row, toneIdx)] ?? 'neutral' } : undefined,
      thumbnail: at(row, thumbIdx) || undefined,
      headline,
      attributes: attributes.length ? attributes : undefined,
    });
  }

  return { nodes: buildTree(paths), objectsByPath };
}
