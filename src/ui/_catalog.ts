// ─────────────────────────────────────────────────────────────────────────
// _catalog.ts — 어휘 카탈로그 (LLM 조립 계약 #2의 직렬화 가능 데이터 씨앗)
//
//  · 공개 배럴(index.ts)이 노출하는 "사용자가 볼 수 있는 모든 부품"을 한곳에 나열한다.
//  · 각 부품 = { 계층, 역할, 닫힌 props(enum/토큰), 구성요소(분자↑만) }.
//  · 구성요소(composition)는 각 부품 파일의 실제 import에서 추출한 실측이다 — 손으로 추정한 값이 아니라
//    "그 파일이 무엇으로 조립되었는가"의 사실. (import가 곧 단일 진실 → 카탈로그 드리프트 차단.)
//  · 토큰 항목은 헤더 주석·구현에 근거한 "그 부품이 소비하는 토큰/역할 변수"를 큐레이션한 것.
//  · dev 전용. publish 대상 아님(.npmignore의 _* 제외 규칙). 부품이 아니라 부품을 "설명하는" 데이터.
// ─────────────────────────────────────────────────────────────────────────

export type Layer =
  | '의미 원자' | '레이아웃 원자' | '배치 프리미티브'
  | '분자' | '유기체' | '템플릿';

export type PropKind = '스타일' | '콘텐츠' | '기능' | '값';

export type PropSpec = {
  name: string;
  kind: PropKind;
  values: string;   // 닫힌 enum/토큰/타입 (사용자가 고를 수 있는 선택지)
};

// 분자 이상의 "무엇으로 조립되었나" — 계층별로 분해. 값은 부품명(혹은 토큰/공유 헬퍼).
export type Composition = {
  토큰?: string[];
  '의미 원자'?: string[];
  '레이아웃 원자'?: string[];
  '배치 프리미티브'?: string[];
  분자?: string[];
  유기체?: string[];
  템플릿?: string[];
  공유?: string[];   // _cells / _masks / _fieldStyles 등 격리 구역 공유 모듈
};

export type CatalogEntry = {
  name: string;
  layer: Layer;
  role: string;            // 한 줄 역할
  props: PropSpec[];
  composition?: Composition; // 분자 이상만
};

// 공통 enum 약어(중복 줄이기용 — 표에는 풀어서 적는다)
const ROLE_TEXT = "'primary' | 'secondary' | 'danger'";
const BADGE = "'neutral' | 'success' | 'warning' | 'danger' | 'info'";
const SIZE2 = "'sm' | 'md'";
const SIZE3 = "'sm' | 'md' | 'lg'";

// 의미 원자의 하위 분류(뷰 그룹핑 단일 출처) — 입력군 vs 표시·행동. 새 입력 원자는 여기 한 곳에 등록.
export const INPUT_ATOMS: ReadonlySet<string> = new Set([
  'TextInput', 'PasswordInput', 'NumberInput', 'CurrencyInput', 'Textarea', 'Select', 'Combobox',
  'Radio', 'Checkbox', 'Switch', 'DatePicker', 'MultiDatePicker', 'TimePicker',
]);

export const CATALOG: CatalogEntry[] = [
  // ── 의미 원자 — 표시·행동 ─────────────────────────────────────────────
  { name: 'Button', layer: '의미 원자', role: '클릭 행동의 기본 단위. variant가 색·강조를 닫는다.',
    props: [
      { name: 'variant', kind: '스타일', values: "'primary' | 'secondary' | 'danger' | 'ghost'" },
      { name: 'size', kind: '스타일', values: SIZE2 },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode (텍스트/아이콘)' },
      { name: 'leftIcon / rightIcon', kind: '콘텐츠', values: 'ReactNode(아이콘)' },
      { name: 'loading / disabled / fullWidth', kind: '스타일', values: 'boolean' },
      { name: 'type', kind: '기능', values: "'button' | 'submit'" },
      { name: 'onClick', kind: '기능', values: '() => void' },
    ] },
  { name: 'Badge', layer: '의미 원자', role: '표시 전용 상태 알약(행동 없음).',
    props: [
      { name: 'color', kind: '스타일', values: BADGE + ' (primary 제외)' },
      { name: 'children', kind: '콘텐츠', values: 'string' },
    ] },
  { name: 'CountBadge', layer: '의미 원자', role: '알림 카운트(미처리 건수) — 카톡식 빨강 N 동그라미. 솔리드 채움(행동요구 환기). Badge(상태·반투명)와 별개 역할.',
    props: [
      { name: 'count', kind: '값', values: 'number (0 이하면 안 보임)' },
      { name: 'tone', kind: '스타일', values: "'danger'(기본=행동요구) | 'neutral'(정보 카운트)" },
      { name: 'max', kind: '값', values: 'number (초과시 "N+", 기본 99)' },
      { name: 'dot', kind: '스타일', values: 'boolean (숫자 없이 점만)' },
    ] },
  { name: 'Chip', layer: '의미 원자', role: '행동 있는 알약(선택/삭제). controlled.',
    props: [
      { name: 'color', kind: '스타일', values: BADGE + ' + neutral + primary' },
      { name: 'selected', kind: '기능', values: 'boolean (controlled)' },
      { name: 'onChange', kind: '기능', values: '() => void (클릭 신호)' },
      { name: 'onRemove', kind: '기능', values: '() => void (있으면 X 노출)' },
      { name: 'variant', kind: '스타일', values: "'value'(기본 — 사용자가 넣은 값, 채움·✕, 필드 안에 산다) | 'suggest'(제품이 내민 빠른 길, 아웃라인·가벼움). M3 input/suggestion chip 구분 — 둘이 한 화면에 있으면 형태로 갈라야 '같은 게 두 번'으로 안 읽힌다" },
      { name: 'children', kind: '콘텐츠', values: 'string' },
    ] },
  { name: 'Text', layer: '의미 원자', role: '본문 텍스트(3단계). 색 역할 노출(에러·보조 실수요).',
    props: [
      { name: 'variant', kind: '스타일', values: "'body' | 'body-strong' | 'caption'" },
      { name: 'color', kind: '스타일', values: ROLE_TEXT },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode' },
    ] },
  { name: 'Title', layer: '의미 원자', role: '제목 텍스트(3단계). 색은 text.primary 고정.',
    props: [
      { name: 'variant', kind: '스타일', values: "'display' | 'heading' | 'subheading'" },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode' },
    ] },
  { name: 'Label', layer: '의미 원자', role: '무언가의 이름표. 항상 짝이 있음(body-strong 고정).',
    props: [
      { name: 'children', kind: '콘텐츠', values: 'ReactNode' },
      { name: 'htmlFor', kind: '기능', values: 'string (짝 연결)' },
    ] },
  { name: 'Anchor', layer: '의미 원자', role: '이동 의미 고유(Button으로 대체 불가).',
    props: [
      { name: 'href', kind: '콘텐츠', values: 'string' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode' },
    ] },
  { name: 'Icon', layer: '의미 원자', role: 'SVG 아이콘(85종). baseline 광학보정 내장.',
    props: [
      { name: 'name', kind: '콘텐츠', values: 'IconName (85종 enum)' },
      { name: 'size', kind: '스타일', values: SIZE3 },
      { name: 'color', kind: '스타일', values: ROLE_TEXT },
    ] },
  { name: 'Avatar', layer: '의미 원자', role: '사람 식별 원형(이니셜 폴백). 고정 종횡비.',
    props: [
      { name: 'src', kind: '콘텐츠', values: 'string' },
      { name: 'children', kind: '콘텐츠', values: 'string (이니셜)' },
      { name: 'size', kind: '스타일', values: SIZE3 },
    ] },
  { name: 'Image', layer: '의미 원자', role: '콘텐츠 이미지 고정 종횡비 박스(명시 예외=고정치수).',
    props: [
      { name: 'src / alt', kind: '콘텐츠', values: 'string (alt 필수)' },
      { name: 'fallbackSrc', kind: '콘텐츠', values: 'string' },
      { name: 'fit', kind: '스타일', values: "'cover' | 'contain'" },
      { name: 'radius', kind: '값', values: "'sm' | 'md' | 'full'" },
      { name: 'size', kind: '스타일', values: SIZE3 },
    ] },
  { name: 'Tooltip', layer: '의미 원자', role: 'hover 텍스트 설명(위치 자동).',
    props: [
      { name: 'label', kind: '콘텐츠', values: 'string' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode (감쌀 대상)' },
    ] },
  { name: 'Popover', layer: '의미 원자', role: 'Tooltip의 클릭·슬롯 형제. content=raw 슬롯(부품).',
    props: [
      { name: 'children', kind: '콘텐츠', values: 'ReactNode (trigger)' },
      { name: 'content', kind: '콘텐츠', values: 'ReactNode (@/ui 부품 슬롯)' },
      { name: 'opened', kind: '기능', values: 'boolean (controlled)' },
      { name: 'onChange', kind: '기능', values: '(opened: boolean) => void' },
      { name: 'position', kind: '스타일', values: "'top' | 'bottom' | 'left' | 'right'" },
      { name: 'align', kind: '스타일', values: "'start' | 'center'(기본) | 'end' (start=트리거 시작모서리 정렬, 드롭다운형)" },
      { name: 'reposition', kind: '스타일', values: "'flip'(기본) | 'fixed'(flip off·shift만 → 화면 안 유지) | 'anchored'(flip·shift 둘 다 off → 좌상단 앵커 완전 고정, 오른쪽·아래로만 성장·점프 0, 다단 컬럼용)" },
      { name: 'width', kind: '값', values: "'sm' | 'md' | 'lg' | 'xl' | 'auto' (auto=내용폭 — 컬럼 수 따라 동적, MillerColumns 다단용)" },
      { name: 'block', kind: '스타일', values: 'boolean (기본 false=inline-flex. true=트리거 width:100%·min-width:0 → 소비처 폭에 맞춰 줄어듦, 트리거 안 말줄임용)' },
    ] },
  { name: 'Spinner', layer: '의미 원자', role: '영역/페이지 로딩(Button loading과 별개).',
    props: [{ name: 'size', kind: '스타일', values: SIZE3 }] },
  { name: 'Skeleton', layer: '의미 원자', role: '로드 전 자리표시(형태 보존). 레이아웃 부품 안에 박아 실제 구조를 흉내냄.',
    props: [
      { name: 'variant', kind: '스타일', values: "'text' | 'block' | 'circle'" },
      { name: 'lines', kind: '값', values: 'number (text 전용, 기본 3)' },
      { name: 'size', kind: '스타일', values: SIZE3 + ' (circle 지름/block 높이)' },
      { name: 'radius', kind: '스타일', values: "'sm' | 'md'" },
    ] },
  { name: 'Combobox', layer: '의미 원자', role: '검색되는 단일 선택(Select의 searchable 형제). 대용량 옵션 타이핑 필터.',
    props: [
      { name: 'options', kind: '기능', values: '{ label, value }[]' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, string | null' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'clearable', kind: '기능', values: 'boolean (기본 true)' },
      { name: 'size', kind: '스타일', values: SIZE2 },
    ] },
  { name: 'Progress', layer: '의미 원자', role: '결정형 진행률(0~100). 끝 모르는 로딩은 Spinner.',
    props: [
      { name: 'value', kind: '값', values: 'number (0~100)' },
      { name: 'tone', kind: '스타일', values: "'primary' | 'success' | 'warning' | 'danger'" },
      { name: 'size', kind: '스타일', values: SIZE3 },
    ] },
  { name: 'TimePicker', layer: '의미 원자', role: '시각 입력(HH:MM). 날짜=DatePicker와 별개 축.',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'controlled, "HH:MM"' },
      { name: 'size', kind: '스타일', values: SIZE2 },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
    ] },
  { name: 'SegmentedControl', layer: '의미 원자', role: '같은 대상의 뷰/모드 토글(즉시 전환, 비제출).',
    props: [
      { name: 'options', kind: '기능', values: '{ label, value }[]' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
      { name: 'fullWidth / disabled', kind: '스타일', values: 'boolean' },
    ] },
  { name: 'TabBar', layer: '의미 원자', role: '다른 구획으로 전환(대상 자체가 바뀜).',
    props: [
      { name: 'options', kind: '기능', values: '{ label, value, count?: number, countTone?: danger|neutral }[] (count=탭별 미처리 건수 → CountBadge)' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, string(활성 키)' },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
    ] },

  // ── 의미 원자 — 입력군 ────────────────────────────────────────────────
  { name: 'TextInput', layer: '의미 원자', role: '한 줄 텍스트 입력. controlled.',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'controlled, string' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
      { name: 'name', kind: '기능', values: 'string (폼 배선)' },
    ] },
  { name: 'PasswordInput', layer: '의미 원자', role: '가림 입력 + 가시성 토글.',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'controlled, string' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
    ] },
  { name: 'NumberInput', layer: '의미 원자', role: '숫자 입력(min/max는 스키마로).',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'controlled, number | string' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
    ] },
  { name: 'CurrencyInput', layer: '의미 원자', role: '돈 입력 전용(₩ prefix + 천단위 콤마, 무소수). NumberInput의 형제 — 옵션 대신 named 부품. 값은 순수 number(표시만 ₩·콤마, 다운스트림은 fmtCurrency).',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'controlled, number | string' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
    ] },
  { name: 'Textarea', layer: '의미 원자', role: '여러 줄 입력(autosize).',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'controlled, string' },
      { name: 'autosize', kind: '스타일', values: 'boolean' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
    ] },
  { name: 'Select', layer: '의미 원자', role: '단일 선택 드롭다운(searchable 끔).',
    props: [
      { name: 'options', kind: '기능', values: '{ label, value }[]' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, string | null' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
    ] },
  { name: 'DatePicker', layer: '의미 원자', role: '단일 날짜 선택(범위는 분자로).',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'controlled, string | null (ISO)' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
    ] },
  { name: 'MultiDatePicker', layer: '의미 원자', role: '여러 개별 날짜(집합 string[]). DatePicker 형제.',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'controlled, string[]' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
    ] },
  { name: 'Checkbox', layer: '의미 원자', role: '단일 on/off + 인라인 라벨.',
    props: [
      { name: 'checked / onChange', kind: '기능', values: 'controlled, boolean' },
      { name: 'label', kind: '콘텐츠', values: 'string (인라인)' },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
    ] },
  { name: 'Switch', layer: '의미 원자', role: '알약 토글(트랙 full 고정).',
    props: [
      { name: 'checked / onChange', kind: '기능', values: 'controlled, boolean' },
      { name: 'label', kind: '콘텐츠', values: 'string (인라인)' },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
    ] },
  { name: 'Radio', layer: '의미 원자', role: '그룹 단일 선택(배열 방향은 프리미티브 몫).',
    props: [
      { name: 'options', kind: '기능', values: '{ label, value }[]' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, string' },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
    ] },

  // ── 레이아웃 원자 ─────────────────────────────────────────────────────
  { name: 'Card', layer: '레이아웃 원자', role: '그릇·그림자. 자식을 담음.',
    props: [
      { name: 'variant', kind: '스타일', values: "'elevated' | 'outlined' | 'flat'" },
      { name: 'padding', kind: '값', values: "'none' | 'sm' | 'md' | 'lg'" },
      { name: 'fill', kind: '스타일', values: 'boolean (부모 높이 채움)' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode' },
    ] },
  { name: 'Divider', layer: '레이아웃 원자', role: '구분선(보더 토큰 1px).',
    props: [{ name: 'orientation', kind: '스타일', values: "'horizontal' | 'vertical'" }] },
  { name: 'Container', layer: '레이아웃 원자', role: '콘텐츠 폭 천장 + 가운데 정렬. 폭의 유일한 출발점.',
    props: [
      { name: 'maxWidth', kind: '값', values: "'narrow' | 'default' | 'wide'" },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode' },
    ] },

  // ── 배치 프리미티브 ───────────────────────────────────────────────────
  { name: 'Stack', layer: '배치 프리미티브', role: '세로 배열. 간격 토큰 소비.',
    props: [
      { name: 'gap', kind: '값', values: '간격 토큰 (기본 md)' },
      { name: 'align', kind: '스타일', values: "'start' | 'center' | 'end' | 'stretch'" },
      { name: 'justify', kind: '스타일', values: "'start' | 'center' | 'end' | 'between'" },
    ] },
  { name: 'Group', layer: '배치 프리미티브', role: '가로 배열(내용 크기대로 흐름).',
    props: [
      { name: 'gap', kind: '값', values: '간격 토큰 (기본 md)' },
      { name: 'align', kind: '스타일', values: "'start' | 'center' | 'end' (기본 center)" },
      { name: 'justify', kind: '스타일', values: "'start' | 'center' | 'end' | 'between'" },
      { name: 'wrap', kind: '스타일', values: 'boolean' },
    ] },
  { name: 'Grid', layer: '배치 프리미티브', role: '격자(비율 지정). Grid.Col span으로 비대칭 분할.',
    props: [
      { name: 'columns', kind: '값', values: '1 | 2 | 3 | 4 | 6 | 12 (12의 약수)' },
      { name: 'gap', kind: '값', values: '간격 토큰' },
      { name: 'equalRows', kind: '스타일', values: 'boolean (행 높이 균등)' },
      { name: 'Grid.Col span', kind: '값', values: '1~12' },
    ] },
  { name: 'Bento', layer: '배치 프리미티브', role: '페이지 본문 격자 — 위젯이 정수 칸 점유(iOS 홈/Bento). 셀 고정(가변 높이 불허)·크기 변주가 위계.',
    props: [
      { name: 'columns', kind: '값', values: '2 | 3 | 4 | 6 | 12 (닫힌 열 수)' },
      { name: 'gap', kind: '값', values: "'sm' | 'md' | 'lg'" },
      { name: 'Bento.Tile colSpan', kind: '값', values: '1..columns (위젯 가로 칸)' },
      { name: 'Bento.Tile rowSpan', kind: '값', values: '1 | 2 | 3 (고정 타일 세로 칸)' },
    ] },

  // ── 분자 (11) — 구성요소 표시 ────────────────────────────────────────
  { name: 'FormField', layer: '분자', role: '입력 원자에서 벗긴 장식·에러의 수령자(방식 A).',
    props: [
      { name: 'label', kind: '콘텐츠', values: 'string' },
      { name: 'withAsterisk', kind: '스타일', values: 'boolean (별표 표시만)' },
      { name: 'error', kind: '콘텐츠', values: 'string (있으면 에러 상태)' },
      { name: 'children', kind: '콘텐츠', values: '입력 컨트롤(원자)' },
    ],
    composition: {
      토큰: ['gap xs/xxs', 'text.primary(라벨)', 'text.danger(별표·에러)', '타이포 body-strong/caption', '--field-border(에러 시 덮음)'],
      '의미 원자': ['Label', 'Text'],
      '배치 프리미티브': ['Stack'],
    } },
  { name: 'Accordion', layer: '분자', role: '여러 [헤더+본문] 섹션의 펼침을 조율(하나만/여럿). Collapsible 직접 쌓기를 대체.',
    props: [
      { name: 'items', kind: '콘텐츠', values: "{ value, label, children, tone?: 'attention', color?: BadgeColor }[] (tone='attention'=주의 행: 기본(회색+그림자)에서 틴트 채움({color}-0)+얇은 틴트 윤곽({color}-3)만 다름 / color=틴트 색, 기본 danger)" },
      { name: 'multiple', kind: '기능', values: 'boolean (여러 개 동시 펼침)' },
      { name: 'defaultOpen', kind: '값', values: 'string[] (처음 펼친 섹션 value)' },
      { name: 'clearAttentionOnOpen', kind: '기능', values: 'boolean (펼침=봤음 → attention 채움·윤곽 페이드 해제(영구). 큐/인박스용)' },
    ],
    composition: {
      토큰: ['radius md', '구분(separated) — 전 항목 회색 카드(--bg-tertiary) + 그림자(shadow-sm), 윤곽 최소(없음)', 'chevron', 'attention(틴트 색 토큰 — 기본 danger: 채움 -0 + 얇은 윤곽 -3, 좌측 띠 폐기)'],
      '의미 원자': ['Icon'],
    } },
  { name: 'Stat', layer: '분자', role: 'KPI 지표 타일(추세형). SummaryCard 형제: 큰 값 + 추세·델타.',
    props: [
      { name: 'label', kind: '콘텐츠', values: 'string' },
      { name: 'value', kind: '콘텐츠', values: 'string (포맷된 표시값)' },
      { name: 'trend', kind: '스타일', values: "'up' | 'down' | 'flat'" },
      { name: 'delta', kind: '콘텐츠', values: 'string (예: +12.4%)' },
      { name: 'icon', kind: '콘텐츠', values: 'IconName' },
    ],
    composition: {
      토큰: ['status 색(추세)', 'gap'],
      '의미 원자': ['Title', 'Text', 'Badge', 'Icon'],
      '레이아웃 원자': ['Card'],
      '배치 프리미티브': ['Group', 'Stack'],
    } },
  { name: 'TreeSelect', layer: '분자', role: '계층에서 노드 하나를 입력칸으로 선택(Tree를 드롭다운에 임베드). 부모/자식 임의 깊이.',
    props: [
      { name: 'nodes', kind: '기능', values: 'TreeNodeData[]' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, node id' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
    ],
    composition: {
      '의미 원자': ['Button', 'Icon', 'Popover'],
      유기체: ['Tree'],
    } },
  { name: 'Cascader', layer: '분자', role: '계층 경로를 순차로 선택 — 한 칸(레벨) 고르면 다음 칸이 옆에 등장(페이지에 N박스, 공간 여유용). 리프 선택 시 "A › B › C [변경]"으로 압축. 드롭다운 박스는 MillerColumns와 같은 컬럼-아이템 레이아웃(Select 아님). 한 트리거+다단은 MillerColumns(형제).',
    props: [
      { name: 'options', kind: '기능', values: '{ value, label, children }[]' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, value[] (경로)' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
    ],
    composition: {
      '의미 원자': ['Popover', 'Text', 'Button', 'Icon'],
      '배치 프리미티브': ['Group'],
      공유: ['controls.css(트리거·컬럼 박스)'],
    } },
  { name: 'MillerColumns', layer: '분자', role: '계층 경로를 한 컨트롤로 선택 — 트리거 1개 → 팝오버 다단 컬럼(좌→우, 부모 클릭=다음 컬럼; Finder·Ant Cascader 패턴). 좁은 화면(≤600px)은 단일 컬럼 드릴인 폴백. 리프=경로 확정(트리거에 A › B › C). Cascader(순차 인라인)의 형제 — 같은 박스 비주얼, 페이지 발자국은 트리거 1개. 대용량 검색은 Combobox 위임.',
    props: [
      { name: 'options', kind: '기능', values: '{ value, label, children }[]' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, value[] (경로)' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
    ],
    composition: {
      '의미 원자': ['Popover', 'Text', 'Icon'],
      공유: ['controls.css(트리거·컬럼·드릴)', 'useMediaQuery(좁은 화면 드릴 폴백)'],
    } },
  { name: 'SearchToolbar', layer: '분자', role: '목록 상단 띠: 검색 + 필터 + 활성 필터칩. ListPage 죽은 필터를 정식화.',
    props: [
      { name: 'searchValue / onSearchChange', kind: '기능', values: 'controlled, string' },
      { name: 'searchPlaceholder', kind: '콘텐츠', values: 'string' },
      { name: 'filters', kind: '기능', values: '{ key, label, options, value, onChange }[]' },
    ],
    composition: {
      '의미 원자': ['TextInput', 'Select', 'Chip', 'Icon'],
      분자: ['InputGroup'],
      '배치 프리미티브': ['Group'],
    } },
  { name: 'MultiSelect', layer: '분자', role: 'Select + Chip. 고른 값이 Chip으로 쌓임(neutral 고정).',
    props: [
      { name: 'options', kind: '기능', values: '{ label, value }[]' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, string[]' },
      { name: 'placeholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
    ],
    composition: {
      토큰: ['neutral(Chip 색 고정)', 'gap', '--field-border'],
      '의미 원자': ['Chip', 'Icon'],
      공유: ['_fieldStyles'],
    } },
  { name: 'DateRangeField', layer: '분자', role: 'DatePicker 둘 + 가운데 ~. "시작 ≤ 끝"이 묶음.',
    props: [
      { name: 'value / onChange', kind: '기능', values: '{ start, end } controlled' },
      { name: 'startPlaceholder / endPlaceholder', kind: '콘텐츠', values: 'string' },
      { name: 'size', kind: '스타일', values: SIZE2 },
    ],
    composition: {
      토큰: ['gap', 'align=center'],
      '의미 원자': ['DatePicker', 'Text'],
      '배치 프리미티브': ['Group'],
    } },
  { name: 'InputGroup', layer: '분자', role: '입력칸 양 끝에 비대화형 어드온(단위·아이콘).',
    props: [
      { name: 'leftAddon / rightAddon', kind: '콘텐츠', values: 'string | <Icon> (raw 금지)' },
      { name: 'children', kind: '콘텐츠', values: '입력 원자' },
    ],
    composition: {
      토큰: ['gap', 'align=center', '--field-border'],
      '의미 원자': ['Text', 'Icon(어드온)'],
      '배치 프리미티브': ['Group'],
    } },
  { name: 'NumberStepper', layer: '분자', role: '수량 − [n] + 스테퍼. NumberInput을 "증감 노출 + 타이핑"으로 고정한 형제(이름 Stepper는 다단계-진행 유기체가 선점 → NumberStepper). min/max는 검증(스키마)이 아니라 증감 버튼의 동작 경계(UI). 가운데 타이핑 가능(B2B 큰 수량).',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'controlled, number' },
      { name: 'min / max / step', kind: '기능', values: '증감 경계·단위 (기본 min 0, step 1)' },
      { name: 'size', kind: '스타일', values: SIZE2 },
      { name: 'disabled', kind: '스타일', values: 'boolean' },
    ],
    composition: {
      토큰: ['bg-secondary(fill)', 'radius', 'border-default(hover)'],
      '의미 원자': ['Icon(minus/plus)'],
    } },
  { name: 'FileUploader', layer: '분자', role: '파일 업로드 4단계 상태(대기→진행→완료/실패). controlled.',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'FileItem[](pending엔 file:File 실림 — 소비처가 FormData로 실제 업로드), (next) => void' },
      { name: 'multiple / disabled', kind: '스타일', values: 'boolean' },
    ],
    composition: {
      토큰: ['status 색(danger 등)', 'gap', 'radius', '진행바'],
      '의미 원자': ['Button', 'Icon', 'Text'],
      '배치 프리미티브': ['Group', 'Stack'],
    } },
  { name: 'Pagination', layer: '분자', role: '번호형 페이지 이동(축약 …). 목록 공유.',
    props: [
      { name: 'total', kind: '기능', values: 'number (전체 페이지)' },
      { name: 'value / onChange', kind: '기능', values: 'controlled, number' },
    ],
    composition: {
      토큰: ['primary(현재 페이지)', 'gap', '--icon-baseline-shift'],
      '의미 원자': ['Icon(화살표)'],
    } },
  { name: 'IconButton', layer: '분자', role: 'Button을 아이콘 전용으로 고정(label=aria).',
    props: [
      { name: 'icon', kind: '콘텐츠', values: 'IconName' },
      { name: 'label', kind: '콘텐츠', values: 'string (aria-label 필수)' },
      { name: 'variant', kind: '스타일', values: "'primary' | 'secondary' | 'danger' | 'ghost'" },
      { name: 'size', kind: '스타일', values: SIZE2 },
    ],
    composition: {
      토큰: ['variant→색 역할(primary/danger/secondary)', 'radius sm', '정사각'],
      '의미 원자': ['Icon'],
    } },
  { name: 'Callout', layer: '분자', role: '인라인 비휘발 안내(토스트와 분리). tone 4종.',
    props: [
      { name: 'tone', kind: '스타일', values: "'info' | 'warning' | 'danger' | 'neutral'" },
      { name: 'title', kind: '콘텐츠', values: 'string (선택)' },
      { name: 'children', kind: '콘텐츠', values: 'string (본문)' },
      { name: 'icon', kind: '콘텐츠', values: 'IconName (선택)' },
    ],
    composition: {
      토큰: ['tone 스케일(-0 배경/-2 보더/-7 아이콘)', 'padding md', 'radius md'],
      '의미 원자': ['Icon', 'Text'],
      '배치 프리미티브': ['Group', 'Stack'],
    } },
  { name: 'StatusRow', layer: '분자', role: '한 항목의 "상태 + 할 수 있는 행동"을 한 줄로.',
    props: [
      { name: 'label', kind: '콘텐츠', values: 'string' },
      { name: 'icon', kind: '콘텐츠', values: 'IconName (선택)' },
      { name: 'status', kind: '콘텐츠', values: '{ label, tone: ' + BADGE + ' }' },
      { name: 'actions', kind: '기능', values: 'Action[] (0~2 권장)' },
    ],
    composition: {
      토큰: ['타이포 body-strong(라벨)', 'gap', 'justify=between', 'sm 버튼 높이 reserve'],
      '의미 원자': ['Badge', 'Icon', 'Text'],
      '배치 프리미티브': ['Group'],
      공유: ['_cells(renderAction)'],
    } },
  { name: 'SummaryCard', layer: '분자', role: 'KPI/요약 타일(틴트 아이콘 + 건수 + 금액).',
    props: [
      { name: 'label', kind: '콘텐츠', values: 'string' },
      { name: 'icon', kind: '콘텐츠', values: 'IconName (선택)' },
      { name: 'tone', kind: '스타일', values: BADGE + ' (아이콘 틴트)' },
      { name: 'count / amount', kind: '값', values: 'number (각 선택)' },
    ],
    composition: {
      토큰: ['tone 틴트 스케일 var(--mantine-color-{tone}-{n})', 'gap', 'fmtCurrency/fmtNumber'],
      '의미 원자': ['Title(count)', 'Text', 'Icon'],
      '레이아웃 원자': ['Card'],
      '배치 프리미티브': ['Group', 'Stack'],
      공유: ['_cells(fmt)'],
    } },
  { name: 'TotalRow', layer: '분자', role: '리스트 하단 합계 행(마감선 + 라벨 ─ 금액).',
    props: [
      { name: 'label', kind: '콘텐츠', values: 'string (기본 "합계")' },
      { name: 'amount', kind: '값', values: 'number (₩ + 콤마)' },
    ],
    composition: {
      토큰: ['gap', 'fmtCurrency', '금액 강조(body-strong)'],
      '의미 원자': ['Text'],
      '레이아웃 원자': ['Divider'],
      '배치 프리미티브': ['Group', 'Stack'],
      공유: ['_cells(fmt)'],
    } },
  { name: 'Menu', layer: '분자', role: '클릭 시 열리는 액션 메뉴(Popover + Action[] + 선택 header).',
    props: [
      { name: 'trigger', kind: '콘텐츠', values: 'ReactNode (보통 IconButton)' },
      { name: 'items', kind: '기능', values: 'Action[] (클릭 시 닫고 onClick)' },
      { name: 'header', kind: '콘텐츠', values: 'ReactNode (선택 — 신원/제목, 구분선 자동)' },
      { name: 'width / position / align', kind: '값', values: "'sm'|'md'|'lg' / 4방향 / 'start'|'center'|'end'(축 위 정렬, 기본 center)" },
    ],
    composition: {
      토큰: ['hover bg(controls.css)', 'gap', 'danger 색(variant)'],
      '의미 원자': ['Popover', 'Text', 'Icon'],
      '레이아웃 원자': ['Divider'],
      '배치 프리미티브': ['Stack'],
      공유: ['_cells(Action)'],
    } },
  { name: 'ObjectCard', layer: '분자', role: '계층 안 오브젝트 한 칸의 닫힌 표현 — 평면 자루 대신 *역할 슬롯*(무엇을 어디에 매핑할지 강제). 단일 사진 카드(밀도 비교는 Explorer 목록이 맡음). 높이는 그리드 셀이 분배(타일).',
    props: [
      { name: 'title', kind: '콘텐츠', values: 'string (필수 — 이름)' },
      { name: 'subtitle', kind: '콘텐츠', values: 'string (선택 — 식별자/코드)' },
      { name: 'status', kind: '콘텐츠', values: '{ label, tone } (선택 — 상태 배지 1개, media 좌상단)' },
      { name: 'thumbnail / icon', kind: '콘텐츠', values: 'string(src) / IconName(폴백 글리프, 기본 package) — media는 인셋·둥근 밴드(flex로 footer 다음 남은 높이 차지, footer는 안 잘림)' },
      { name: 'headline', kind: '콘텐츠', values: '{ label, value, type, note? } (선택 — 핵심값 단 하나, 도메인이 주입)' },
      { name: 'attributes', kind: '콘텐츠', values: '{ label, value, type, note? }[] (선택 — 보조 라벨—값, 구분선 아래 전체)' },
      { name: 'actions', kind: '기능', values: 'Action[] (media 우상단 케밥 메뉴에 N개 수납, onClick에 모달 등 배선, 전파 차단)' },
      { name: 'onClick', kind: '기능', values: '() => void (카드 클릭)' },
    ],
    composition: {
      토큰: ['height:100%(셀 채움)', 'media min 높이', 'gap', 'caption(라벨)'],
      '의미 원자': ['Text', 'Badge', 'Image', 'Icon'],
      '레이아웃 원자': ['Card', 'Divider'],
      '배치 프리미티브': ['Group', 'Stack'],
      공유: ['_cells(renderAction·renderCell)'],
    } },
  { name: 'SectionHeader', layer: '분자', role: '카드/구획 표준 헤더(제목 subheading > 본문 + 설명? + 액션?). "헤더≥content+1tier" 규칙의 부품화.',
    props: [
      { name: 'title', kind: '콘텐츠', values: 'string (subheading)' },
      { name: 'titleNode', kind: '콘텐츠', values: 'ReactNode (title 대신 — 예: 인터랙티브 Breadcrumb)' },
      { name: 'description', kind: '콘텐츠', values: 'string (선택, caption)' },
      { name: 'actions', kind: '기능', values: 'Action[] (우측, 섹션 스코프·영속)' },
      { name: 'divider', kind: '스타일', values: 'boolean (하단 구분선=헤더 밴드)' },
    ],
    composition: {
      토큰: ['Title subheading(헤더 티어)', 'caption(설명)', 'justify=between'],
      '의미 원자': ['Title', 'Text'],
      '레이아웃 원자': ['Divider'],
      '배치 프리미티브': ['Group', 'Stack'],
      공유: ['_cells(renderAction)'],
    } },
  { name: 'Breadcrumb', layer: '분자', role: '위치 경로(a › b › c). 앞 단계 이동 가능(인터랙티브), 마지막=현재 강조.',
    props: [
      { name: 'items', kind: '기능', values: '{ label, onClick? }[] (마지막=현재, 비링크)' },
    ],
    composition: {
      토큰: ['chevron-right 구분', 'gap', '마지막 body-strong/primary'],
      '의미 원자': ['Text', 'Icon'],
      '배치 프리미티브': ['Group'],
    } },
  { name: 'Collapsible', layer: '분자', role: '헤더(항상 보임)+본문(접힘/펼침) 한 단위. 헤더 클릭 토글. 쌓아서 "요약 목록→펼쳐 상세". accordion은 경계 밖.',
    props: [
      { name: 'header', kind: '콘텐츠', values: 'ReactNode (요약 슬롯, 항상 보임 — 보통 StatusRow/TotalRow)' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode (상세 슬롯, 접힘 대상)' },
      { name: 'defaultOpen', kind: '스타일', values: 'boolean (처음 상태, 기본 false=접힘)' },
    ],
    composition: {
      토큰: ['hover bg(controls.css)', 'padding md', 'chevron-up/down'],
      '의미 원자': ['Icon'],
      '레이아웃 원자': ['Card', 'Divider'],
      '배치 프리미티브': ['Group'],
      공유: ['Mantine Collapse(애니메이션 엔진, 격리)'],
    } },
  { name: 'PeriodNavigator', layer: '분자', role: '기간 한 칸 이동(‹ 라벨 ›). 돈 화면(정산·매출…)의 기간 스코프 컨트롤. controlled·도메인 무지(포맷된 라벨만).',
    props: [
      { name: 'label', kind: '콘텐츠', values: 'string (포맷된 기간 라벨, 예: 2026년 6월)' },
      { name: 'onPrev / onNext', kind: '기능', values: '() => void' },
      { name: 'disabledPrev / disabledNext', kind: '스타일', values: 'boolean (첫/마지막 기간 경계)' },
    ],
    composition: {
      토큰: ['gap sm', 'body-strong(라벨)'],
      '의미 원자': ['Text'],
      분자: ['IconButton(chevron-left/right)'],
      '배치 프리미티브': ['Group'],
    } },

  // ── 유기체 (9) — 구성요소 표시 ───────────────────────────────────────
  { name: 'Modal', layer: '유기체', role: '도메인 무관 껍데기. 헤더·푸터 고정 + 본문 스크롤.',
    props: [
      { name: 'opened / onClose', kind: '기능', values: 'boolean, () => void' },
      { name: 'title', kind: '콘텐츠', values: 'string' },
      { name: 'actions', kind: '기능', values: 'Action[]' },
      { name: 'size', kind: '스타일', values: "'sm' | 'md' | 'lg' | 'xl' | 'full' (폭 — full=95vw·90vh, 풀스크린 아님·radius/여백 유지)" },
      { name: 'closeOnOverlayClick', kind: '스타일', values: 'boolean' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode (도메인 폼)' },
    ],
    composition: {
      토큰: ['shadow md', 'maxHeight 85vh(full 90vh, 명시예외)', '3영역 패딩', 'gap xs(푸터)'],
      '의미 원자': ['Title', 'Icon(x)'],
      '배치 프리미티브': ['Group (헤더 직접 조립)'],
      공유: ['_cells(renderAction)'],
    } },
  { name: 'Drawer', layer: '유기체', role: 'Modal의 슬라이드오버 형제. edge(좌/우/상/하)에서 패널이 들어옴. 상세 편집·필터.',
    props: [
      { name: 'opened / onClose', kind: '기능', values: 'boolean, () => void' },
      { name: 'title', kind: '콘텐츠', values: 'string' },
      { name: 'actions', kind: '기능', values: 'Action[]' },
      { name: 'position', kind: '스타일', values: "'left' | 'right' | 'top' | 'bottom'" },
      { name: 'size', kind: '스타일', values: "'sm' | 'md' | 'lg' | 'xl' | 'full' (슬라이드 축 폭/높이 — full=축 95%)" },
      { name: 'closeOnOverlayClick', kind: '스타일', values: 'boolean' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode (도메인 폼)' },
    ],
    composition: {
      토큰: ['3영역 패딩', 'gap xs(푸터)', '--border-default'],
      '의미 원자': ['Title', 'Icon(x)'],
      '배치 프리미티브': ['Group (헤더 직접 조립)'],
      공유: ['_cells(renderAction)'],
    } },
  { name: 'PaperModal', layer: '유기체', role: 'A4 문서 *뷰어* 모달(보기 전용 — 거래명세서·견적서). 종이가 자기 윤곽을 가짐(모달 아님). 실측(ResizeObserver)→fitA4로 A4 박스 px 계산→표준 A4 캔버스(794×1123 @96dpi)를 transform:scale. aspect-ratio·max-* 안 씀. **모달 폭은 가로(landscape) A4 기준 고정**(세로 문서여도 넓은 박스) — 한 모달에서 헤더 뷰토글(자세히/전체)로 두 뷰: ① 자세히(기본·좌)=폭 채워 확대·세로 스크롤(글자 읽기용) / ② 전체(우)=높이 맞춤 통째·무스크롤(세로 문서는 좌우 데스크). 토글은 내부 상태(공개 prop 아님). 내용=소비처 FieldGrid 장표(CANON 좌표계). 인쇄 빌트인(@media print: 종이만 남기고 화면 맞춤 scale·모달 변형 무효화 → 물리 A4 1:1·1장·머리말꼬리말 제거, FieldGrid 디바이더 크리스프; orientation별 @page size 주입) — 인쇄 *트리거*(버튼)만 actions로 소비처 배선. Modal의 뷰어 형제(공유 Modal 불변).',
    props: [
      { name: 'opened / onClose', kind: '기능', values: 'boolean, () => void' },
      { name: 'title', kind: '콘텐츠', values: 'string' },
      { name: 'actions', kind: '기능', values: 'Action[] (푸터 — 소비처가 인쇄·닫기 배선. 뷰어 빌트인 없음)' },
      { name: 'orientation', kind: '스타일', values: "'portrait'(기본) | 'landscape' (문서 캔버스 방향. 뷰 토글과 별개 — 토글은 전체/크게)" },
      { name: 'closeOnOverlayClick', kind: '스타일', values: 'boolean (기본 false)' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode (표준 A4 캔버스 794×1123 좌표계 기준 문서 — FieldGrid 등)' },
    ],
    composition: {
      토큰: ['모달 폭=가로 A4 고정(상한 95vw×95vh)', '데스크 패딩 8px(명시예외)', '--bg-secondary(데스크)', '.erpPaper=--bg-primary/--border-default/shadow md', '자세히=폭채움·세로스크롤(기본) / 전체=contain·무스크롤', '@media print: 물리 A4 1:1·머리말꼬리말 제거·크리스프 보더(--border-strong/0.2mm)'],
      '의미 원자': ['Title', 'Icon(x)', 'SegmentedControl(자세히/전체 토글)'],
      '배치 프리미티브': ['Group (헤더 직접 조립)'],
      공유: ['_cells(renderAction)'],
    } },
  { name: 'Stepper', layer: '유기체', role: '다단계 진행 표시(노드+커넥터+라벨). controlled active. 등록 마법사.',
    props: [
      { name: 'active', kind: '기능', values: 'number (현재 단계 index)' },
      { name: 'steps', kind: '콘텐츠', values: '{ label, description? }[]' },
      { name: 'orientation', kind: '스타일', values: "'horizontal' | 'vertical'" },
      { name: 'onStepClick', kind: '기능', values: '(index) => void' },
    ] },
  { name: 'Transfer', layer: '유기체', role: '좌(선택가능)·우(선택됨) 듀얼 리스트 + 이동 버튼. 권한·항목 배정.',
    props: [
      { name: 'items', kind: '기능', values: '{ value, label }[]' },
      { name: 'selected / onChange', kind: '기능', values: 'controlled, string[]' },
      { name: 'titles', kind: '콘텐츠', values: '[소스, 타깃] 제목' },
    ],
    composition: {
      '의미 원자': ['Checkbox'],
      분자: ['IconButton', 'SectionHeader'],
      유기체: ['EmptyState'],
      '레이아웃 원자': ['Card'],
      '배치 프리미티브': ['Grid', 'Group', 'Stack'],
    } },
  { name: 'ToastHost', layer: '유기체', role: '토스트 호스트(위치·지속·스택 단일 관리). notify.*가 이리로 띄움. 앱 셸에 1회 배치.',
    props: [],
    composition: { 공유: ['notify(트리거)'] } },
  { name: 'DataTable', layer: '유기체', role: '도메인 무관 표. columns(표현 enum) + rows. controlled 정렬/페이징.',
    props: [
      { name: 'columns', kind: '기능', values: '{ key, label, type, span?, sortable? }[]' },
      { name: 'rows', kind: '기능', values: 'DataTableRow[]' },
      { name: 'type(셀)', kind: '값', values: 'text·badge·number·currency·date·boolean·actions·menu(케밥)·user·tags·link·percent·secondary·relative-time·thumbnail·chevron(디스클로저 ›)' },
      { name: 'status', kind: '스타일', values: "'loading' | 'empty' | 'ready'" },
      { name: 'sort / onSortChange', kind: '기능', values: 'controlled (정렬 가능 열엔 항상 옅은 꺽쇠)' },
      { name: 'page / onPageChange / totalPages', kind: '기능', values: 'Pagination 연결' },
      { name: 'totalCount', kind: '기능', values: 'number ("총 N건")' },
      { name: 'onRowClick', kind: '기능', values: '(row) => void (있을 때만 hover)' },
      { name: 'stickyHeader', kind: '스타일', values: 'boolean (내부 스크롤에 헤더 고정 — 행만 스크롤)' },
      { name: 'column.grow / column.maxWidth', kind: '값', values: 'grow=남은 폭 채우는 유동 열(길면 … 말줄임) / maxWidth=열 폭 상한(넘으면 …). table-layout auto 유지 — 나머지 열은 내용 맞춤(도메인 폭 하드코딩 회피)' },
      { name: 'selectable / selectedIds / onSelectionChange / rowId', kind: '기능', values: '행 선택(체크박스 열, controlled)' },
      { name: 'bulkActions', kind: '기능', values: 'Action[] (선택 행 대상 툴바 — 페이지 액션은 ListPage)' },
      { name: 'emptyState', kind: '콘텐츠', values: '{ icon?, title, description? }' },
    ],
    composition: {
      토큰: ['행 sm / 헤더 xs(위계)', '--icon-baseline-shift(헤더 화살표)', 'number/currency 우측정렬'],
      '의미 원자': ['Icon', 'Text', 'Spinner'],
      '레이아웃 원자': ['Divider'],
      '배치 프리미티브': ['Stack'],
      분자: ['Pagination'],
      유기체: ['EmptyState'],
      공유: ['_cells(셀 type enum)'],
    } },
  { name: 'ListWidget', layer: '유기체', role: '목록을 raised 표면 하나에 담는 위젯 — TanStack Table(헤드리스) 흡수 × 우리 스킨. 툴바(검색·facet 필터)를 표면 *안*에 소유(바닥 blend 0). ListPage 대체. [MVP] 정렬·전역검색·facet 필터·페이징·행선택(상태 내부, controlled 승격 예정). 도메인=columns/data(헌법 1). 정렬(align)=타입 자동 + 닫힌 override.',
    props: [
      { name: 'columns', kind: '기능', values: 'ListColumn[] = { key, label, type(셀 16종), align?(좌/우/중 override), sortable?, filter?:facet(데이터서 옵션 자동), grow?, maxWidth?, badgeColors? }' },
      { name: 'data', kind: '기능', values: 'ListRow[] (id 필수)' },
      { name: 'search', kind: '기능', values: '{ fields?, placeholder? } — 전역검색(globalFilter)' },
      { name: 'selectable / bulkActions', kind: '기능', values: 'boolean / Action[](선택>0 시 표면 안 벌크바)' },
      { name: 'pageSize', kind: '값', values: 'number (기본 25)' },
      { name: 'title / primaryAction', kind: '콘텐츠', values: 'string / Action (위젯 헤더 — 선택)' },
      { name: 'onRowClick / emptyState / status', kind: '기능', values: '(row)=>void / {icon?,title,description?} / loading|ready' },
    ],
    composition: {
      토큰: ['surface-raised + elevation-raised(위젯)', 'align 자동(타입)+override(header·body 공유)', 'bg-secondary(헤더밴드)', '--icon-baseline-shift(정렬 화살표)'],
      '의미 원자': ['Text', 'Title', 'Icon', 'TextInput', 'Select', 'Chip', 'Checkbox'],
      '레이아웃 원자': ['Divider'],
      분자: ['Pagination'],
      유기체: ['EmptyState'],
      공유: ['_cells(renderCell 셀 16종·renderAction·fmt)', '@tanstack/react-table(엔진 격리 — 헌법 7, TipTap 동형)'],
    } },
  { name: 'NotificationPanel', layer: '유기체', role: '알림 벨 Popover(content) 슬롯에 꽂히는 알림 패널 위젯(시안 A). 3층: 헤더(제목·미읽음 카운트·모두읽음) / 본문 목록(높이 예약·내부 스크롤·시간 그룹) / 푸터(모든 알림 보기 — onViewAll 있을 때만). 도메인 무지(헌법 1): tone·title·icon·actor·time 문자열만, 날짜 로직 없음(그룹은 소비처 라벨). 축 예약: 헤더 높이·읽음점 컬럼 고정 → 읽음 전환 reflow 0. 전체 알림 페이지 목적지는 소비처 소유(설정 화면과 동형).',
    props: [
      { name: 'items', kind: '기능', values: 'NotifItem[] = { id, tone(info/success/warning/danger), title, time(문자열), icon?, actor?, group?(시간 그룹 라벨), read?, onClick? }' },
      { name: 'onMarkAllRead', kind: '기능', values: '() => void — 있으면 "모두 읽음"(미읽음 0이면 비활성)' },
      { name: 'onViewAll', kind: '기능', values: '() => void — 있으면 푸터 조립. 목적지=소비처 알림 Page(패키지는 라우트 모름)' },
      { name: 'emptyLabel', kind: '콘텐츠', values: "string (기본 '새 알림이 없습니다')" },
    ],
    composition: {
      토큰: ['tone 아이콘 원(jewel-tone 상태색 color-mix)', '미읽음 primary 틴트(무테)', '축 예약(헤더 48·읽음점 컬럼)', '--typo-body/caption'],
      '의미 원자': ['Text', 'Icon', 'CountBadge', 'SegmentedControl'],
      유기체: ['EmptyState'],
      공유: ['AppShell notifControl Popover(width lg=360·position top/right/bottom) — 표면·폭 소유'],
    } },
  { name: 'Repeater', layer: '유기체', role: '저작 툴킷 척추 — 가변 레코드 목록(추가/삭제/펼침) 크롬만 소유. 각 레코드 필드(renderItem)·접이 헤더(renderHeader)는 raw 슬롯(소비처가 원자로 조립, 상위필드 접근 자유 → door_spec 교차바인딩 성립). 도메인 무지(헌법 1): 레코드를 더하고 지우고 접을 뿐. dimensions·options·values·categories 등 모든 가변 컬렉션 저작 + 중첩(Repeater 안 Repeater). onReorder 예약(현 소비처 dnd 없음).',
    props: [
      { name: 'items / renderItem / renderHeader?', kind: '기능', values: 'T[] / (item,i)=>본문 / (item,i)=>접이 헤더(주면 collapsible)' },
      { name: 'onAdd / onRemove / onReorder?', kind: '기능', values: '() / (index) / (from,to) 예약' },
      { name: 'addLabel / itemKey?', kind: '콘텐츠', values: 'string / (item,i)=>key(행 open 안정, 기본 index)' },
      { name: 'collapsible? / defaultOpen? / min? / max?', kind: '값', values: 'boolean(기본=renderHeader 유무) / boolean / number(삭제하한) / number(추가상한)' },
      { name: 'emptyState', kind: '콘텐츠', values: '{ icon?, title, description? }' },
    ],
    composition: {
      토큰: ['inset hairline(무테 구획)', 'chevron rotate(reduced-motion 존중)', 'bg-primary 얕은 nested 표면'],
      '의미 원자': ['Icon', 'Button'],
      분자: ['IconButton'],
      유기체: ['EmptyState'],
      공유: ['renderItem/renderHeader = raw 슬롯(Modal children 동형) — 도메인 escape'],
    } },
  { name: 'InheritedValueField', layer: '유기체', role: '참조(SSOT)+상속+override+배율을 한 부품에 봉인 — effective = (override>0 ? override : ref.price) × ratio 를 부품이 계산·표시. 값마다 손조립 시 상속/override 누락으로 금액이 조용히 틀리는 것(소비처 v1 금액버그 재발점)을 원천봉쇄. 유효값은 저작자 피드백용 — 실제 가격 파이프라인(BOM)은 소비처 소유(§6). 도메인 무지: 참조에서 상속하거나 직접 입력한 수 × 배율, format로 표기만 주입.',
    props: [
      { name: 'refOptions', kind: '기능', values: 'RefOption[] = { id, label, price, unit?, group? } — SSOT 아이템(도메인 주입)' },
      { name: 'refId / onRefChange', kind: '기능', values: 'string|null / (id)=>void' },
      { name: 'override / onOverrideChange', kind: '기능', values: 'number(0=상속) / (v)=>void' },
      { name: 'ratio? / onRatioChange?', kind: '기능', values: 'number(기본1) / 없으면 배율 입력 미표시' },
      { name: 'format? / labels? / placeholder?', kind: '콘텐츠', values: '(n)=>string(기본 원화) / 서브라벨 / 참조 placeholder' },
    ],
    composition: {
      토큰: ['출처 칩 틴트(inherit=info·override=warning, 무테)', 'bg-secondary 유효값 밴드', 'tabular-nums'],
      '의미 원자': ['Select', 'CurrencyInput', 'NumberInput'],
      공유: ['_cells(fmtCurrency)'],
    } },
  { name: 'ExpressionField', layer: '유기체', role: "닫힌 DSL 수식 편집기 — 문법·검증·삽입 팔레트는 패키지, 변수는 소비처 주입. 경량 렉서로 토큰화→하이라이트(오버레이) + live 검증(미지 변수/함수·괄호 균형·비교 리터럴 코드 대조: options.x=='code'의 code를 variables[].values와 대조). 함수 §4.5 기본셋(CEIL·FLOOR·ROUND·MIN·MAX·ABS·IF) 내장·override 가능, 연산자는 DSL 고정. 도메인 무지(헌법 1): dimensions/options를 모르고 유효 변수 경로만 받는다. quantity/condition_formula·티어단가 조건식.",
    props: [
      { name: 'value / onChange', kind: '기능', values: 'string / (v)=>void' },
      { name: 'variables', kind: '기능', values: "ExprVariable[] = { path, label?, group?, values?:{code,label?}[] } — values는 =='code' 우변 대조·팔레트" },
      { name: 'functions?', kind: '기능', values: 'ExprFunction[]={name,hint?} (기본 CEIL/FLOOR/ROUND/MIN/MAX/ABS/IF)' },
      { name: 'validate? / placeholder?', kind: '값', values: "'live'(기본)|'off' / string" },
    ],
    composition: {
      토큰: ['토큰색(var=info·fn=primary·str=success·num=warning·bad=danger 물결)', '오버레이(투명 textarea+동일지오 pre)', 'mono'],
      '의미 원자': ['Icon'],
      공유: ['경량 렉서(내장 — 풀 파서 아님, 검증용)'],
    } },
  { name: 'KeyValueField', layer: '유기체', role: '닫힌 키(소비처 주입) → 타입 값 맵 편집 — dim_adjustments {width_mm:+30, height_mm:-12} 류. 각 키 1회(행 선택지는 현재 키+미사용 키로 좁힘, 다 쓰면 추가 비활성). number=부호(±) 허용 델타(기본)·currency=원화. 도메인 무지(헌법 1): 키가 무슨 축인지 모름 — 정해진 키집합에 수치 붙일 뿐(키는 품목 dimensions 동적 주입). 축 예약.',
    props: [
      { name: 'keys', kind: '기능', values: 'KVKey[] = { key, label? } — 닫힌 키집합(도메인 주입)' },
      { name: 'value / onChange', kind: '기능', values: 'Record<string,number> / (map)=>void' },
      { name: 'valueType?', kind: '값', values: "'number'(부호 허용 델타·기본) | 'currency'(원화)" },
      { name: 'addLabel', kind: '콘텐츠', values: 'string' },
    ],
    composition: {
      토큰: ['[키 1fr][값 120][삭제 28] 그리드', 'gap'],
      '의미 원자': ['Select', 'NumberInput', 'CurrencyInput', 'Button', 'Icon'],
      분자: ['IconButton'],
    } },
  { name: 'AssignPicker', layer: '유기체', role: '옵션세트(템플릿) kind별 배정 상호작용 봉인 — 트리거→kind 필터 리스트(itemCount 배지·빈 템플릿 비활성)→선택→재적용 경고 Modal→onAssign(서버 머지, 소비처). 조립(Popover+Modal+Button)이지만 명시 안 잡으면 통째로 새는 흐름이라 부품화. 도메인 무지(헌법 1): kind는 불투명 태그(동등 비교만) · 배정 실행은 소비처 소유.',
    props: [
      { name: 'templates', kind: '기능', values: 'AssignTemplate[] = { id, label, kind, itemCount } — itemCount 0=비활성' },
      { name: 'kind', kind: '기능', values: 'string — 이 kind와 같은 템플릿만(같은 kind 옵션에만 배정, §5-4)' },
      { name: 'onAssign', kind: '기능', values: '(templateId)=>void — 배정=옵션 인스턴스 생성(소비처)' },
      { name: 'confirmReapply?', kind: '값', values: 'boolean — 덮어쓰기 경고 Modal(§5-3)' },
      { name: 'triggerLabel? / confirmTitle? / confirmMessage?', kind: '콘텐츠', values: 'string' },
    ],
    composition: {
      토큰: ['itemCount 칩(bg-tertiary)', '비활성 opacity'],
      '의미 원자': ['Button', 'Text', 'Icon', 'Popover'],
      분자: ['Callout'],
      유기체: ['Modal'],
    } },
  { name: 'LineItemList', layer: '유기체', role: '편집 가능한 라인아이템 목록 — DataTable(읽기 전용)에 없는 "수량 편집+소계+삭제+합계". 도메인 무지(items 주입). 그룹(하위분류) 헤더로 묶고 하단에 수량-중심 합계(가격 옵션).',
    props: [
      { name: 'items', kind: '기능', values: 'LineItem[] = { id, label, sublabel?, group?, unitAmount?, quantity, min?, max? }' },
      { name: 'onQuantityChange / onRemove', kind: '기능', values: '(id, qty) / (id) — onRemove 있으면 ✕ 노출' },
      { name: 'showAmount', kind: '스타일', values: 'boolean (단가 소계·금액 합계 표시. 기본 off — 수량 중심)' },
      { name: 'totalLabel / unit', kind: '콘텐츠', values: "string (기본 '전체' / '개')" },
      { name: 'emptyState', kind: '콘텐츠', values: '{ icon?, title, description? }' },
    ],
    composition: {
      토큰: ['--typo-body/caption(라벨 말줄임)', 'gap', 'text 역할색'],
      '의미 원자': ['Text'],
      '레이아웃 원자': ['Divider'],
      '배치 프리미티브': ['Stack', 'Group'],
      분자: ['NumberStepper', 'IconButton'],
      유기체: ['EmptyState'],
      공유: ['_cells(fmtCurrency/fmtNumber)'],
    } },
  { name: 'EmptyState', layer: '유기체', role: 'empty 전용(아이콘+제목+설명+[action]). 세로 중앙.',
    props: [
      { name: 'icon', kind: '콘텐츠', values: 'IconName' },
      { name: 'title / description', kind: '콘텐츠', values: 'string' },
      { name: 'action', kind: '기능', values: 'Action (선택 — 없으면 미조립)' },
    ],
    composition: {
      토큰: ['gap 위계', 'align=center', '아이콘 크기'],
      '의미 원자': ['Icon', 'Title', 'Text'],
      '배치 프리미티브': ['Stack'],
      공유: ['_cells(renderAction)'],
    } },
  { name: 'PageHeader', layer: '유기체', role: '페이지 상단 제목/설명(좌) + 액션(우).',
    props: [
      { name: 'title', kind: '콘텐츠', values: 'string' },
      { name: 'description', kind: '콘텐츠', values: 'string (선택)' },
      { name: 'status', kind: '콘텐츠', values: '{ label, tone } (선택 배지)' },
      { name: 'actions', kind: '기능', values: 'Action[] (우측, sm 고정)' },
    ],
    composition: {
      토큰: ['justify=between', 'Title heading', '액션 size=sm(제목이 주인공)'],
      '의미 원자': ['Title', 'Text', 'Badge'],
      '배치 프리미티브': ['Group', 'Stack'],
      공유: ['_cells(renderAction)'],
    } },
  { name: 'DescriptionList', layer: '유기체', role: '"라벨: 값" 쌍 나열(읽기 전용). 셀 타입 공유.',
    props: [
      { name: 'items', kind: '기능', values: '{ label, value, type }[]' },
      { name: 'columns', kind: '스타일', values: '1 | 2 | 3' },
    ],
    composition: {
      토큰: ['라벨 caption+secondary', '값 body+primary', 'minHeight lg(이종값 baseline)'],
      '의미 원자': ['Text'],
      '배치 프리미티브': ['Grid', 'Stack'],
      공유: ['_cells(셀 type enum)'],
    } },
  { name: 'AppShell', layer: '유기체', role: '페이지 전체 골격 — **2티어**(데스크탑 260 풀 넷바 / 태블릿 72 아이콘 레일). 상단바 없음, 유틸리티(알림·프로필)는 넷바 하단. **모바일은 범위 밖**(MobileShell이 받는다) — 하한 APPSHELL_MIN_WIDTH(768) 아래는 가로 스크롤로 예측 가능하게 무너진다.',
    props: [
      { name: 'logo / onLogoClick', kind: '콘텐츠', values: 'ReactNode, () => void (데스크탑 넷바 최상단. 태블릿 레일엔 로고 없음 — 72px엔 정사각 마크만 들어가 부실)' },
      { name: 'menuItems / activePath / onNavigate', kind: '기능', values: '{ label, icon, path, group, count?: number }[] (count=미처리 건수 → CountBadge, 두 티어 모두에서 보임)' },
      { name: 'profile', kind: '콘텐츠', values: '{ name, role, email, menu?: Action[] } (넷바 하단 확장행 / 레일 아바타-only)' },
      { name: 'notification', kind: '기능', values: '{ hasUnread?, onClick?, content? }' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode (콘텐츠 영역)' },
    ],
    composition: {
      토큰: ['넷바/상단바/레일 골격·폭·높이', 'navy 그림자(떠있는 패널)', 'danger(안읽음 점)', 'primary(레일 활성 막대)'],
      '의미 원자': ['Avatar', 'Icon', 'Text', 'CountBadge', 'Popover'],
      '배치 프리미티브': ['Stack', 'Group'],
      분자: ['IconButton', 'Menu'],
      공유: ['_cells(Action)'],
    } },
  { name: 'MobileShell', layer: '유기체', role: '모바일 셸 — AppShell의 *형제*(축소판 아님). 면·그림자를 안 쓰고 배경 + 가로 헤어라인으로만 나누는 네이티브 리스트 체계. 상단 Navigation(뒤로·제목·아이콘 액션)만 셸이 소유하고 화면 제목(Top)은 본문이 갖는다. CTA는 헤더가 아니라 하단 고정.',
    props: [
      { name: 'title / onBack / backLabel', kind: '콘텐츠', values: 'Navigation — 2뎁스에서 "여기가 어디인지" + 뒤로. 최상위 화면은 생략(본문 Top이 제목을 가짐)' },
      { name: 'actions', kind: '기능', values: 'Action[] — 우측 아이콘 액션(icon 필수). 텍스트 CTA 자리가 아니다' },
      { name: 'tabs / activePath / onNavigate', kind: '기능', values: 'MobileTab[] = { label, icon, path, count? } — 3~5개(HIG). 오버플로(더보기) 없음: HIG가 "숨은 탭은 도달·인지가 어렵다"며 말리는 패턴이라 소비처가 추려서 준다' },
      { name: 'bottom', kind: '콘텐츠', values: 'ReactNode (선택) — 탭 위 고정 한 칸. CTA 버튼이든 입력 바(MobileComposer)든 여기 들어간다. 자리를 하나로 둔 이유: 둘 다 "탭 위 고정"이라 슬롯을 나누면 같은 자리를 두 경로가 다툰다. 없으면 렌더 0' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode (유일한 스크롤 영역)' },
    ],
    composition: {
      토큰: ['--bg-primary(단일 평면)', '--border-default(헤어라인 — surface/elevation 미사용)', 'primary(탭 활성)', 'safe-area-inset-bottom'],
      '의미 원자': ['Icon', 'Text', 'CountBadge', 'Button'],
      '배치 프리미티브': ['Stack'],
      분자: ['IconButton'],
      공유: ['_cells(Action)'],
    } },
  { name: 'MobileSection', layer: '분자', role: '모바일 화면의 내용 묶음 — 제목(선택) + 자유 슬롯 + 위아래 헤어라인. 묶음을 *카드*가 아니라 *경계선*이 만든다(면·그림자 미사용).',
    props: [
      { name: 'title / action', kind: '콘텐츠', values: '섹션 제목(TDS ListHeader 자리) + 우측 보조(‘전체보기’ 등). 텍스트 CTA 자리가 아니다 — CTA는 셸 하단 고정' },
      { name: 'flush', kind: '스타일', values: 'boolean — true=본문 좌우 여백 0(행이 끝까지 닿음, MobileListRow용). 기본 false=여백 있음(자유 콘텐츠)' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode — raw 슬롯(Modal children 동형). 텍스트·아이콘·배지 뭘 넣든 소비처가 조립' },
    ],
    composition: { 토큰: ['--border-default(헤어라인)', 'caption 타이포', 'spacing'], 공유: ['mobilelist.css — 모바일 목록 계열 공유'] } },
  { name: 'MobileListRow', layer: '분자', role: '모바일 목록의 행 — 누르면 *다른 화면으로 이동*하는 탐색형. 구분은 하단 헤어라인 하나뿐.',
    props: [
      { name: 'title / meta', kind: '콘텐츠', values: '제목 + 아래 줄 보조 정보(작성자·날짜 — 포맷은 소비처)' },
      { name: 'leading / badges / trailing', kind: '콘텐츠', values: 'ReactNode 슬롯 — 좌측(아바타·아이콘) / 제목 위 배지 줄 / 우측 값. 어떤 배지를 쓸지는 도메인이라 소비처가 정한다' },
      { name: 'onClick', kind: '기능', values: '있으면 버튼 + chevron(iOS disclosure 관습). 없으면 정적 행 — 눌리는 것처럼 보이지 않는다(거짓 어포던스 금지)' },
    ],
    composition: {
      토큰: ['--border-default(행 하단 선)', 'min-height 44px(Apple HIG 최소 터치타깃)', 'bg-secondary(:active — 폰은 hover가 없다)'],
      '의미 원자': ['Icon'],
      공유: ['mobilelist.css — 마지막 행 선 제거는 MobileSection이 소유'],
    } },
  { name: 'MobileTop', layer: '분자', role: '모바일 화면 제목 영역 — 데스크탑 PageHeader에서 *우측 CTA를 뗀* 자리. 셸이 아니라 화면이 소유(TDS의 Navigation/Top 2층 구분).',
    props: [
      { name: 'title', kind: '콘텐츠', values: '제목. **보조 설명 슬롯 없음** — 설명이 필요하면 본문 섹션이 갖는다' },
      { name: 'action', kind: '기능', values: "Action(선택) — 제목과 *같은 줄* 우측의 **진입** 액션('글쓰기'처럼 다른 화면으로). 화면의 **커밋** 액션(등록·요청)은 여전히 셸 하단 고정이 받는다 — 역할이 달라 경쟁 경로가 아니다. 전용 행을 만들지 않는 이유: 진입 하나에 한 행은 낭비" },
    ],
    composition: { 토큰: ['heading(모바일 28px)', 'spacing'], '의미 원자': ['Title'], 공유: ['_cells(renderAction)', 'mobilelist.css'] } },
  { name: 'MobileStatRow', layer: '분자', role: '모바일 KPI 행 — 지표 2~4개 균등 분할 + 항목 사이 세로 헤어라인. 데스크탑 Stat·SummaryCard는 카드 면 위 물건이라 모바일 체계에 못 쓴다.',
    props: [
      { name: 'items', kind: '기능', values: 'MobileStatItem[] = { label, value(포맷된 문자열 — 숫자 포맷은 소비처), sub?(델타·보조), tone?(sub 색), onClick?(그 칸만 눌림 — 보통 걸러진 목록으로) }' },
    ],
    composition: {
      토큰: ['--border-default(세로 구분선)', 'subheading 크기 + display 굵기(값)', '상태 4역할(sub tone)'],
      공유: ['mobilelist.css — 모바일 목록 계열 공유'],
    } },
  { name: 'MobileDisclosure', layer: '분자', role: '그 자리에서 펼쳐지는 행 — MobileListRow(다른 화면으로 이동)의 짝. 이동=chevron-right / 펼침=chevron-down(회전)으로 어포던스가 방향으로 갈린다.',
    props: [
      { name: 'title / meta', kind: '콘텐츠', values: '제목 + 접힌 상태에서도 보이는 우측 요약(금액·건수)' },
      { name: 'defaultOpen', kind: '스타일', values: 'boolean — 펼침은 UI 표현이라 내부 상태(Collapsible과 같은 판단)' },
      { name: 'children', kind: '콘텐츠', values: 'ReactNode raw 슬롯' },
    ],
    composition: { 토큰: ['--border-default', 'min-height 44px'], '의미 원자': ['Icon'], 공유: ['mobilelist.css'] } },
  { name: 'MobilePhotoPicker', layer: '분자', role: '모바일 사진 첨부/삭제 — 정사각 썸네일 격자 + 추가 타일 + 각 썸네일 ✕. 데스크탑 FileUploader(드롭존)는 폰에 드래그가 없어 못 쓴다.',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'FileItem[](FileUploader와 같은 타입 — 상태·진행률 어휘 공유). 새로 고른 건 부품이 url에 objectURL을 채우고 회수까지 책임진다. 실제 업로드는 소비처(pending의 file → FormData)' },
      { name: 'max / disabled', kind: '스타일', values: 'number(넘으면 추가 타일이 사라짐) / boolean' },
    ],
    composition: {
      토큰: ['--bg-secondary(빈 칸)', '--border-strong(추가 타일 파선 — 헤어라인 체계의 명시 예외: "아직 비어 있음")', 'danger(실패 베일)'],
      '의미 원자': ['Icon', 'Text'],
      공유: ['FileItem(FileUploader)', 'mobilelist.css'],
    } },
  { name: 'MobileCalendar', layer: '분자', role: '모바일 월 달력 — **스팬 바**로 기간을 읽는다(점 아님). 여러 날 일정은 하나의 연속 알약이라 "언제부터 언제까지"·겹침·연속이 보인다(iOS 18이 월 뷰를 Compact/**Stacked**/Details로 재편하며 iOS 17의 점 표기를 교체 — 취한 건 Stacked). 바는 pointer-events 없음: 폰에서 7px 바는 터치 표적이 못 되므로 일정 선택은 아젠다 목록이 받는다. 달력만 그린다.',
    props: [
      { name: 'month / onMonthChange', kind: '기능', values: "'YYYY-MM' controlled — 상태 주인은 소비처" },
      { name: 'selected / onSelect', kind: '기능', values: "'YYYY-MM-DD'" },
      { name: 'events / encoding / annotations / holidays', kind: '기능', values: '**데스크탑 CalendarPage와 같은 타입**(CalendarEvent·CalendarEncoding·CalendarAnnotation·CalendarHoliday) — 소비처가 한 벌을 두 화면에 그대로 넘긴다(변환 0). 색·적층 순서도 같은 규칙(anchor/status 정의 순서)' },
      { name: 'maxLanes', kind: '스타일', values: 'number(기본 3) — 폰 높이 한계로 끊는 레인 수. 넘치면 그 칸에 +N' },
    ],
    composition: {
      토큰: ['anchor 색 역할(바)', 'primary(선택=채움 / 오늘=윤곽 — 겹쳐도 둘 다 읽히게 형태를 다르게)', '주말·공휴일 색', 'tone-0(배경 태그 틴트)'],
      분자: ['IconButton'],
      공유: ['**_calendarLanes.packLanes — CalendarPage와 한 벌**(복제하면 적층 순서가 갈려 같은 데이터가 두 화면에서 다르게 쌓인다)', 'CalendarPage 타입', 'raw 7열 CSS grid(우리 Grid는 12의 약수만 — 명시 예외)', 'dayjs'],
    } },
  { name: 'MobileComment', layer: '분자', role: '댓글 한 줄 — 1단 답글(parentId)까지 들여쓰기. 데스크탑 BoardView와 같은 BoardComment 타입을 쓴다(소비처가 한 벌을 두 화면에).',
    props: [
      { name: 'comment', kind: '기능', values: 'BoardComment = { id, author, date, body, isAuthor?, parentId? } — 부모 링크는 parentId(배열 순서에 기대지 않음)' },
      { name: 'authorLabel', kind: '콘텐츠', values: "글쓴이 표시 문구(기본 '작성자') — 부품이 호칭을 지어내지 않는다" },
      { name: 'onReply', kind: '기능', values: '(id) => void — 있으면 답글 버튼. 답글엔 안 붙는다(1단 스레드). *작성은 여기 없다* — 폰은 입력이 하단 고정이라 MobileComposer가 받는다(데스크탑 BoardView의 중첩 인라인 폼과 갈리는 지점)' },
    ],
    composition: { 토큰: ['--border-default', 'primary-0(작성자 태그)', 'bg-secondary(답글 배경)'], '의미 원자': ['Avatar', 'Icon'], 공유: ['BoardComment(BoardView)', 'mobilelist.css'] } },
  { name: 'MobileComposer', layer: '분자', role: '화면 하단 고정 입력 바 — 셸 bottom 슬롯에 꽂는다. 폰에서 긴 스크롤 끝의 입력창은 손이 안 닿아 하단에 붙는다.',
    props: [
      { name: 'value / onChange / onSubmit', kind: '기능', values: 'controlled — 값의 주인은 소비처' },
      { name: 'replyTo', kind: '콘텐츠', values: '{ label, onCancel } — 있으면 입력 위 대상 칩. 폰은 입력이 하단 고정이라 "위치"로 대상을 말할 수 없어 태깅이 정답(데스크탑은 중첩 폼으로 위치가 말한다 — 같은 행위, 다른 매체)' },
      { name: 'placeholder / disabled', kind: '스타일', values: 'string / boolean' },
    ],
    composition: {
      토큰: ['bg-secondary(입력 알약)', 'font-size max(16px) — iOS 자동 확대 봉인'],
      분자: ['IconButton'],
      공유: ['격리 raw textarea(자동 높이·무테 — 필드 규격과 다른 물건. Tree 인라인편집 선례)', 'mobilelist.css'],
    } },
  { name: 'MobileFileRow', layer: '분자', role: '첨부 파일 한 줄(읽기) — 아이콘·이름·크기·내려받기. MobileListRow(누르면 다른 화면)와 행동이 달라 별개 부품(§11-3).',
    props: [
      { name: 'name / size', kind: '콘텐츠', values: '파일명 + 크기 문자열(바이트 포맷은 소비처 — 로케일/도메인)' },
      { name: 'onDownload', kind: '기능', values: '있으면 행 전체가 눌린다' },
    ],
    composition: { 토큰: ['--border-default', 'min-height 44px'], '의미 원자': ['Icon'], 공유: ['말줄임을 왼쪽에서(확장자가 끝에 있어 direction 반전)', 'mobilelist.css'] } },
  { name: 'Timeline', layer: '유기체', role: '시간순 누적 이벤트(시각·작성자·구분·내용 말풍선).',
    props: [
      { name: 'events', kind: '기능', values: 'TimelineEvent[]' },
      { name: 'emptyState', kind: '콘텐츠', values: '{ icon?, title, description? }' },
    ],
    composition: {
      토큰: ['gap', 'caption(날짜 구분)', '말풍선 카드', 'category tone 배지'],
      '의미 원자': ['Avatar', 'Badge', 'Icon', 'Text'],
      '레이아웃 원자': ['Card'],
      '배치 프리미티브': ['Group', 'Stack'],
      유기체: ['EmptyState'],
      공유: ['_cells'],
    } },
  { name: 'Calendar', layer: '유기체', role: '월 달력(셀당 이벤트 배지 + 셀 클릭). 모달 비소유.',
    props: [
      { name: 'month / onMonthChange', kind: '기능', values: "'YYYY-MM' controlled" },
      { name: 'events', kind: '기능', values: 'CalendarEvent[]' },
      { name: 'onSelectDate', kind: '기능', values: '(date, dayEvents) => void' },
      { name: 'onSelectEvent', kind: '기능', values: '(event) => void' },
    ],
    composition: {
      토큰: ['7열 grid(calendar.css 명시예외)', 'tone 배지', 'gap', '오늘 강조'],
      '의미 원자': ['Badge', 'Title', 'Text'],
      '배치 프리미티브': ['Group', 'Stack'],
      분자: ['IconButton(이전/다음 달)'],
      공유: ['_cells', 'calendar.css'],
    } },
  { name: 'Tree', layer: '유기체', role: '재귀 계층 표시 + 펼침/접힘 + 선택 + 노드 ⋯메뉴(이름변경·삭제) + 제자리 편집(범용).',
    props: [
      { name: 'nodes', kind: '기능', values: 'TreeNodeData[] ({id,label,children?})' },
      { name: 'selectedId / expandedIds', kind: '기능', values: 'controlled (선택·펼침)' },
      { name: 'onSelect / onToggle', kind: '기능', values: '콜백' },
      { name: 'title', kind: '콘텐츠', values: 'string (패널 헤더)' },
      { name: 'editable', kind: '스타일', values: 'boolean (최상위 ＋·케밥 노출)' },
      { name: 'onAddRoot / onRename / onDelete', kind: '기능', values: '쓰기 위임(제자리 인라인 입력 → 콜백). 케밥=이름변경·삭제. 하위(분류) 추가는 트리 밖(소비처)에서' },
    ],
    composition: {
      토큰: ['들여쓰기 16px', '선택 강조 bg(primary-0)', 'gap'],
      '의미 원자': ['Icon(chevron/folder)', 'Text', 'TextInput(제자리 편집)'],
      '배치 프리미티브': ['Group', 'Stack'],
      분자: ['IconButton', 'Menu(노드 ⋯)'],
    } },
  { name: 'FieldGrid', layer: '유기체', role: '테두리 친 2D 셀 격자(장표/帳票). 고정 라벨/스키마 필드/이미지 셀을 배치, 작성(edit)·확인(read) 양용·같은 기하.',
    props: [
      { name: 'columns', kind: '스타일', values: 'number (격자 열 수 — raw grid, 12약수 제약 없음·명시예외)' },
      { name: 'rows', kind: '기능', values: 'FieldGridCell[][] ({label?|field?|image?|node?, colSpan?, rowSpan?, align?}) — node=비표준 컨트롤 통째 슬롯(@/ui 부품, 4종 배타·mode 무관)' },
      { name: 'fields', kind: '기능', values: 'FieldSpec[] (field 셀 정의 — 스키마 층 재사용)' },
      { name: 'mode', kind: '스타일', values: "'edit' | 'read' (기본 edit — 박스 기하 불변, read는 같은 입력 원자를 inert로 재사용·편집만 차단)" },
      { name: 'size', kind: '스타일', values: "'sm' | 'md'(기본) | 'lg' — 타이포·행 단위·세로패딩 한 세트 스케일. 행 높이는 타이포 따라 동적, 큰 부품은 rowSpan으로 병합(엑셀형 균일)" },
      { name: 'values / onChange / errors', kind: '기능', values: 'controlled (FormSection 동형). 에러=--field-border danger + Tooltip(기하 보존)' },
    ],
    composition: {
      토큰: ['N열 grid(fieldgrid.css 명시예외)', '라벨 셀 음영(bg-secondary)', '--field-border(에러)', 'size별 --fg-row/--fg-typo/--fg-pad-y(행 높이 동적·균일 단위)'],
      '의미 원자': ['TextInput', 'NumberInput', 'CurrencyInput', 'Textarea', 'Select', 'DatePicker', 'Checkbox', 'Image', 'Tooltip'],
      공유: ['_masks(applyMask)', 'fieldgrid.css(라벨 raw 타이포)', 'schema(FieldSpec)'],
    } },

  // ── 템플릿 (3) + 폼 조립 조직 ────────────────────────────────────────
  { name: 'FormSection', layer: '템플릿', role: 'FieldSpec[]을 FormField + 입력 원자로 조립(조직). 도메인 무지.',
    props: [
      { name: 'fields', kind: '기능', values: 'FieldSpec[] (스키마)' },
      { name: 'values / onChange', kind: '기능', values: 'controlled 폼 값' },
      { name: 'columns', kind: '스타일', values: '1 | 2' },
      { name: 'resolvers', kind: '기능', values: 'lookupKey→조회함수(코드 주입)' },
      { name: 'errors', kind: '콘텐츠', values: 'Record<name, message> (Zod 결과)' },
    ],
    composition: {
      토큰: ['gap', '1열 Stack / 2열 Grid', '마스크·조건부 토글'],
      '의미 원자': ['TextInput', 'NumberInput', 'Textarea', 'Select', 'DatePicker', 'Checkbox', 'Button', 'Icon'],
      '배치 프리미티브': ['Grid', 'Group', 'Stack'],
      분자: ['FormField'],
      공유: ['_masks'],
    } },
  { name: 'ListPage', layer: '템플릿', role: '목록 골격(헤더 + 테이블 카드 + 푸터). 도메인 0줄.',
    props: [
      { name: 'schema', kind: '기능', values: '{ title, columns, primaryAction?, toolbar?, emptyState? ... }' },
      { name: 'rows', kind: '기능', values: 'DataTableRow[]' },
      { name: 'status', kind: '스타일', values: "'loading' | 'empty' | 'ready'" },
      { name: 'sort / page / totalPages / totalCount', kind: '기능', values: 'controlled' },
      { name: 'onRowClick / onFilterClick', kind: '기능', values: '콜백' },
    ],
    composition: {
      토큰: ['Container wide', 'Stack lg', 'Card elevated padding=none'],
      '의미 원자': ['Icon', 'SegmentedControl(toolbar)'],
      '레이아웃 원자': ['Card', 'Container'],
      '배치 프리미티브': ['Stack'],
      유기체: ['PageHeader', 'DataTable'],
      공유: ['_cells'],
    } },
  { name: 'DetailPage', layer: '템플릿', role: '상세 골격(좌 정보 / 우 폼 2분할). 폼은 선택.',
    props: [
      { name: 'title / description', kind: '콘텐츠', values: 'string' },
      { name: 'actions', kind: '기능', values: 'Action[]' },
      { name: 'info', kind: '기능', values: '{ heading?, items, columns? } (DescriptionList)' },
      { name: 'form', kind: '기능', values: '{ fields, values, onChange, resolvers?, errors?, footer? } (선택)' },
    ],
    composition: {
      토큰: ['Container wide', 'Grid 2분할', 'Card elevated lg'],
      '의미 원자': ['Title'],
      '레이아웃 원자': ['Card', 'Container'],
      '배치 프리미티브': ['Grid', 'Group', 'Stack'],
      유기체: ['PageHeader', 'DescriptionList'],
      템플릿: ['FormSection'],
      공유: ['_cells'],
    } },
  { name: 'HierarchyExplorer', layer: '템플릿', role: '계층 기반 마스터-디테일(좌 디렉토리 트리 / 우: 하위 분류 + 직속 제품 공존). Unity·Figma·VSCode 멘탈모델. 페이지 템플릿(PageHeader 내장).',
    props: [
      { name: 'title / description / status / actions', kind: '콘텐츠', values: 'PageHeader(고정) — title 필수' },
      { name: 'nodes / selectedId / expandedIds', kind: '기능', values: '트리(controlled)' },
      { name: 'onSelect / onToggle / onAddRoot / onRename / onDelete', kind: '기능', values: '트리 쓰기·선택 위임(최상위 추가=헤더 ＋, 케밥=이름변경·삭제)' },
      { name: 'editable / treeTitle', kind: '스타일', values: 'boolean / string' },
      { name: 'objects', kind: '기능', values: 'HierarchyObject[] (선택 디렉토리 직속 제품만 — 하위 분류와 공존 가능)' },
      { name: 'onAddObject / onAddChild', kind: '기능', values: '우측 ＋ 드롭다운 [제품 추가 / 분류 추가] — 둘 다 완전 위임(소비처 모달). onAddChild: (parentId)=>void' },
      { name: 'searchQuery / onSearchChange / searchResults', kind: '기능', values: '전역 검색(controlled — onSearchChange 주면 좌측 분류 헤더 아래 검색바, 쿼리 있으면 우측 결과 리스팅 모드)' },
    ],
    composition: {
      토큰: ['Container wide', '단일 elevated 카드', '좌측 고정폭 280', '고정높이 70vh+내부 스크롤(페이지네이션 없음)', '검색바=좌측 분류 헤더 아래', '본문=하위 분류 타일+제품 목록(DataTable) 동시', '추가=우측 ＋ 드롭다운(제품/분류)'],
      '레이아웃 원자': ['Card', 'Container'],
      '배치 프리미티브': ['Group', 'Stack'],
      '의미 원자': ['Icon'],
      분자: ['Menu', 'IconButton', 'ObjectCard', 'SectionHeader', 'Breadcrumb'],
      유기체: ['Tree', 'DataTable', 'EmptyState', 'PageHeader'],
    } },
  { name: 'HierarchyCollector', layer: '템플릿', role: 'HierarchyExplorer의 짝 — 계층 카탈로그에서 수량과 함께 골라 담는 "작성 면"(HE=관리/이건 수집). 상단 카탈로그 책갈피 + 영속 경로 네비 + 좌 브라우즈 목록 + 우 sunken-well 카트. 도메인 0줄(헌법 1).',
    props: [
      { name: 'title / description / actions', kind: '콘텐츠', values: 'PageHeader(고정) / 풋터 바 액션(Action[])' },
      { name: 'catalogs', kind: '기능', values: 'CollectorCatalog[] = { id, label, tree: CollectorNode[] } — 책갈피(1개면 숨김)+분류 트리(cascader)' },
      { name: 'products', kind: '기능', values: 'CollectorProduct[] = { id, catalog, path[], label, sublabel?, group?, amount?, thumbnail? } — 템플릿이 카탈로그·경로·검색으로 필터' },
      { name: 'cart / onCartChange', kind: '기능', values: 'CollectorCartItem[](= LineItem+catalog), controlled' },
      { name: 'showAmount', kind: '스타일', values: 'boolean (단가/금액 표시. 기본 off — 수량 중심)' },
      { name: 'onProductClick', kind: '기능', values: '(productId) => void (행 클릭=상세 모달 구멍, 부품은 신호만)' },
    ],
    composition: {
      토큰: ['Container wide', 'surface.raised(위젯)+elevation', 'surface.sunken(카트 well)', '윤곽→음영 2축', '반응형 강등(narrow→스택, 부품 소유)', '책갈피·cascader·검색·카트칩=템플릿 내부 컨트롤(collector.css — 아톰이 width·체크 못 닫아 종속)'],
      '레이아웃 원자': ['Container'],
      '배치 프리미티브': ['Stack'],
      '의미 원자': ['Popover(cascader 드롭다운)', 'Text', 'Icon'],
      분자: ['NumberStepper'],
      유기체: ['LineItemList(카트)', 'PageHeader'],
      공유: ['_cells(fmtCurrency/renderAction)'],
    } },
  { name: 'LedgerPage', layer: '템플릿', role: '돈 지표 페이지 골격(① 기간 · ② KPI 밴드 · ③ 분해표 · ④ Drawer 드릴). 정산·매출·매입 등 기간 스코프 금액 화면. 도메인 0줄, 스키마 주입. ListPage·DetailPage 형제.',
    props: [
      { name: 'title / description / status / actions', kind: '콘텐츠', values: 'PageHeader(고정)' },
      { name: 'period', kind: '기능', values: '{ label, onPrev, onNext, disabledPrev?, disabledNext? } (PeriodNavigator 중앙 스트립)' },
      { name: 'metrics', kind: '기능', values: "LedgerMetric[] = {kind:'stat', label, value, trend?, delta?, icon?} | {kind:'summary', label, icon?, tone?, count?, amount?} → 1~4열 equalRows" },
      { name: 'breakdown', kind: '기능', values: '{ tabs, value, onChange, columns, rows, total?, status?, emptyState?, onRowClick?, sort?, page… } (SegmentedControl→DataTable→TotalRow)' },
      { name: 'detail', kind: '기능', values: '{ opened, onClose, title, actions?, size?, content } (Drawer 우측 드릴 — content=도메인 라인 상세 슬롯)' },
    ],
    composition: {
      토큰: ['Container wide', 'Stack lg', 'KPI equalRows 그리드', '분해 elevated 카드(세그먼트→표→합계)'],
      '레이아웃 원자': ['Card', 'Container'],
      '배치 프리미티브': ['Group', 'Stack', 'Grid'],
      '의미 원자': ['SegmentedControl'],
      분자: ['PeriodNavigator', 'Stat', 'SummaryCard', 'TotalRow'],
      유기체: ['PageHeader', 'DataTable', 'Drawer'],
    } },
  { name: 'CalendarPage', layer: '템플릿', role: '자원×시간 스케줄 골격 — 리소스 타임라인(행=기준축, 1·2주)/월 그리드. 데이터(attrs)·표현(encoding) 분리, 도메인 0줄. 날짜/이벤트 클릭→Drawer.',
    props: [
      { name: 'events', kind: '기능', values: 'CalendarEvent[] = { id, start, end?, label, attrs(임의 차원) }' },
      { name: 'encoding', kind: '기능', values: 'anchor(색+아이콘) · status(채움/점선) · **mark**(바 안 표식·행축 — 부품은 이게 사람인지 시공 종류인지 모른다. glyph·색·축 이름을 소비처가 준다) · rowAxes' },
      { name: 'annotations', kind: '기능', values: 'CalendarAnnotation[]{start,end,label,tone,display} — 태그(기간 표식). 배경=색+윤곽/배너, 라벨은 접힘 범례+hover 툴팁' },
      { name: 'holidays', kind: '기능', values: 'CalendarHoliday[]{date,name} — 로케일 주입(달력 무지). 주말 토파랑·일빨강은 자체' },
      { name: 'range(내부)', kind: '값', values: "'week'(기본) | 'biweek' | 'month'(그리드)" },
      { name: 'onCreate / onSelectEvent', kind: '기능', values: '() / (event)' },
      { name: 'renderEventDetail', kind: '기능', values: '(event)=>ReactNode — 상세 Drawer content 슬롯' },
      { name: 'rowMiniBar', kind: '스타일', values: 'boolean — 행 헤더 분류-구성 미니막대(기본 true, 소비처 결정)' },
    ],
    composition: {
      토큰: ['6역할 팔레트(앵커 색)', 'surface/elevation', 'raw CSS grid(명시 예외)'],
      '의미 원자': ['Text', 'Icon', 'SegmentedControl', 'Button'],
      '배치 프리미티브': ['Stack', 'Group'],
      분자: ['IconButton'],
      유기체: ['PageHeader', 'Drawer', 'EmptyState'],
    } },
  { name: 'BoardList', layer: '템플릿', role: '사내 게시판 목록 골격 — 밀도형 행(스캔 우선) + 상단 고정 공지 밴드(무테 tonal) + 필독/안읽음 강조. 작성자=실명+부서. 분류(말머리)는 데이터(노출은 소비처). 도메인 0줄.',
    props: [
      { name: 'posts', kind: '기능', values: 'BoardPost[] = { id, category?, title, author{name,dept?}, date, views?, comments?, attachments?, unread?, isNew?, pinned?, mustRead? }' },
      { name: 'categories / category / onCategoryChange', kind: '기능', values: '{value,label}[] 분류 탭(controlled) — 안 주면 탭 없음(소비처가 노출 결정). "전체"는 소비처가 포함' },
      { name: 'searchQuery / onSearchChange', kind: '기능', values: '전역 검색(controlled) — 필터의 진실은 소비처' },
      { name: 'createLabel / onCreate', kind: '기능', values: '글쓰기 = PageHeader primary 액션' },
      { name: 'onSelectPost', kind: '기능', values: '(post) — 행 클릭(보기로 이동, 소비처 조립)' },
      { name: 'page / onPageChange / totalPages / totalCount', kind: '기능', values: 'Pagination + "총 N건" 푸터(데이터가 결정)' },
      { name: 'emptyState', kind: '콘텐츠', values: '{ icon?, title, description? }' },
    ],
    composition: {
      토큰: ['surface/elevation', '6역할 팔레트(공지·필독 배지)', 'raw CSS grid(명시 예외 — board 6열 행)'],
      '레이아웃 원자': ['Container'],
      '의미 원자': ['Badge', 'SegmentedControl', 'TextInput', 'Icon'],
      분자: ['InputGroup', 'Pagination'],
      유기체: ['PageHeader', 'EmptyState'],
      공유: ['_cells(fmtNumber)'],
    } },
  { name: 'BoardView', layer: '템플릿', role: '사내 게시판 글 보기 골격 — 발행물형 읽기 + 필독 읽음확인(읽은 N/총원) · 첨부 · 이전/다음글 · 가벼운 댓글(1단 답글). 본문=도메인 슬롯. 도메인 0줄.',
    props: [
      { name: 'title / category / notice / mustRead', kind: '콘텐츠', values: '제목 + 말머리 + 공지/필독 배지' },
      { name: 'author / date / views', kind: '콘텐츠', values: '{ name, dept?, role? } 실명+부서 · 작성일시 · 조회' },
      { name: 'content', kind: '콘텐츠', values: 'ReactNode — 본문 도메인 슬롯(Modal children 동형, 소비처 조립)' },
      { name: 'attachments', kind: '기능', values: 'BoardAttachment[] = { id, name, size?, onDownload? }' },
      { name: 'readState', kind: '기능', values: '{ read, total, acknowledged?, onAcknowledge? } — 필독 읽음확인(Progress + CTA, mustRead일 때만)' },
      { name: 'actions / onBack', kind: '기능', values: '우상단 수정·인쇄·삭제(Action[]) / 목록으로' },
      { name: 'prev / next', kind: '기능', values: '{ title, date?, onClick? } — 이전·다음글 네비' },
      { name: 'comments / commentsAllowed', kind: '기능', values: 'BoardComment[] = { id, author, date, body, isAuthor?, parentId? } — parentId 있으면 부모 아래 1단 답글(들여쓰기) + 허용 토글' },
      { name: 'commentValue / onCommentChange / onCommentSubmit', kind: '기능', values: '하단 작성란 = *새 댓글* 전용(controlled)' },
      { name: 'onReplySubmit', kind: '기능', values: '(parentId, body) => void — 주면 최상위 댓글에 답글 버튼 + 중첩 인라인 폼. 대상·초안은 부품이 내부 수집' },
    ],
    composition: {
      토큰: ['surface/elevation', '6역할 팔레트(공지·필독·읽음 Progress)', 'board 전용 레이아웃(board.css — 01 4-D 소유)'],
      '레이아웃 원자': ['Container', 'Divider'],
      '의미 원자': ['Title', 'Text', 'Avatar', 'Button', 'Icon', 'Progress', 'Textarea'],
      분자: ['IconButton'],
      공유: ['_cells(renderAction·fmtNumber)'],
    } },
  { name: 'BoardWrite', layer: '템플릿', role: '사내 게시판 글 작성/수정 골격 — 분류·제목·수신자(칩+조직도 드릴)·본문·첨부·게시옵션. 본문 v1=Textarea(리치 에디터는 흡수 백로그). 도메인 0줄.',
    props: [
      { name: 'categories / category / onCategoryChange', kind: '기능', values: '{value,label}[] 분류(말머리) Select' },
      { name: 'postTitle / body / bodyFeatures', kind: '기능', values: '제목 TextInput · 본문 Editor(리치, HTML) · 본문 기능 세트(닫힘, 소비처 선택)' },
      { name: 'audiences / selectedAudiences / onAudiencesChange', kind: '기능', values: 'AudienceNode[]{id,label,exclusive?,children?,members?} — 값은 필드 표면 안 input chip(primary·✕)이 단일 진실, 그 아래 "빠른 추가"는 아직 안 담긴 것만 보이는 suggestion chip. 담기=add 한 경로 / 해제=✕ 한 경로. exclusive=배타. 안 주면 수신자 섹션 미노출' },
      { name: 'files / onFilesChange', kind: '기능', values: 'FileItem[] — FileUploader(첨부)' },
      { name: 'notice / mustRead / commentsAllowed', kind: '기능', values: '게시 옵션 — 상단 고정→필독 노출 · 댓글 허용 (누구 축은 수신자로 통일 — 공개 범위 제거)' },
      { name: 'onCancel / onSaveDraft / onSubmit / submitLabel', kind: '기능', values: '취소 · 임시저장 · 등록' },
    ],
    composition: {
      토큰: ['surface/elevation', 'board 전용 레이아웃(board.css — 01 4-D 소유: 수신자 칩/드릴·게시옵션)'],
      '레이아웃 원자': ['Container'],
      '의미 원자': ['Select', 'TextInput', 'Switch', 'Chip', 'Button', 'Icon', 'Text'],
      분자: ['FormField', 'FileUploader', 'Editor'],
      유기체: ['PageHeader'],
    } },
  { name: 'Editor', layer: '분자', role: '리치 텍스트 작성기 — TipTap(헤드리스 엔진) 흡수, 툴바·서식은 우리 토큰(무테). features 닫힌 세트로 소비처가 기능 선택. 출력 HTML.',
    props: [
      { name: 'value / onChange', kind: '기능', values: 'HTML 문자열(controlled)' },
      { name: 'features', kind: '값', values: "('bold'|'italic'|'heading'|'bulletList'|'orderedList'|'quote'|'link'|'image'|'table'|'divider')[] — 노출 툴바(기본 전체). 새 기능=큐레이션" },
      { name: 'placeholder / name', kind: '콘텐츠', values: '빈 안내 / 폼 배선(hidden HTML)' },
    ],
    composition: {
      토큰: ['surface/elevation', 'typo(프로즈 서식)', 'TipTap 엔진 격리(@tiptap/* — 헌법 7)'],
      '의미 원자': ['Icon'],
      공유: ['editor.css(프로즈·툴바 토큰 스킨)'],
    } },
  { name: 'RichText', layer: '분자', role: '저장된 리치 텍스트(HTML) 읽기 뷰어 — Editor의 짝(같은 TipTap 스키마). ProseMirror 스키마 새니타이즈. BoardView 본문 등.',
    props: [
      { name: 'html', kind: '콘텐츠', values: 'HTML 문자열(읽기 전용 렌더)' },
    ],
    composition: {
      토큰: ['typo(프로즈 서식)', 'TipTap 엔진 격리(@tiptap/*)'],
      공유: ['editor.css'],
    } },
];

// ── 그래프 헬퍼 (박물관 하이퍼링크·역참조) ──
export const LAYERS: Layer[] = ['의미 원자', '레이아웃 원자', '배치 프리미티브', '분자', '유기체', '템플릿'];
export const PART_NAMES = new Set(CATALOG.map((e) => e.name));
export const findEntry = (name: string): CatalogEntry | undefined => CATALOG.find((e) => e.name === name);

// 구성요소 칩 문자열에서 부품명만 추출 — 'Title(count)'→'Title', 'Group (헤더…)'→'Group', '아이콘박스'→그대로(비부품).
export const basePart = (entry: string): string => entry.split(/[ (]/)[0];

// 역참조: 이 부품을 구성요소로 쓰는 부품들("쓰인 곳").
export function usedBy(name: string): string[] {
  return CATALOG.filter((e) =>
    e.composition && Object.values(e.composition).some((arr) => (arr ?? []).some((v) => basePart(v) === name)),
  ).map((e) => e.name);
}
