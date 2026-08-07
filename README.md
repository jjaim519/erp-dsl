# @jjaim519/erp-dsl

> **이 문서는 LLM(조립 컴파일러)을 위한 사용 설명서다.** 작업 전 컨텍스트에 넣는다.
> ERP No-Code 빌더의 닫힌 부품 DSL — 원자·분자·유기체·템플릿 + 스키마 층(Zod).
> 깊은 근거·전체 prop 표는 [`docs/`](#9-설계-문서)에 있다. 이 README는 *틀리지 않고 조립하기 위한 지도*다.

---

## 0. 너(LLM)의 역할 — 한 문장

**자연어 요청을 「닫힌 부품의 조립 + `FieldSpec[]` 스키마」로 번역한다. 화면을 자유 생성하지 않는다.**

- ✅ 자연어 → 검증되는 스키마(`FieldSpec[]`) 변환
- ✅ 카탈로그(아래 5절)에 있는 부품만 골라 조립
- ❌ 새 컴포넌트 발명 / 화면을 자유롭게 그리기 / 임의 값 주입

근거: 도메인은 컴포넌트가 아니라 **데이터(스키마)로만** 들어온다. "발주서"는 새 부품이 아니라 `FormSection`/`ListPage`에 먹이는 `FieldSpec[]` 한 덩어리다.

---

## 1. 절대 규칙 (위반하면 빌드/린트가 에러를 낸다 — 추측으로 우회 금지)

1. **부품을 발명하지 않는다.** 5절 카탈로그에 없는 컴포넌트는 존재하지 않는다. 없으면 사람에게 되묻는다.
2. **열린 값 금지.** 임의 hex(`#3B82F6`)·임의 px(`13`)·임의 스타일 문자열을 넣을 길이 없다. 오직 **토큰 이름**(3절)과 **닫힌 enum**만 쓴다.
3. **import는 단 두 경로뿐.**
   ```ts
   import { Button, FormSection, /* 부품 */ } from '@jjaim519/erp-dsl';
   import { buildZodSchema, type FieldSpec } from '@jjaim519/erp-dsl/schema';
   ```
   `@mantine/*`를 직접 import하면 린트 에러(헌법 7). Mantine은 라이브러리 내부에 격리돼 있다.
4. **`className`·`style`은 어떤 부품에도 못 넘긴다.** (토큰 우회 통로라 노출 안 함.) 색·간격·정렬은 전부 닫힌 prop으로 표현한다.
5. **빈칸은 추측으로 메우지 않는다.** 명세가 빈 선택 슬롯은 → 기본값을 쓰거나, **빈칸을 드러내 사람에게 되묻는다.** "맞게 추측"이 아니라 "빈칸 드러내기"가 너의 일이다.
6. **검증의 진실은 스키마 하나.** 값 제약(필수·min/max·정규식)은 부품 prop이 아니라 `FieldSpec`/`buildZodSchema`에만 둔다.

---

## 2. 두 진입점

| 경로 | 내용 |
|---|---|
| `@jjaim519/erp-dsl` | 부품(원자·분자·유기체·템플릿) + `Providers`·`notify` 배선 |
| `@jjaim519/erp-dsl/schema` | `FieldSpec`·`FieldType`·`buildZodSchema`·`isFilled` (데이터 세계) |

---

## 3. 토큰 어휘 (임의 값 대신 반드시 이 이름들만 쓴다)

```
간격(gap·padding)   : xxs xs sm md lg xl xxl        (4px 베이스, 임의 px 금지)
radius              : sm md full
밀도(size)          : sm md lg                       (컨트롤만; 높이는 결과로 도출)
콘텐츠 폭(maxWidth) : narrow default wide

텍스트 색 역할      : primary secondary danger        (검정/흰색은 모드가 자동 결정)
상태색(BadgeColor)  : neutral success warning danger info
버튼 변형(variant)  : primary secondary danger ghost
폰트 스케일         : (기본) large xlarge             (<html data-font-scale>, 고령 접근성 전역 줌)
```

폰트 스케일은 부품 prop이 아니라 **루트 1회 설정**이다 — `<html data-font-scale="large|xlarge">`면 타이포·간격이 비율 그대로 함께 커진다(클라이언트별). 컴포넌트는 손대지 않는다.

색의 실제 hex·모드 분기는 `theme.ts`가 답한다. 너는 **역할 이름만** 부른다.

---

## 4. 도메인의 유일한 진입로 — `FieldSpec`

자연어로 받은 "어떤 입력칸이 필요한가"를 이 데이터로 번역한다. **함수는 절대 넣지 않는다**(직렬화·생성 불가). 외부 조회는 `lookupKey` 문자열로만 가리킨다.

```ts
type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'date' | 'checkbox' | 'lookup';

type FieldSpec = {
  name: string;                                   // 폼 값 키
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];   // select 전용
  lookupKey?: string;                              // lookup 전용: resolver 식별 문자열(함수 아님)
  span?: 1 | 2;                                    // columns=2일 때 한 줄 전체
  pattern?: string;                                // 정규식 검증(데이터 층의 유일한 열린 스칼라)
  mask?: 'phone';                                  // 입력 마스킹(명명 enum, 임의 금지)
  requiredWhen?: { field: string; filled: boolean }; // 조건부 필수(선언형)
  disabledWhen?: { field: string; filled: boolean }; // 조건부 비활성(선언형)
};
```

`buildZodSchema(fields)` → Zod 객체 스키마(타입·required·정규식·조건부 필수). LLM이 뱉은 값이 렌더러에 가기 전 런타임 관문이다.

---

## 5. 부품 카탈로그 (고를 수 있는 선택지의 전부)

> 각 부품의 **닫힌 prop과 enum 값**만 적는다. 전체 prop·미노출 사유·근거는 [`docs/02_토큰과구현.md`](docs/02_토큰과구현.md).
> 표기: `prop: 값` / 닫힌 enum은 `a|b|c`. 공통적으로 `className`·`style`은 어디에도 없다.

### 의미 원자 — 표시·행동 (18)
- **Button** `variant: primary|secondary|danger|ghost` · `size: sm|md` · `loading` `disabled` `fullWidth` `leftIcon` `rightIcon` `onClick` `type: button|submit` · `ariaLabel?`(텍스트가 있는데 *맥락*이 필요할 때. 아이콘 전용은 IconButton)
- **IconButton** `icon: IconName` · `label`(aria 필수) · `variant`(Button과 동일) · `size: sm|md`
- **Badge** `color: neutral|success|warning|danger|info` · children=string
- **CountBadge** `count`(0 이하면 안 보임) · `tone: danger|neutral`(기본 danger=행동요구) · `max?`(기본 99, 초과 "N+") · `dot?` · `showZero?`(0도 그림 — 단계별 큐처럼 "0건"도 정보일 때. 이때 tone=neutral 권장) — 알림 카운트(솔리드 빨강 N). 상태=Badge와 역할 분리
- **Chip** `color`(상태색+neutral) · `selected` `onChange` `onRemove`
- **Text** `variant: body|body-strong|caption` · `color: primary|secondary|danger`
- **Title** `variant: display|heading|subheading`
- **Label** `htmlFor` (타이포·색 고정)
- **Anchor** `href`
- **Icon** `name: IconName`(91종, `Icon.tsx` 참조) · `size: sm|md|lg` · `color`(텍스트 역할)
- **Avatar** `src` · children=이니셜 · `size`
- **Image** `src` `alt` `fallbackSrc` · `fit: cover|contain` · `radius: sm|md|full` · `size: sm|md|lg|full|fill`(full=컨테이너 폭 4:3 잠금 / fill=부모 박스 cover)
- **Tooltip** `label` · children
- **Popover** `content`(부품 슬롯) · `opened` `onChange` · `position: top|bottom|left|right` · `align: start|center|end`(start=드롭다운형 좌측정렬) · `reposition: flip|fixed|anchored`(fixed=화면 안 유지, anchored=좌상단 앵커 완전 고정·오른쪽/아래로만 성장·점프 0) · `width: sm|md|lg|xl|auto`(auto=내용폭·컬럼 수 따라 동적, MillerColumns 다단용) · `block`(트리거를 소비처 폭에 맞춰 줄임 → 트리거 안 말줄임용)
- **Spinner** `size`
- **Skeleton** `variant: text|block|circle` · `lines`(text) · `size: sm|md|lg` · `radius: sm|md` — 로드 전 자리표시(레이아웃 부품 안에 박아 형태 보존; 비결정형 점은 Spinner)
- **Progress** `value: 0~100` · `tone: primary|success|warning|danger` · `size` — 결정형 진행률(끝 모르는 로딩은 Spinner)
- **SegmentedControl** `options` `value` `onChange` · `size` `fullWidth`  ← 같은 대상의 뷰/모드 토글
- **TabBar** `options: {label,value,count?,countTone?,showZero?}[]` `value` `onChange`  ← 다른 구획으로 전환(`count`→CountBadge, 단계별 큐는 `showZero`+`countTone:'neutral'`)

### 의미 원자 — 입력군 (13)
공통: `value`/`onChange`(controlled 전용) · `name` · `size: sm|md` · `disabled` · `placeholder`. **`label`·`error`·`required`는 입력칸이 아니라 `FormField`가 소유**.
- **TextInput** / **PasswordInput** / **NumberInput**
- **Textarea** `autosize` · `variant: field|canvas`(기본 field) — **canvas**=*글을 쓰는 면*(게시글 본문·메모): 비어 있어도 여러 줄로 시작해 "여기가 본문"을 형태로 말한다. 줄 수는 부품이 정한다(minRows/maxRows는 안 연다 — 열면 소비처마다 본문 높이가 갈린다)
- **CurrencyInput** `value: number|string` — 돈 입력(₩ prefix·천단위 콤마·무소수). NumberInput 형제(표시만 통화, 저장·검증은 number)
- **Select** `options: {label,value}[]` · `value: string`(단일)
- **Radio** `options` · `value`(단일)
- **DatePicker** `value`(Date/ISO) · **MultiDatePicker** `value: string[]`(개별 날짜 집합) — 표시 형식은 **`YYYY-MM-DD` 고정**(`DATE_FORMAT` 단일 출처, 표 셀 `type:'date'`와 같은 표기). **prop으로 안 연다** — 소비처마다 갈리면 같은 값이 화면마다 다르게 읽힌다. 달력 안쪽 한글·월요일 시작은 `Providers`의 `DatesProvider`가 세운다
- **Checkbox** / **Switch** `checked`/`onChange` · 인라인 `label`은 유지
- **Combobox** `options` `value`(단일) `clearable?` — 검색되는 Select(대용량 옵션 타이핑 필터)
- **TimePicker** `value: "HH:MM"` — 시각 입력(날짜는 DatePicker)

### 레이아웃 원자 (4) · 배치 프리미티브 (5)
- **Card** `variant: elevated|outlined|flat` · `padding: none|sm|md|lg` · `fill`(부모 높이 채움)
- **Divider** `orientation: horizontal|vertical`
- **Page** children만 — AppShell 아래 **모든 화면의 폭 규율**(1200 캡 + 중앙정렬). 페이지별 폭 오버라이드 없음. 1200을 넘겨야 하는 콘텐츠는 페이지 폭을 깨지 말고 그 위젯 안에서 가로 스크롤
- **Container** `maxWidth: narrow|default|wide`  ← 위젯·폼 내부의 좁은 읽기 컬럼용(페이지 최상위는 Page)
- **Stack**(세로) `gap`(토큰) · `align: start|center|end|stretch` · `justify: start|center|end|between`
- **Group**(가로) `gap` · `align: start|center|end` · `justify: …|between` · `wrap`
- **Grid** `columns: 1|2|3|4|6|12` · `gap` · 자식 `Grid.Col span: 1~12`
- **Bento**(페이지 본문 격자, 전 PageGrid) `columns: 2|3|4|6|12` · `gap: sm|md|lg` · `fill`(작업면 모드=행이 부모 잔여고 등분) · 타일 `Bento.Tile colSpan` `rowSpan: 1|2|3` — 고정 셀 높이(가변 높이 불허·iOS 홈식)
- **ListDetail** `list` `detail` `collapsed?` — 평면 목록 + 프리뷰 2-pane(12열 중 **5:7**, **상세는 sticky**, 0건이면 1열). 좌=QueueList / 우=DecisionPanel이 표준 조합. 계층 마스터-디테일은 HierarchyExplorer, 정보+폼은 DetailPage

### 분자 (27) — 원자를 결합·일부 상태 고정
> 모바일 전용 분자 10종은 아래 「모바일 계열」에 따로 있다(시각 체계가 정반대라 섞어 쓰지 않는다).
- **FormField** — 입력 컨트롤을 children으로 받아 `label`·`withAsterisk`·`error`(메시지+빨간 테두리)를 두름. **모든 입력칸은 이걸로 감싼다.**
- **MultiSelect** `options` `value: string[]` · **DateRangeField** `value: {start,end}`
- **InputGroup** `leftAddon`/`rightAddon: string|<Icon>` · **FileUploader** `value: FileItem[]`
- **Pagination** `total` `value` `onChange` · **Callout** `tone: info|warning|danger|neutral` `title?` (비휘발 인라인 안내)
- **StatusRow** `label` `status:{label,tone}` `actions` · **SummaryCard** `label` `count?` `amount?` `tone?` (KPI 타일)
- **TotalRow** `label?` `amount`(합계 행) · **Menu** `trigger` `items: Action[]` `header?`
- **ObjectCard** `title` `subtitle?` `status?` `thumbnail?`/`icon?` `headline?` `attributes?` `actions?` `onClick?` — 단일 사진 카드(역할 슬롯, 자유 render 0). 높이는 그리드 셀이 분배
- **SectionHeader** `title|titleNode` `controls?`(좌측 도구) `actions?`(우측 액션) `divider?` · **Breadcrumb** `items: {label,onClick?}[]`(마지막=현재)
- **Collapsible** `header`(요약 슬롯) `children`(상세) `defaultOpen?` — **단독 토글 1개**(헤더 클릭). 여러 섹션 조율(하나만/동시 열림)은 **Accordion**(직접 쌓지 않는다)
- **Accordion** `items: {value,label,children,tone?:'attention',color?:BadgeColor}[]` `multiple?` `defaultOpen?` `clearAttentionOnOpen?` — 여러 섹션 펼침 조율(`multiple`=동시 열림). 기본 회색+그림자(윤곽 최소). `tone:'attention'`=강조 행(틴트 채움+얇은 틴트 윤곽, `color` 토큰 기본 danger), `clearAttentionOnOpen`=펼치면 강조 해제. Collapsible 쌓기 대체
- **Stat** `label` `value`(포맷된 표시값) `trend: up|down|flat` `delta?` `icon?` — 단일 지표+추세(건수/금액 요약은 SummaryCard)
- **TreeSelect** `nodes: TreeNodeData[]` `value`(node id) — 계층 노드를 값으로 선택. **Tree(파인더/표시)와 독립**
- **Cascader** `options: {value,label,children}[]` `value: string[]`(경로) — 계층 경로 **순차 선택**(한 칸 고르면 다음 칸, 페이지에 N박스). 리프 시 "A › B › C [변경]" 압축. 드롭다운 박스는 MillerColumns와 같은 컬럼-아이템 레이아웃
- **MillerColumns** `options: {value,label,children}[]` `value: string[]`(경로) — **트리거 1개 → 팝오버 다단 컬럼**(좌→우, Finder·Ant Cascader 패턴). 좁은 화면(≤600px)은 단일 컬럼 드릴인 폴백. 페이지 발자국 최소. Cascader의 형제(같은 박스, 다른 배치). 대용량 검색은 Combobox 위임
- **SearchToolbar** `searchValue` `onSearchChange` `searchPlaceholder?` `filters?: {key,label,options,value,onChange}[]` — 목록 상단 검색+필터+활성 필터칩
- **PeriodNavigator** `label`(포맷된 기간 문자열) `onPrev` `onNext` `disabledPrev?` `disabledNext?` — 기간 한 칸 이동(‹ 라벨 ›). 돈 화면 기간 스코프(LedgerPage)
- **NumberStepper** `value` `onChange` `min?` `max?` `step?` `size?` — 수량 −[n]+ 스테퍼(타이핑 가능, B2B 대량). min/max는 UI 조작 한계(검증은 스키마)
- **Editor** `value`(HTML) `onChange` `features?: ('bold'|'italic'|'heading'|'bulletList'|'orderedList'|'quote'|'link'|'image'|'table'|'divider')[]` `placeholder?` `name?` — 리치 텍스트 작성기. **TipTap(헤드리스 엔진) 흡수**, 툴바·서식은 우리 토큰(무테). `features` 닫힌 세트로 소비처가 기능 선택. 출력 HTML
- **NoteThread** `notes: ThreadNote[]` `draft`/`onDraftChange`/`onSubmit` `onEdit?`/`onDelete?` `submitting?`/`busyId?` — 데스크탑에서 **쓰기 가능한 누적 메모**(MobileComment+MobileComposer의 데스크탑 짝). Enter 제출은 부품이 form을 소유해 해결. 빈 상태 문구 없음(입력칸이 이미 말한다). 자기 표면 없음 — 남의 섹션 안에 들어간다
- **RichText** `html` — 저장된 리치 텍스트(HTML) 읽기 뷰어. **Editor의 짝**(같은 TipTap 스키마 → 새니타이즈). BoardView 본문 등에서 작성물 그대로 렌더

### 유기체 (29) — 화면 한 구획, 도메인은 스키마로만 주입
- **Modal** `opened` `onClose` `title` `actions` `size: sm|md|lg|xl|full`(full=95vw·90vh, 풀스크린 아님) · children=본문
- **DataTable** `columns` `rows` `status: loading|empty|ready` · controlled 정렬·페이징 · `onRowClick`
- **DataSheet** — DataTable의 **쓰기 형제**(행 수정 + 맨 아래 초안 줄 1개). 저장된 행은 읽기다: 편집 신호를 상시로 깔지 않고 ⋮「수정」·Enter로 **행 전체**가 열린다(상시 인라인은 "어느 칸이 편집되는지 모르겠다"가 대표 불만). 「행 추가」 버튼 없음 — 미저장 줄을 N개 쌓으면 값의 주인이 rows와 둘이 된다. 열은 read×edit 2축(배지로 보이지만 select로 고치는 상태 열을 표현하려면 하나로 못 묶는다). `edit` 없는 열 = **파생 칸**이고, 초안 줄의 파생값은 `draft.derive(values)`가 준다 — 거래 후 잔고·금액(수량×단가)처럼 **치는 중에 대조하는 확인용 숫자**가 사는 자리(렌더 중 호출이라 순수해야 하고, 표시에만 쓰여 `onCreate`로 안 넘어간다)
- **EmptyState** `icon` `title` `description` `action?`
- **PageHeader** `title` `description?` `actions?` · **DescriptionList** `items` `columns: 1|2|3`
- **AppShell** `logo` `menuItems`(`count?`→CountBadge) `activePath` `onNavigate` `profile` `notification` · children=콘텐츠 · **2티어 반응형(자동)**: 데스크탑 ≥1280 풀 넷바 260(로고+메뉴+하단 유틸리티) / 태블릿 768–1279 아이콘 레일 72(로고 없음). **상단바 없음** — 알림·프로필은 넷바 하단 유틸리티 존. **폰은 범위 밖**(MobileShell이 받는다): `APPSHELL_MIN_WIDTH`(768) export를 소비처가 import해 **같은 값으로 모바일 라우팅을 판정**한다(각자 숫자를 들면 반드시 어긋난다). 하한 아래는 가로 스크롤로 예측 가능하게 무너지는 안전망
- **Timeline** `events: TimelineEvent[]` · **Calendar** `month` `events: CalendarEvent[]`(월 뷰 단일)
- **Tree** `nodes` controlled 선택·펼침 · `editable`(쓰기 게이트)
- **FieldGrid** `columns` `rows: FieldGridCell[][]`(셀=`label?`|`field?`|`image?`|`node?`, `colSpan?` `rowSpan?` `align?`) `fields: FieldSpec[]` `mode: edit|read` `size: sm|md|lg`(기본 md — 타이포·행 단위·세로패딩 한 세트, 행 높이는 타이포 따라 동적) `values` `onChange` `errors?` — 테두리 셀 격자(장표/帳票). 작성·확인 양용·**같은 기하**(셀 박스 불변, read=같은 입력 원자 inert 재사용). `node`=비표준 컨트롤 통째 슬롯(4종 배타·mode 무관). 머리표(라벨:값)·명세표(헤더+값 행)·대분류 밴드 다 같은 모델
- **Drawer** `opened` `onClose` `title` `actions?` `position: left|right|top|bottom` `size: sm|md|lg|xl|full`(full=축 95%) — 가장자리 슬라이드 패널(뒤 맥락 유지; 차단형은 Modal)
- **PaperModal** `opened` `onClose` `title` `actions?` `orientation: portrait|landscape` · children=표준 A4 캔버스(794×1123) 기준 문서 — **순수 A4 문서 뷰어**. 종이가 자기 윤곽을 가짐(모달 아님), JS 실측 fit(transform scale). 모달 폭=가로 A4 고정, 헤더 토글 **자세히**(기본·폭 채워 확대·세로 스크롤) / **전체**(통째·무스크롤). 내용은 소비처(보통 FieldGrid). **인쇄 빌트인**(`@media print`: 종이만 물리 A4 1:1·1장·머리말꼬리말 제거·디바이더 크리스프 — 트리거 버튼만 `actions`로 소비처 배선)
- **PaperDoc** `spec: PaperSpec` `values` `scale?` `mode: view|edit` `onChange?` `readonlyFields?` — 서식+값 → **A4 여러 장**. 배치(쪽 나눔·반복 펼침·집계·묶음 걸침)는 순수 엔진이 하고 여기는 그리기만. 격자는 *정렬 골격*이고 **선은 셀의 속성**이다(각 칸은 자기 위·왼쪽만 그린다 — 안 그러면 맞닿은 자리가 2px). 괘선은 검정 고정. `edit`이면 데이터 자리가 입력이 되되 **문서 기하는 그대로**(칸이 곧 입력의 크기). 서식은 엑셀에서 만든다 → §8-2
- **PaperDocModal** `opened` `onClose` `title` `spec` `values` `mode: view|edit` `onSave?` `readonlyFields?` `actions?` — 문서를 **보고·인쇄하고·채우는** 모달. **보통 이걸 쓴다**(PaperDoc은 문서를 화면에 직접 박을 때). 초안·더티는 모달이 쥔다 → 소비처는 `onSave` 하나만 배선하고, 안 저장하고 닫으려 하면 푸터가 확인으로 바뀐다. 인쇄·배율은 보기에만(작성 중엔 100% 고정). `actions`=소비처 CTA 자리(발송·승인 등 — 닫기/인쇄/저장은 빌트인). **PaperModal과 헷갈리지 말 것**: 그쪽은 children을 받는 1장짜리 뷰어다
- **Stepper** `active`(index) `steps: {label,description?}[]` `orientation?` `onStepClick?` — 다단계 진행 표시(콘텐츠는 호출측이 active로 분기)
- **Transfer** `items: {value,label}[]` `selected: string[]` `onChange` `titles?` — 좌·우 듀얼 리스트 대량 배정(인라인 다중은 MultiSelect)
- **ToastHost** (props 없음) — 토스트 호스트(위치·지속·스택 단일 관리). 트리거는 `notify.*`, 앱 셸에 1회 배치
- **LineItemList** `items: LineItem[]` `onQuantityChange` `onRemove?` `showTotal?` `showAmount?` `unit?` — 그룹·소계·합계·컴팩트 ✕ 라인아이템(수량=NumberStepper). 자체 surface 없음(소비처가 well에 담음)
- **ListWidget** `columns: ListColumn[]` `data: ListRow[]` `search?` `selectable?`/`bulkActions?` `pageSize?` `title?`/`primaryAction?` `onRowClick?` `emptyState?` `status` — 목록을 raised 표면 하나에 담는 위젯(**TanStack Table 흡수**). 툴바(검색·facet 필터)·벌크바를 표면 *안*에 소유. ListPage의 위젯판
- **NotificationPanel** `items: NotifItem[]` `onMarkAllRead?` `onViewAll?` `emptyLabel?` — AppShell 알림 `content` 슬롯에 꽂는 패널(헤더/목록/푸터 3층, 시간 그룹 라벨은 소비처). 날짜 로직 0

**큐·결정 계열 (2)** — "한 건을 골라 다음 단계로 넘긴다" 화면의 좌·우. `ListDetail`(배치)이 둘을 담는다:
- **QueueList** `items: QueueItem[]` `selectedId`/`onSelect` `selectionMark: fill|radio` `status: ready|loading|empty` `skeletonRows?` `emptyState?` — 평면 목록 + **선택 상태**(ListWidget=표·선택 없음 / StatusRow=골격 고정 / MobileListRow=모바일). 행=`{ mark?{label,weight: quiet|outline|solid}, title, titleMuted?, meta?[{text,tone,icon?}], badge?, disabled? }` — **도메인 어휘는 라벨 문자열로만**(raw 노드 슬롯 아님). 선택 표현은 prop으로 못 바꾼다(모양+굵기 이중 단서=WCAG 1.4.1). mark 폭·구분선 인셋·`·` 구분자·행 높이는 부품 소유
- **DecisionPanel** `title`/`subtitle?` `sections: DecisionSection[]` `primaryAction`(+`disabled?`/`disabledReason?`) `secondaryActions?` `actionNote?` — **하단 고정 액션 바를 소유**한 상세 패널(주 CTA는 언제나 맨 오른쪽, 보조가 그 왼쪽에 붙는다). 잠금 CTA는 `disabled` 속성이 아니라 **잠금+사유 안내**(disabled 버튼은 포커스를 못 받아 사유가 도달 안 함). ⚠ sticky 바는 **부모가 높이를 줘야** 성립

**저작 툴킷 (5)** — "값을 만드는 면"의 부품. 도메인 무지, 계산은 표시용만(실제 파이프라인은 소비처):
- **Repeater** `items` `renderItem` `renderHeader?` `onAdd`/`onRemove`/`onReorder?` `addLabel` `collapsible?`/`defaultOpen?` `min?`/`max?` `emptyState` — 가변 레코드 목록의 크롬만 소유(추가·삭제·펼침). 본문은 raw 슬롯이라 소비처가 원자로 조립, 중첩 가능
- **InheritedValueField** `refOptions: RefOption[]` `refId`/`onRefChange` `override`/`onOverrideChange` `ratio?` `format?` — 참조(SSOT)+상속+override+배율을 한 부품에 봉인. `effective = (override>0 ? override : ref.price) × ratio`를 부품이 계산·표시(손조립 시 금액이 조용히 틀리는 것을 원천봉쇄)
- **ExpressionField** `value`/`onChange` `variables: ExprVariable[]` `functions?` `validate?: live|off` — 닫힌 DSL 수식 편집기(하이라이트 + 미지 변수·괄호·비교 리터럴 live 검증). 문법은 패키지, 변수는 소비처 주입
- **KeyValueField** `keys: KVKey[]` `value`/`onChange` `valueType?: number|currency` — 닫힌 키집합 → 수치 맵 편집(각 키 1회)
- **AssignPicker** `templates: AssignTemplate[]` `kind` `onAssign` `confirmReapply?` — 템플릿 kind별 배정(필터 리스트 → 재적용 경고 Modal → 위임). kind는 불투명 태그(동등 비교만)

**OptionSet 계열 (4)** — 저작 면이 *쓰고* 선택 면이 *읽는* 단일 계약(`optionset.ts`: `OptionGroup`·`Choice`·`OptionSelection`·`OptionNode`). 변환 계층 금지, 금액 계산 0:
- **OptionSetEditor** `groups`/`onChange` `usage?` `title?` `readOnly?` — 옵션 *정의* 저작(2-pane: 좌 트리(옵션→묶음) / 우 표 작업면 + 단일 옵션 미리보기). 모든 쓰기는 `onChange` 하나
- **OptionSetComposer** `nodes`/`onNodesChange` `library: OptionGroup[]` `onEditOption?`/`onCreateOption?` `labels?` — 구성(부착) 저작. 정의는 라이브러리 참조·부착과 순서는 노드의 속성. 미리보기는 Picker 통째 내장
- **OptionSetPicker** `mode: idle|pick|configure` `groups`/`selection` `onPick`/`onPickMany?`/`onQty`/`onNum` `display?` `search?` `defaultCollapsed?` `subtotal` `primary` — 정의를 읽어 *고르는* 선택 면. 표현 어휘(cards/grid/list/chips/stepper/input)는 값 개수로 **자동 도출**, `display`는 override. **값묶음(`Choice.group`)은 기하와 직교한 레이어**(기본=구획 밴드 블록 / 값>10=필터 칩)이고 **정렬 책임은 부품**(`bundleBlocks`)
- **CompositionOutline** `sections: CompositionSection[]` `summary?` `addLabel?`/`emptyHint?` `footer?` `onAddToSection`/`onSelectLine`/`onDeleteLine` — 2-pane 우측 "작성물 카드 스택". 카드는 라인이 있거나 작성 중인 섹션만, 추가는 상단 단일 버튼 + 계층 메뉴

### 모바일 계열 (16) — AppShell 계열의 *형제*(축소판 아님)

> **`Mobile*` 접두가 곧 경계다.** 폼도 갈린다 — 모바일에서는 `FormField`(상자)가 아니라 **`MobileField`(밑줄)**, 작은 선택지는 `Select`가 아니라 **`MobileChoice`(칩 줄)**를 쓴다. 면·그림자를 안 쓰고 **배경 + 가로 헤어라인**으로만 나눈다(무테 지향의 반대 — 모바일의 정체성이 이긴다). 데스크탑 부품과 시각 체계가 정반대라 **섞어 쓰면 안 된다**. 입력은 전용 부품을 두지 않는다 — `FormField` + 입력 원자를 그대로 쓰고, 타이포·44pt 터치타깃은 셸 스코프가 처리한다.

- **MobileShell**(유기체) `header?: { title?, onBack?, backLabel?, actions? }` `tabs: MobileTab[]`(**상한 5**) `activePath`/`onNavigate` `bottom?`(탭 위 고정 한 칸 — CTA든 입력 바든) · children=유일한 스크롤 영역
  - **헤더 행은 하나이고 항상 있다.** `header`는 *행에 무엇을 놓을지*만 정한다 — 생략해도 행은 남는다(고정 52px). 그래서 탭을 오가도 본문 시작선이 안 튄다
  - `title`은 문자열이거나 **값 제목** `{ value, onPrev, onNext }`(달력의 'YYYY년 M월'처럼 보고 있는 범위가 곧 이름인 경우 — ‹ ›는 제목에 붙는다)
  - `actions` 상한 2, 첫째만 텍스트(기본 `accent` — 안 채움). **커밋은 `bottom`**
  - **목적지가 5를 넘으면 허브**(「전체」 탭). 허브는 넘친 것을 담는 통이 아니라 **전체 목적지 색인**이고, 탭은 그중 상위 K개로 가는 바로가기다. **부품이 아니라 화면** — `MobileSection` + `MobileListRow`로 조립한다(06 §2-4)
  - `activePath`는 **어느 탭이 활성인가**를 정한다(현재 화면 경로가 아니다) — 허브를 거쳐 들어간 화면은 허브 탭의 path를 넘긴다
- **MobileSection** `title`/`action?` `flush?` · children — 묶음을 카드가 아니라 경계선이 만든다. **내용이 없으면 본문을 안 그린다**(제목만 남는 빈 여백 블록 금지)
- **MobileField** `label` `required?` `error?` · children — 모바일 폼의 한 칸(**밑줄 필드**). 라벨은 위(모바일 inline 라벨 금지 — Baymard), 포커스·에러는 **밑줄 색**으로 말한다
- **MobileChoice** `options` `value`/`onChange` — 닫힌 선택지 하나 고르기(**가로 스크롤 칩 줄**). 폰에서 Select는 두 동작 + 오버레이라, 선택지가 몇 개면 전부 보여주고 한 번에 고른다. 꺽쇠(⌄)는 *펼침*에만 남는다
- **MobileListRow** `title`/`meta` `leading`/`badges`/`trailing` `onClick?`(있으면 chevron) `emphasis?`(아직 안 본 행 — 제목 굵기) — 누르면 *다른 화면으로*
- **MobileDisclosure** `title`/`meta` `defaultOpen?` · children — 그 자리에서 펼쳐지는 행(이동=›  / 펼침=⌄)
- **MobileStatRow** `items: MobileStatItem[]` — KPI 2~4개 균등 분할 + 세로 헤어라인
- **MobilePhotoPicker** `value: FileItem[]`/`onChange` `max`/`disabled` — 정사각 썸네일 격자(폰엔 드래그가 없어 FileUploader를 못 쓴다)
- **MobilePaperViewer**(유기체) `opened`/`onClose` `title` `children` `orientation?` `actions?` — 폰의 **A4 문서 뷰어**(PaperDocModal·PaperModal의 형제). 하는 일은 하나다: **인쇄 좌표계로 그려진 문서를 폰에서 훑어보게 한다**(그리지도 다시 쓰지도 않는다). `children`은 A4 폭 그대로 그린 문서 — 보통 `<PaperDoc spec values />`. **배율을 걸어서 넘기지 않는다**(배율은 이 부품이 소유 — 소비처가 자기 fit을 걸면 두 겹). 높이는 여기서 재므로 **몇 장이든 된다**. `orientation`은 **폭만** 정한다. 확대: 폰은 폭이 늘 구속조건이라 **폭맞춤이 곧 「한 장 전체」**(세로 A4 556px < 무대) → 열자마자 폭맞춤, **더블탭으로 폭맞춤↔100%**(탭 지점 앵커), 핀치가 그 사이를 연속으로. 핀치는 multipoint라 하단 확대율 표기 자체가 단일 포인터 대안 버튼이다(WCAG 2.5.1 / 1.4.10 2차원 예외). **인쇄 스코프는 없다** — 「문서 밖 치우기」는 화면을 소유한 쪽만 할 수 있고 이 커버는 앱 트리 안이라, 인쇄는 소비처 몫이다<br/>  ⚠ **v0.77.0 breaking** — v0.75의 「읽기 뷰」(장표를 라벨-값으로 투영)와 `columns`/`rows`/`fields`/`values` 계약을 걷어냈다. `PaperCell`은 좌표와 text/field/border만 갖고 라벨-값 짝은 «왼쪽 칸이 라벨»이라는 시각적 인접성 추론으로만 성립한다 — 되살리면 Adobe Liquid Mode와 같은 처지가 된다. 투영을 안 하니 구조가 필요 없어 계약이 `children`으로 돌아왔다
- **MobileCalendar** `month` `selected`/`onSelect` `events`/`encoding`/`annotations`/`holidays` `maxLanes?` — 월 달력. **스팬 바**로 기간을 읽는다(점 아님). 데스크탑 CalendarPage와 **같은 타입·같은 레인 알고리즘**(변환 0). 월 제목·이동은 이 부품이 아니라 **셸 헤더의 값 제목**이 갖는다
- **MobileComment** `comment: BoardComment` `authorLabel?` `onReply?` — 1단 답글(데스크탑 BoardView와 타입 공유)
- **MobileComposer** `value`/`onChange`/`onSubmit` `replyTo?` `placeholder`/`disabled` — 하단 고정 입력 바(셸 `bottom`에 꽂음)
- **MobileFileRow** `name`/`size` `onDownload?` — 첨부 행(말줄임을 왼쪽에서 — 확장자가 끝에 있다)

**모바일 게시판 3화면** — 데스크탑 `Board*`와 **같은 타입**(`BoardPost`·`BoardComment`·`BoardAttachment`·`AudienceNode`)을 받는다. 소비처는 데이터 한 벌로 두 화면을 그린다(변환 0):
- **MobileBoardList** `posts: BoardPost[]` `categories?`/`category?`/`onCategoryChange?` `searchQuery?`/`onSearchChange?` `onSelectPost?` `onLoadMore?`/`totalCount?`(더보기 노출은 **데이터가 결정** — 다 불러왔으면 안 뜬다) `emptyState?` — 데스크탑의 6열을 폰의 3층(배지 줄/제목/보조 줄)으로 접는다. 공지=별도 구획 · 안읽음=제목 강조+점 · 분류=가로 스크롤 필터 칩 · 번호 페이징 대신 **더보기**
- **MobileBoardView** `title`/`author`/`date`/`views?` `content` `attachments?` `readState?`(필독 읽음확인) `prev?`/`next?` `comments?`/`commentsAllowed?`/`onReply?` — 데스크탑 기능 전부. **댓글 작성란은 이 부품에 없다** — 셸 `bottom`의 `MobileComposer`가 받고 답글은 대상 태깅(`onReply`)으로 말한다
- **MobileBoardWrite** `categories`/`category` `postTitle` `body` `audiences?`(조직도 드릴) `files?`(문서 포함) `notice?`/`mustRead?`/`commentsAllowed?` — 작성 기능 전부. 수신자 포섭 규칙은 데스크탑과 **같은 모듈**. **등록·취소·임시저장은 셸이 소유** — 임시저장은 등록과 같은 위계가 아니라 *안전망*이라 상단 보조 액션 자리(자동 저장 + 이탈 확인과 한 벌)

### 페이지 템플릿 (9) + 폼 조립 조직 (1) — `FieldSpec[]`·스키마 구동, 도메인 0줄
- **ListPage** `schema` `rows` `status` · 정렬·페이징·`totalCount`
- **DetailPage** `title` `info`(DescriptionList) `form?`(FormSection) — 좌 정보 / 우 폼 2분할
- **HierarchyExplorer** 좌 Tree(+검색 바) / 우 하위 분류 타일 + 직속 제품 목록(DataTable) 공존 — 계층 마스터-디테일(한 디렉토리에 하위 분류·제품 동시). 추가=우측 ＋ 드롭다운(제품/분류). 검색=분류 헤더 아래, 결과=우측 목록(분류 경로 컬럼)
- **HierarchyCollector** `catalogs` `products` `cart` `onCartChange` `showAmount?` `onProductClick?` — 계층에서 *수집*(HE의 짝). 좌 브라우즈 / 우 카트 well, 책갈피 횡단·수량 누적·고정 합계. `@container` 반응형
- **LedgerPage** `period`(PeriodNavigator) `metrics`(KPI 밴드: Stat/SummaryCard) `breakdown`(SegmentedControl→DataTable→TotalRow) `detail?`(Drawer 드릴) — 돈 지표 페이지(정산·매출 등)
- **CalendarPage** `events: CalendarEvent[]`(attrs 임의 차원) `encoding`(anchor 색·status 채움·person 아바타) `holidays?` `onCreate?` — 자원×시간 스케줄(리소스 타임라인 1·2주 / 월 그리드). 데이터·표현 분리, 날짜/이벤트 클릭→Drawer
- **BoardList** `posts: BoardPost[]` `categories?`(말머리 탭) `searchQuery?`/`onSearchChange?` `onCreate?` `onSelectPost?` · 페이징·`totalCount` — 사내 게시판 목록(밀도형 행 + 상단 고정 공지 밴드 + 필독/안읽음 강조)
- **BoardView** `title` `author` `content`(ReactNode 본문 슬롯, 보통 RichText) `notice?`/`mustRead?`+`readState?`(읽음확인) `attachments?` `prev?`/`next?` `comments?` `actions?` `onBack?` — 게시판 글 보기(발행물형 + 읽음확인·이전다음·댓글)
- **BoardWrite** `categories`+`category` `postTitle` `body`(HTML)+`bodyFeatures?` `audiences?`(칩+조직도 드릴, 안 C) `files?` `notice?`/`mustRead?`/`commentsAllowed?` `onSubmit?` — 게시판 작성(본문=**Editor**, 수신자=칩+조직도)
- **FormSection** `fields: FieldSpec[]` `values` `onChange` `columns: 1|2` `resolvers?` `errors?` — 타입→원자 매핑·FormField 감싸기를 자동 수행

### 공유 어휘 타입
- **`Action`** = `{ label; variant?; onClick; icon?: IconName; iconOnly? }` — 버튼은 이 형태로 넘기고 배치는 부품이 고정한다.
- **`CellType`**(DataTable·ListWidget·DescriptionList·ObjectCard 값 표현, 16종): `text badge number currency date boolean actions menu user tags link percent secondary relative-time thumbnail chevron`
- **`notify`** (휘발 피드백): `notify.success|danger|warning|info(...)` — 스키마 밖 코드 배선. **작업 결과만**; 필드 검증은 인라인 FormField.
- **`APPSHELL_MIN_WIDTH`** = 768 — AppShell 지원 하한. 소비처는 **이 상수를 import해 모바일 라우팅을 판정**한다(같은 숫자를 각자 들지 않는다).
- **`bundleBlocks(choices)` / `bundleLabels(choices)`** — OptionSet 값묶음 계약의 유일한 구현(첫 등장 순서 유지·묶음 안 순서 유지·무묶음은 밴드 없는 선두 블록). **정렬 책임은 부품** — 소비처는 값 순서를 자유롭게 준다.

---

## 6. 조립 결정 가이드 (소프트 관습 — 강제 아님, 판단 기준)

- **Group vs Grid:** 자식이 내용 크기대로 흐르면 **Group**, 비율(1:2 등)을 *지정*하면 **Grid**. 한 행만 있어도 비율 지정이면 Grid.
- **단일 선택 부품:** 폼 제출값 → `Radio`/`Select`(선택지 ~5개 기준 Radio) · 같은 대상 뷰/모드 토글 → `SegmentedControl` · 다른 구획 전환 → `TabBar`.
- **Modal vs Drawer:** 뒤 화면(목록·상세)을 보면서 옆에서 보조작업(긴 폼·필터·연속 처리) → **Drawer**; 흐름을 막고 단일 결정/확인(차단) → **Modal**.
- **Collapsible vs Accordion:** 단독 토글 1개 → **Collapsible**; 여러 섹션(하나만/동시 열림) → **Accordion**(`multiple`). Collapsible을 쌓아 그룹을 만들지 않는다.
- **"이건 부품일까 스키마일까":** 정의에서 도메인(예: "발주")을 빼도 말이 되면 부품, 안 되면 스키마다. "발주항목카드"는 없다 → `DataTable` + 발주 `FieldSpec[]`.
- **변형이 필요하면 옵션을 쌓지 말고** 사람에게 새 부품 큐레이션을 요청한다(토글 15개 = 무한 공간 부활).
- **한 화면의 primary 행동은 하나.** PageHeader에 주 행동이 있으면 EmptyState의 action은 비운다.

---

## 7. 완성 예제 (조립의 논리)

```tsx
import { FormSection } from '@jjaim519/erp-dsl';
import { buildZodSchema, type FieldSpec } from '@jjaim519/erp-dsl/schema';

// 1) 자연어 "업체명(필수)·등급·전화" → FieldSpec[]
const fields: FieldSpec[] = [
  { name: 'company', label: '업체명', type: 'text', required: true },
  { name: 'tier', label: '등급', type: 'select',
    options: [{ label: '일반', value: 'std' }, { label: 'VIP', value: 'vip' }] },
  { name: 'phone', label: '연락처', type: 'text', mask: 'phone',
    pattern: '^0\\d{1,2}-?\\d{3,4}-?\\d{4}$' },
];

// 2) 검증기 도출
const schema = buildZodSchema(fields);

// 3) 렌더 — 도메인 코드 0줄, 부품은 "고객"을 모른다
<FormSection fields={fields} columns={2} values={values} onChange={setField} errors={errors} />
```

목록/상세는 같은 원리로 `<ListPage schema={…} rows={…} />`, `<DetailPage info={…} form={…} />`에 데이터만 먹인다.

---

## 8. 설치·배선 (사람이 소비 앱을 세팅할 때)

소스(.tsx)를 그대로 배포하므로 소비 앱이 트랜스파일한다. **패키지명을 정확히 쓴다(아래 그대로).**

```ini
# 소비 레포 루트 .npmrc
@jjaim519:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm i @jjaim519/erp-dsl
# peer 의존성(소비 앱이 직접 설치) — React 19+, Mantine v8, zod v4,
#   TipTap v3(Editor/RichText 엔진) · TanStack Table v8(ListWidget 엔진)
npm i @mantine/core @mantine/dates @mantine/hooks @mantine/notifications dayjs zod react react-dom
npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-table @tiptap/extension-placeholder
npm i @tanstack/react-table
```

```ts
// next.config.ts — 필수
export default { transpilePackages: ['@jjaim519/erp-dsl'] };
```

```tsx
// 루트 레이아웃: Providers로 감싼다 (테마·토스트·폰트 자동)
import { Providers, ColorSchemeScript, mantineHtmlProps } from '@jjaim519/erp-dsl';
// <html {...mantineHtmlProps}> … <head><ColorSchemeScript/></head> … <Providers>{children}</Providers>
```

**폰트:** `Providers`가 PretendardGOV 가변 woff2(패키지 동봉, 전 weight)를 자동 로드 — CDN 없이 사내망·오프라인 동작.

### 8-1. PDF 첨부 뷰어 (선택 — 안 쓰면 설치할 필요 없다)

`AttachmentViewer`·`MobileAttachmentViewer`는 **이미지를 기본 지원**하고, **PDF는 선택 의존성**이다.
안 깔면 PDF가 폴백 카드(파일명 + 용량 + 사유 + 내려받기)로 뜬다 — 터지지 않는다.

```bash
npm i pdfjs-dist          # optional peer. PDF 미리보기가 필요할 때만
```

**자산은 소비 앱이 서빙한다.** 패키지는 정적 파일을 못 내보내므로, `node_modules/pdfjs-dist`에서
아래 넷을 `public/` 아래로 복사하고 그 경로를 `pdfAssetBase`로 넘긴다.

| 복사할 것 | 없으면 |
|---|---|
| `build/pdf.worker.min.mjs` | 렌더 자체가 안 된다 |
| `cmaps/` | **한글 PDF가 깨진다**(CJK 인코딩) |
| `wasm/` | 스캔 PDF·JPEG2000·폼이 **조용히** 깨진다(에러 없이 빈 페이지) |
| `standard_fonts/` | 내장 폰트 없는 PDF의 글자가 틀어진다 |

```tsx
<MobileAttachmentViewer … pdfAssetBase="/pdfjs" />
```

`pdfAssetBase`를 안 주면 PDF는 열지 않고 폴백으로 보낸다 — `cmaps`/`wasm` 없이 열면
에러 없이 빈 페이지가 나오는데, **조용히 깨지느니 못 연다고 말하는 편이 낫다**.

> 우리 dev 앱은 `npm run pdfjs:assets`(predev/prebuild에 자동 연결)가 같은 복사를 한다 —
> `scripts/copy-pdfjs-assets.mjs`가 참고할 만한 예다. CDN은 쓰지 않는다(폐쇄망 요건).

### 8-2. 문서(장표) 시스템 — 계약·견적·명세·발주서 (선택)

회사 문서를 화면에 그리고 **물리 A4 1:1로 인쇄**하고, 같은 기하 그대로 **채워 넣는다**.
`PaperDocModal`(보통 이것) · `PaperDoc`(문서를 화면에 직접 박을 때)를 쓴다.

**서식은 코드가 아니라 엑셀이다.** 표를 코드로 짜지 않는다 — 자연어로 지시하든 코드로 옮기든
매번 어긋난다. 엑셀에서 그린 것이 그대로 나오고, **저작의 주체는 소비 앱**이다(도메인을 아는 쪽이므로).

```bash
# ① 서식을 꺼낸다. **빈 격자보다 실물을 고쳐 쓰는 게 빠르다** — 이름을 주면 실물이 나온다
npx erp-paper-import --template 내역서          # → ./template-ledger.xlsx
npx erp-paper-import --template                 # 이름 없이 = 빈 서식(24열 격자·표준 머리·「필드」·「안내」)

# ② 엑셀에서 저작한다(아래 규칙) — 「안내」 시트가 문법을 전부 설명한다

# ③ 빌드 시점에 변환한다. 산출물(JSON)만 앱이 import 하고, exceljs는 런타임에 안 들어간다
npx erp-paper-import docs/forms/kk-baljooseo.xlsx --rows 31 \
  --out src/forms/order.paper.json --id order --name 발주서
```

| `--template` 이름 | 들어 있는 것 |
|---|---|
| *(생략)* · `빈서식` | 표준 머리·꼬리만 있는 24×42 격자 |
| `내역서` | **구획 제목 + 깊이 트리 + 구획별 소계** — 공사 내역서·BOM의 표준형 |
| `산출내역서` | 2단 병합 헤더 + 반복 구간 둘 + 그룹 소계 |

`.xlsx`로 끝나는 인자는 **나갈 경로**로 읽는다(`--template out.xlsx` = 빈 서식을 그 자리에).
이름과 경로를 함께 주려면 `--out`을 쓴다: `--template 내역서 --out docs/forms/견적.xlsx`.

`exceljs`는 **optional peer**다 — 이 기능을 안 쓰면 설치할 필요 없다. 변환기가 경고를 뱉으면
**그대로 읽고 엑셀을 고친다**(그리기는 되는데 편집이 안 되는 서식이 조용히 나가는 걸 막는 장치다).

**엑셀 저작 규칙 — 이 넷만 지키면 된다**

| | |
|---|---|
| **열 너비·행 높이를 바꾸지 않는다** | 넓은 칸은 **병합**, 높은 칸은 **세로 병합**. 24열 격자가 곧 A4 폭이라 너비를 건드리면 쪽이 깨진다 |
| **Z열에 행의 역할을 적는다** | `머리말`·`꼬리말`·`열머리`·`반복`·`그룹머리`·`그룹꼬리`·`합계`. 「반복」 줄이 데이터 개수만큼 늘어난다 |
| **값 자리는 두 겹 중괄호** | `{{문서번호}}` · `{{품목.품명}}`(반복 줄) · `{{합계:품목.금액}}` · `{{묶음:품목.분류}}`(여러 줄에 세로로 걸치는 칸) · `{{들여:품목.품명}}`(트리 — 그 줄의 깊이만큼 밀림) · `{{@쪽}}` |
| **「필드」 시트가 값의 명단이다** | 이름·라벨·종류·필수·**배열**. 반복 줄에 쓰는 필드는 **「배열」 칸에 그 목록의 이름**을 적는다 — 이게 `{{품목.품명}}`의 「품목」을 만든다. 비워 두면 그리기는 되는데 **편집 모드에서 그 표가 통째로 입력이 안 된다** |

**줄마다 깊이가 다른 표(내역서·BOM)** — 「주방 › 상부장 › 옵션1」처럼 딸림이 있는 표는 축 둘로 적는다.
「필드」 시트에서 깊이를 담을 열의 **종류를 «깊이»**로 두면(1이 가장 얕다) 그 배열이 트리가 되고,
품명 칸을 `{{들여:품목.품명}}`으로 적으면 그 줄의 깊이만큼 **글자가** 밀린다(격자는 안 움직인다 —
칸을 옮기면 열이 어긋나 테두리가 계단이 된다). 깊이 열은 **종이에 안 찍힌다.**

**깊이 1을 구획 제목으로 쓰는 꼴**(내역서의 표준형)은 이렇게 적는다.

| Z열 | 그 줄 |
|---|---|
| `그룹머리` | `{{번호:품목.품명}}` 을 전 폭으로 — 「1. 주방」. **값 칸을 두지 않는다** |
| `열머리` | 공사·단위·수량·단가·금액. 그룹머리 **아래**에 두면 구획마다 다시 난다 |
| `반복` | `{{들여:품목.품명}}` + 값들. 깊이 2·3만 여기로 온다 |
| `그룹꼬리` | `{{합계:품목.금액}}` — 그 구획의 소계 |

세 가지가 자동으로 따라온다. ① **구획 제목이 가져간 줄은 반복에서 빠진다**(같은 이름이 두 번 안 나온다)
② **들여쓰기 기준선은 실제로 그려지는 줄 중 가장 얕은 깊이**라 표가 통째로 밀려 들어가지 않는다
③ **번호는 자리에서 나온다** — 데이터가 아니라 «몇 번째 묶음인가»라서, 줄을 지워도 다시 매길 일이 없다.

⚠ **묶음을 여는 줄은 자기 금액을 가지면 안 된다.** 소계가 딸린 줄을 다 더하므로 같은 수가 두 번 더해진다.
그룹머리 없이 트리만 쓰면(줄마다 자기 금액을 갖는 표) 깊이 1인 줄도 항목으로 남고 소계만 붙는다.
**깊이별 소계(레벨 2에도 소계)는 아직 안 연다** — 반복 하나에 그룹꼬리 하나가 지금 엔진의 전제다.
실물: `public/template-ledger.xlsx`.

`--rows`는 **쪽당 행 수**이고 이 하나가 행 높이와 글자 크기를 함께 정한다(42→10.5pt / 31→14pt).
글자를 키우려면 이 수를 **줄인다**. 꼬리말 행이 있으면 거기서 자동으로 읽으므로 생략해도 된다.

**배선 — 값을 넘기고 저장을 받는다**

```tsx
import { PaperDocModal } from '@jjaim519/erp-dsl';
import type { PaperSpec } from '@jjaim519/erp-dsl/schema';
import spec from '@/forms/order.paper.json';

<PaperDocModal
  opened={open} onClose={() => setOpen(false)} title="발주서 — 작성"
  spec={spec as PaperSpec}
  values={{
    발주처: row.customer, 납기: row.dueDate,          // 「필드」 시트의 «이름» 그대로
    품목: lines.map(l => ({ 분류: l.kind, 품명: l.name, 수량: l.qty })),  // 반복은 배열
  }}
  mode="edit"
  onSave={(next) => save(next)}                        // 초안·더티는 모달이 쥔다
  readonlyFields={['발주처']}                          // 데이터에서 끌어오는 값 — 보이되 못 고친다
  actions={[{ label: '발송', variant: 'primary', onClick: send }]}   // 닫기·인쇄·저장은 빌트인
/>
```

**값 이름은 「필드」 시트의 «이름» 열 그대로**이고, 반복은 그 목록 이름의 배열이다.
DB → 이 객체로 옮기는 건 소비 앱 몫이다 — 서식은 «어떤 이름이 필요한가»만 말한다.

`readonlyFields`를 **서식(엑셀)이 정하지 않는 이유**: 어느 값이 어디서 오는지는 그 값을 실제로
쥔 쪽만 안다. 반복 안은 점 경로로 적는다(`'품목.품명'`).

**조건부 노출은 따로 없다** — 반복 배열을 비우면 그 줄이 사라지고 아래가 당겨 올라온다.
고정 행도 «0/1개짜리 반복»으로 모델링하면 같다. (열머리는 남는다.)

> **아직 못 하는 것** — **2단 그룹**(걸침 칸이나 그룹머리를 두 층으로 두면 안쪽이 바깥을 따라가
> *틀린 값*이 찍힌다. 검사도 안 잡는다) · 흐름 셀(한 칸이 쪽을 못 넘는다) · 편집 모드 모바일.

### 8-3. 계층 초기 등록 — 엑셀로 트리를 세운다 (선택)

품목 계층(`HierarchyExplorer`)의 초기 데이터를 **사용자가 엑셀로 채워 올린다.** 8-2의 문서 서식과
**같은 세 시트**(양식·필드·안내)를 쓰지만 **문서가 아니다** — 「양식」이 «그릴 레이아웃»이 아니라
«채울 표»이고, 빌드 시점이 아니라 **런타임에** 읽는다. 문서 변환기에 넣으면 거부한다.

```bash
npx erp-paper-import --template 계층 --out public/hierarchy-form.xlsx   # 빈 등록표를 꺼내 앱에 둔다
```

사용자가 「양식」을 채워 올리면, 그 파일에서 **두 장을 읽어** 넘긴다. 파일 해독 라이브러리는
소비 앱이 고른다(SheetJS 등) — 패키지는 파일을 안 읽는다.

```ts
import { buildHierarchyFromRows, HierarchyExplorer, type HierarchyField } from '@jjaim519/erp-dsl';

const sheet = (n: string) => XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '', raw: false });
const fields: HierarchyField[] = sheet('필드').slice(1)
  .filter((r) => String(r[0] ?? '').trim() && !String(r[0]).startsWith('──'))
  .map((r) => ({ name: String(r[0]).trim(), label: String(r[1] ?? '').trim() || undefined,
                 type: String(r[2] ?? '').trim(), required: String(r[3] ?? '').trim() === '필수' }));

const { nodes, objectsByPath } = buildHierarchyFromRows(fields, sheet('양식'));

<HierarchyExplorer nodes={nodes} objects={objectsByPath[selectedId] ?? []} … />
```

**트리를 손으로 만들지 않는다.** 경로 문자열을 파싱하거나 폴더를 직접 조립하면 규칙이 두 벌이 된다.

**열의 뜻은 「필드」 시트가 정한다** — 「양식」의 헤더는 사람이 읽는 이름이고, 「필드」의 «이름»과
같기만 하면 순서를 바꿔도 된다. 종류가 역할을 말한다:

| 종류 | 뜻 |
|---|---|
| **분류** | 폴더 단계. **선언 순서가 곧 깊이** — 몇 개를 두든 그만큼 깊어진다 |
| **이름** | 품목의 제목(하나·필수). 비우면 그 줄은 **빈 폴더만** 만든다 |
| 부제 · 배지 · 배지색 · 썸네일 | `ObjectCard` 역할 슬롯. 배지색 값: 성공/경고/위험/정보/기본 |
| 글자 · 숫자 · 금액 · 날짜 · 퍼센트 · 예아니오 | 값. **첫 번째가 핵심값**, 나머지는 보조 — 열 순서가 곧 카드의 정보 위계 |

> 빈 등록표는 **「양식」에 헤더 한 줄뿐**이라 그대로 올리면 0건이 나온다(예시는 「안내」에 있다).
> 폴더 칸이 하나도 없는 줄은 버린다 — 어디에 둘지 알 수 없는 품목이다.

---

## 9. 설계 문서

깊은 근거·전체 규격은 `docs/`에 있다. 판단이 막히면 여기를 본다.

- [`docs/00_설계원리.md`](docs/00_설계원리.md) — 왜 이렇게 만드는가 (철학·핵심 컨셉)
- [`docs/01_규칙과구조.md`](docs/01_규칙과구조.md) — 헌법 8조·강제 3층·계층 모델·배치/폭/공간 장부
- [`docs/02_토큰과구현.md`](docs/02_토큰과구현.md) — 토큰 값·전체 부품 prop 규격·스키마 층·패키지/배포
- [`docs/03_로드맵과미해결.md`](docs/03_로드맵과미해결.md) — 진행 상황·미해결 지점
- [`docs/04_확장전략과청사진.md`](docs/04_확장전략과청사진.md) — 위젯 확장(v0.11) · 청사진 수확 → DSL 조립 · json-render/A2UI 활용 여지 · 정형화 백로그
- [`docs/05_레이아웃과위젯.md`](docs/05_레이아웃과위젯.md) — Page·Bento·Widget 설계 · LayoutSpec 계약(명시 좌표·닫힌 footprint) · 편집기/런타임 (설계, 구현 전)
---

## 경계 (헌법 요약)

- 소비 앱은 이 패키지를 **수정하지 않는다.** 카탈로그 확장은 본 라이브러리 레포에서 사람이 큐레이션으로만(헌법 4).
- `@mantine/*` 직접 import 금지 — `@jjaim519/erp-dsl` 배럴만 사용(헌법 7).
- 강제 규칙(린트)은 특정 레포 설정이 아니라 **이 DSL의 일부**다 — 어느 프로젝트에 올라가든 따라간다.
