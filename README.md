# @byeongjunkim-jjaim/erp-dsl

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
   import { Button, FormSection, /* 부품 */ } from '@byeongjunkim-jjaim/erp-dsl';
   import { buildZodSchema, type FieldSpec } from '@byeongjunkim-jjaim/erp-dsl/schema';
   ```
   `@mantine/*`를 직접 import하면 린트 에러(헌법 7). Mantine은 라이브러리 내부에 격리돼 있다.
4. **`className`·`style`은 어떤 부품에도 못 넘긴다.** (토큰 우회 통로라 노출 안 함.) 색·간격·정렬은 전부 닫힌 prop으로 표현한다.
5. **빈칸은 추측으로 메우지 않는다.** 명세가 빈 선택 슬롯은 → 기본값을 쓰거나, **빈칸을 드러내 사람에게 되묻는다.** "맞게 추측"이 아니라 "빈칸 드러내기"가 너의 일이다.
6. **검증의 진실은 스키마 하나.** 값 제약(필수·min/max·정규식)은 부품 prop이 아니라 `FieldSpec`/`buildZodSchema`에만 둔다.

---

## 2. 두 진입점

| 경로 | 내용 |
|---|---|
| `@byeongjunkim-jjaim/erp-dsl` | 부품(원자·분자·유기체·템플릿) + `Providers`·`notify` 배선 |
| `@byeongjunkim-jjaim/erp-dsl/schema` | `FieldSpec`·`FieldType`·`buildZodSchema`·`isFilled` (데이터 세계) |

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
- **Button** `variant: primary|secondary|danger|ghost` · `size: sm|md` · `loading` `disabled` `fullWidth` `leftIcon` `rightIcon` `onClick` `type: button|submit`
- **IconButton** `icon: IconName` · `label`(aria 필수) · `variant`(Button과 동일) · `size: sm|md`
- **Badge** `color: neutral|success|warning|danger|info` · children=string
- **CountBadge** `count`(0 이하면 안 보임) · `tone: danger|neutral`(기본 danger=행동요구) · `max?`(기본 99, 초과 "N+") · `dot?` — 알림 카운트(솔리드 빨강 N). 상태=Badge와 역할 분리
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
- **TabBar** `options` `value` `onChange`  ← 다른 구획으로 전환

### 의미 원자 — 입력군 (13)
공통: `value`/`onChange`(controlled 전용) · `name` · `size: sm|md` · `disabled` · `placeholder`. **`label`·`error`·`required`는 입력칸이 아니라 `FormField`가 소유**.
- **TextInput** / **PasswordInput** / **NumberInput** / **Textarea**(`autosize`)
- **CurrencyInput** `value: number|string` — 돈 입력(₩ prefix·천단위 콤마·무소수). NumberInput 형제(표시만 통화, 저장·검증은 number)
- **Select** `options: {label,value}[]` · `value: string`(단일)
- **Radio** `options` · `value`(단일)
- **DatePicker** `value`(Date/ISO) · **MultiDatePicker** `value: string[]`(개별 날짜 집합)
- **Checkbox** / **Switch** `checked`/`onChange` · 인라인 `label`은 유지
- **Combobox** `options` `value`(단일) `clearable?` — 검색되는 Select(대용량 옵션 타이핑 필터)
- **TimePicker** `value: "HH:MM"` — 시각 입력(날짜는 DatePicker)

### 레이아웃 원자 (3) · 배치 프리미티브 (4)
- **Card** `variant: elevated|outlined|flat` · `padding: none|sm|md|lg`
- **Divider** `orientation: horizontal|vertical`
- **Container** `maxWidth: narrow|default|wide`  ← 폭의 천장은 여기 하나뿐
- **Stack**(세로) `gap`(토큰) · `align: start|center|end|stretch` · `justify: start|center|end|between`
- **Group**(가로) `gap` · `align: start|center|end` · `justify: …|between` · `wrap`
- **Grid** `columns: 1|2|3|4|6|12` · `gap` · 자식 `Grid.Col span: 1~12`
- **Bento**(페이지 본문 격자, 전 PageGrid) `columns: 2|3|4|6|12` · `gap: sm|md|lg` · 타일 `Bento.Tile colSpan` `rowSpan: 1|2|3` — 고정 셀 높이(가변 높이 불허·iOS 홈식)

### 분자 (26) — 원자를 결합·일부 상태 고정
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
- **RichText** `html` — 저장된 리치 텍스트(HTML) 읽기 뷰어. **Editor의 짝**(같은 TipTap 스키마 → 새니타이즈). BoardView 본문 등에서 작성물 그대로 렌더

### 유기체 (16) — 화면 한 구획, 도메인은 스키마로만 주입
- **Modal** `opened` `onClose` `title` `actions` `size: sm|md|lg|xl|full`(full=95vw·90vh, 풀스크린 아님) · children=본문
- **DataTable** `columns` `rows` `status: loading|empty|ready` · controlled 정렬·페이징 · `onRowClick`
- **EmptyState** `icon` `title` `description` `action?`
- **PageHeader** `title` `description?` `actions?` · **DescriptionList** `items` `columns: 1|2|3`
- **AppShell** `logo` `menuItems` `activePath` `onNavigate` `profile` `notification` · children=콘텐츠 · **3티어 반응형(자동)**: 데스크탑 ≥1280 풀 넷바(로고+메뉴+하단 유틸리티) / 태블릿 768–1279 아이콘 레일(로고 없음) / 폰 <768 하단탭+슬림 상단바. 상단바는 폰만(데스크탑·태블릿 해체 — 알림·프로필은 넷바 하단)
- **Timeline** `events: TimelineEvent[]` · **Calendar** `month` `events: CalendarEvent[]`(월 뷰 단일)
- **Tree** `nodes` controlled 선택·펼침 · `editable`(쓰기 게이트)
- **FieldGrid** `columns` `rows: FieldGridCell[][]`(셀=`label?`|`field?`|`image?`|`node?`, `colSpan?` `rowSpan?` `align?`) `fields: FieldSpec[]` `mode: edit|read` `size: sm|md|lg`(기본 md — 타이포·행 단위·세로패딩 한 세트, 행 높이는 타이포 따라 동적) `values` `onChange` `errors?` — 테두리 셀 격자(장표/帳票). 작성·확인 양용·**같은 기하**(셀 박스 불변, read=같은 입력 원자 inert 재사용). `node`=비표준 컨트롤 통째 슬롯(4종 배타·mode 무관). 머리표(라벨:값)·명세표(헤더+값 행)·대분류 밴드 다 같은 모델
- **Drawer** `opened` `onClose` `title` `actions?` `position: left|right|top|bottom` `size: sm|md|lg|xl|full`(full=축 95%) — 가장자리 슬라이드 패널(뒤 맥락 유지; 차단형은 Modal)
- **PaperModal** `opened` `onClose` `title` `actions?` `orientation: portrait|landscape` · children=표준 A4 캔버스(794×1123) 기준 문서 — **순수 A4 문서 뷰어**. 종이가 자기 윤곽을 가짐(모달 아님), JS 실측 fit(transform scale). 모달 폭=가로 A4 고정, 헤더 토글 **자세히**(기본·폭 채워 확대·세로 스크롤) / **전체**(통째·무스크롤). 내용은 소비처(보통 FieldGrid). **인쇄 빌트인**(`@media print`: 종이만 물리 A4 1:1·1장·머리말꼬리말 제거·디바이더 크리스프 — 트리거 버튼만 `actions`로 소비처 배선)
- **Stepper** `active`(index) `steps: {label,description?}[]` `orientation?` `onStepClick?` — 다단계 진행 표시(콘텐츠는 호출측이 active로 분기)
- **Transfer** `items: {value,label}[]` `selected: string[]` `onChange` `titles?` — 좌·우 듀얼 리스트 대량 배정(인라인 다중은 MultiSelect)
- **ToastHost** (props 없음) — 토스트 호스트(위치·지속·스택 단일 관리). 트리거는 `notify.*`, 앱 셸에 1회 배치
- **LineItemList** `items: LineItem[]` `onQuantityChange` `onRemove?` `showTotal?` `showAmount?` `unit?` — 그룹·소계·합계·컴팩트 ✕ 라인아이템(수량=NumberStepper). 자체 surface 없음(소비처가 well에 담음)

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
- **`CellType`**(DataTable·DescriptionList·ObjectCard 값 표현, 14종): `text badge number currency date boolean actions user tags link percent secondary relative-time thumbnail`
- **`notify`** (휘발 피드백): `notify.success|danger|warning|info(...)` — 스키마 밖 코드 배선. **작업 결과만**; 필드 검증은 인라인 FormField.

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
import { FormSection } from '@byeongjunkim-jjaim/erp-dsl';
import { buildZodSchema, type FieldSpec } from '@byeongjunkim-jjaim/erp-dsl/schema';

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
@byeongjunkim-jjaim:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm i @byeongjunkim-jjaim/erp-dsl
# peer 의존성(소비 앱이 직접 설치) — React 19+, Mantine v8, zod v4, TipTap v3(리치 에디터 Editor/RichText용)
npm i @mantine/core @mantine/dates @mantine/hooks @mantine/notifications dayjs zod react react-dom
npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-table @tiptap/extension-placeholder
```

```ts
// next.config.ts — 필수
export default { transpilePackages: ['@byeongjunkim-jjaim/erp-dsl'] };
```

```tsx
// 루트 레이아웃: Providers로 감싼다 (테마·토스트·폰트 자동)
import { Providers, ColorSchemeScript, mantineHtmlProps } from '@byeongjunkim-jjaim/erp-dsl';
// <html {...mantineHtmlProps}> … <head><ColorSchemeScript/></head> … <Providers>{children}</Providers>
```

**폰트:** `Providers`가 PretendardGOV 가변 woff2(패키지 동봉, 전 weight)를 자동 로드 — CDN 없이 사내망·오프라인 동작.

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
- `@mantine/*` 직접 import 금지 — `@byeongjunkim-jjaim/erp-dsl` 배럴만 사용(헌법 7).
- 강제 규칙(린트)은 특정 레포 설정이 아니라 **이 DSL의 일부**다 — 어느 프로젝트에 올라가든 따라간다.
