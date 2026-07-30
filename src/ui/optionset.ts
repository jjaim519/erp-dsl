// optionset — OptionSet 공유 타입. 저작 면(OptionSetEditor)이 "쓰고" 선택 면(OptionSetPicker)이 "읽는" 단일 계약.
//  · 두 면이 이 파일 하나를 import한다 — 변환 계층 금지(핸드오프 §4)의 물리적 강제. Editor가 만든 그대로 Picker가 읽는다.
//  · 도메인 무지(헌법 1): 어떤 업의 무엇인지 모른다 — "선택지 묶음"과 "선택 상태"의 기하만 정의한다.
//    section·label·group 전부 소비처가 주입하는 표시 문자열. meta 자루·탈출구 없음(§1-(d)-5).
//  · R2(2026-07-28) 반영: selection 'multi' + pickedMany 축 / Choice.unit(수량 행 단위) / Choice.image 자리 예약.

/** 값 하나. 단일·복수 택의 후보이자 수량선택의 행. */
export type Choice = {
  id: string;
  code: string;        // 안정 키(소비처의 의미 코드) — 택 값 식별(id와 별개). Editor가 만든 값은 code=id로 시작
  label: string;
  sublabel?: string;
  group?: string;      // 값 묶음 라벨 — 구획 밴드(기본) 또는 규모 초과 시 필터 칩. 계약은 bundleBlocks 주석 참조
  amount?: number;     // 표시 금액 — 부품은 이 값을 만들지 않는다(§6). 예외: 행 소계(amount × 수량)는 표시 산술로 허용
  unit?: string;       // 수량 행 우측 단위(EA·M 등) — 단위는 그룹이 아니라 행의 속성(R2 A-4)
  image?: string;      // 자리 예약(R2 §6-5 — 스와치 실수요 확인) — 렌더는 백로그, 소비처 데이터 선행 필요
  hidden?: boolean;    // 사용 안 함 — 삭제 대신 봉인(기존 선택 데이터 보존). 선택 면은 렌더에서 제외한다
  // ── 저작 필드(선택 면은 읽지 않는다) — §2 값 행이 편집하는 규칙의 저장처.
  refId?: string | null;            // 참조(SSOT) — InheritedValueField
  override?: number;                // 직접 입력 값(0 = 상속)
  ratio?: number;                   // 값 레벨 배율 — 그룹 ratio와 2층. 부품은 두 배율을 곱하지 않는다(§6-1)
  formula?: string;                 // 수량식 — ExpressionField
  adjust?: Record<string, number>;  // 보정 맵 — KeyValueField
};

/** 수치 입력 하나. */
export type NumberField = {
  key: string;
  label: string;
  value: number;       // 기본값
  unit?: string;
  min?: number;
  max?: number;
  step?: number;       // 증분 — undefined는 1로 취급(계약 정정 2026-07-27). 검증은 입력기가 흡수한다
};

/** 문구 입력 하나 — selection 'text'의 행(2026-07-29 신설). */
export type TextField = {
  key: string;
  label: string;
  placeholder?: string;  // 입력칸에 흐리게 보일 안내 — 없으면 없음
};

/** 선택지 묶음 하나 = 이 모델의 원자. */
export type OptionGroup = {
  id: string;
  label: string;
  section?: string;    // 표시용 묶음 헤더(자유 문자열) — 같은 값끼리 한 섹션에 모인다
  note?: string;       // 헤더 우측 부가 표기
  required?: boolean;  // 전 선택형 공통 — 0건(문구·수치는 빈 입력칸 존재)이면 미충족(R2 A-2로 일반화)
  ratio?: number;      // 그룹 배율(곱, 기본 1) — 값 레벨 ratio의 상위 대응. 적용은 소비처 파이프라인
  selection: 'single' | 'multi' | 'quantity' | 'number' | 'text';
  choices?: Choice[];      // selection = 'single' | 'multi' | 'quantity'
  fields?: NumberField[];  // selection = 'number'
  texts?: TextField[];     // selection = 'text'
};

export type OptionSet = OptionGroup[];

/** 값묶음(Choice.group) 계약과 그 유일한 구현 — 두 면이 이 함수 하나를 통해 묶음을 읽는다.
 *
 *  ── 계약(R5 2026-07-30 확정) ──
 *   1. **정렬 책임은 부품이 진다.** 소비처는 값 순서를 자유롭게 준다 — 같은 묶음이 흩어져 와도 된다.
 *      (소비처의 정렬 축은 보통 "운영자가 값을 붙인 순서" 하나뿐이라, 그 축으로 묶음 연속까지 만족시킬 수 없다.
 *       밴드가 "이 아래 전부가 이 묶음"이라고 선언하는 장치이므로 그 전제도 선언한 쪽이 세운다.)
 *   2. **안정 정렬**: 묶음의 첫 등장 순서 유지 · 묶음 안 원래 순서 유지. 순서를 바꾸는 게 아니라 흩어진 것만 모은다.
 *   3. **무묶음은 밴드 없는 선두 블록**. 어떤 밴드 아래에도 놓이지 않는다 — 놓이면 그 밴드의 선언이 거짓이 된다.
 *   4. `group`은 **라벨 한 겹**이다. 이름이 같은 서로 다른 분류는 한 묶음으로 합쳐진다(화면에서 구분 불가 = 데이터 정리 대상).
 *   5. 표현: 묶음은 구획 밴드로 나타난다 — 본문 기하(카드·2열·목록)와 **직교**한다(블록마다 그 기하가 반복).
 *      값이 많으면 선택 면이 밴드 대신 필터 칩으로 전환한다. 단, `display` override로 'segmented'·'select'를
 *      지정하면 단일 컨트롤이라 묶음을 표현할 수 없다 — 그때의 소실은 소비처의 명시적 선택이다.
 */
export function bundleBlocks(choices: Choice[]): { band?: string; items: Choice[] }[] {
  const anon: Choice[] = [];
  const order: string[] = [];
  const bands = new Map<string, Choice[]>();
  for (const c of choices) {
    if (!c.group) { anon.push(c); continue; }
    if (!bands.has(c.group)) { bands.set(c.group, []); order.push(c.group); }
    bands.get(c.group)!.push(c);
  }
  const out: { band?: string; items: Choice[] }[] = anon.length ? [{ items: anon }] : [];
  for (const band of order) out.push({ band, items: bands.get(band)! });
  return out;
}

/** 묶음 라벨 목록 — 첫 등장 순서(bundleBlocks와 같은 규율). 필터 칩의 순서이자 존재 판정. */
export const bundleLabels = (choices: Choice[]): string[] =>
  bundleBlocks(choices).map((b) => b.band).filter((b): b is string => b != null);

/** 구성 트리 노드 — OptionSetComposer(부착 면)의 원자. 소비처 데이터(도메인 무지: label은 표시 문자열).
 *  kind 'branch'=묶기 전용(부착 불가·펼침/접힘), 'leaf'=옵션 부착 단위(어느 깊이에나 — 루트 직결 가능).
 *  attach = OptionGroup id 참조 배열이자 그 노드의 노출 순서(순서는 부착의 속성 — 라이브러리가 아님, Square 모델). */
export type OptionNode = {
  id: string;
  label: string;
  kind: 'branch' | 'leaf';
  attach: string[];
  children?: OptionNode[];
};

/** 선택 상태 — 축은 selection 종류와 1:1. pickedMany는 'multi' 도입(R2 A-1)에 따른 4번째 축(하위호환 위해 optional). */
export type OptionSelection = {
  picked: Record<string, string>;        // groupId  → choice.code     (single)
  qty: Record<string, number>;           // choice.id → 수량(0=미선택)   (quantity)
  nums: Record<string, number>;          // field.key → 값              (number)
  pickedMany?: Record<string, string[]>; // groupId  → choice.code[]   (multi)
  texts?: Record<string, string>;        // textField.key → 입력 문구   (text — optional 축, pickedMany 전례)
};
