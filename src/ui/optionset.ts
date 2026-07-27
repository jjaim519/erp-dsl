// optionset — OptionSet 공유 타입. 저작 면(OptionSetEditor)이 "쓰고" 선택 면(OptionSetPicker)이 "읽는" 단일 계약.
//  · 두 면이 이 파일 하나를 import한다 — 변환 계층 금지(핸드오프 §4)의 물리적 강제. Editor가 만든 그대로 Picker가 읽는다.
//  · 도메인 무지(헌법 1): 어떤 업의 무엇인지 모른다 — "선택지 묶음"과 "선택 상태"의 기하만 정의한다.
//    section·label·group 전부 소비처가 주입하는 표시 문자열. meta 자루·탈출구 없음(§1-(d)-5).

/** 값 하나. 단일선택의 후보이자 수량선택의 행. */
export type Choice = {
  id: string;
  code: string;        // 안정 키(소비처의 의미 코드) — 단일선택 값 식별(id와 별개)
  label: string;
  sublabel?: string;
  group?: string;      // 값 묶음 라벨 — 있으면 접이 그룹 헤더로 묶인다
  amount?: number;     // 표시 금액 — 부품은 이 값을 만들지도, 계산하지도 않는다(§6)
  // ── 저작 필드(선택 면은 읽지 않는다) — §2 값 행이 편집하는 규칙의 저장처.
  //    값 행 UI(InheritedValueField·ExpressionField·KeyValueField)가 onChange(groups) 하나로
  //    왕복하려면 값이 이 필드들을 들고 있어야 한다. 전부 도메인 중립어(해당 부품들의 기존 어휘).
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

/** 선택지 묶음 하나 = 이 모델의 원자. */
export type OptionGroup = {
  id: string;
  label: string;
  section?: string;    // 표시용 묶음 헤더(자유 문자열) — 같은 값끼리 한 섹션에 모인다
  note?: string;       // 헤더 우측 부가 표기(단위 등)
  required?: boolean;  // single에만 유의미 — 미선택 시 하단 CTA 잠금
  ratio?: number;      // 그룹 배율(곱, 기본 1) — 값 레벨 ratio의 상위 대응. 적용은 소비처 파이프라인
  selection: 'single' | 'quantity' | 'number';
  choices?: Choice[];      // selection = 'single' | 'quantity'
  fields?: NumberField[];  // selection = 'number'
};

export type OptionSet = OptionGroup[];

/** 선택 상태 — 세 축. selection 종류와 1:1. */
export type OptionSelection = {
  picked: Record<string, string>;  // groupId  → choice.code    (single)
  qty: Record<string, number>;     // choice.id → 수량(0=미선택)  (quantity)
  nums: Record<string, number>;    // field.key → 값             (number)
};
