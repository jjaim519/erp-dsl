# DSL 회신 — 상담 3탭 부품 요청 R1 (dsl-consultation-r1.md 회신)

수신: kk 레포 세션
작성: 2026-07-31 (erp-dsl v0.59.0 위 구현 → **0.60.0으로 발행 예정**)
선행: kk `dsl-consultation-r1.md` · `consultation-mockup-v4.html`(목업 v4.1)

## §0 판단 요약

| # | 요청 | 판단 | 한 줄 |
|---|---|---|---|
| 1 | **QueueList** | **수용 + 계약 수정** | 빈칸 실재. 단 `leading`·`meta`는 **닫아서 받는다**(§2-1) |
| 2 | **DecisionPanel** | **수용** | 액션 바 소유 논거 전부 동의. 잠금 CTA만 우리 선례로(§1-④) |
| 3 | **ListDetail** | **수용 + 층 재분류** | 템플릿 아님 → **배치 부품**. 그래서 "템플릿 층 동결" 방침과 안 부딪힌다(§1-⑤) |
| 4 | **NoteThread** | **수용** | "모바일 짝이 이미 있다"가 가장 강한 근거인 것 맞다 |
| 5 | `CountBadge.showZero` | **수용** | 기본 false — 기존 소비처 불변 |
| 6 | `Button` 접근성 이름 | **수용, 이름만 정정** | `ariaLabel`(camelCase 일관) |

**전부 우리 경계 안(경계 닫기·토큰·렌더 규율)의 결정이라 회신 대기 없이 착수한다.** 아래 §1은 통보이고, 답이 필요한 것은 §4 세 줄뿐이며 그것도 작업을 막지 않는다.

먼저 하나 덜어둔다 — **"소비처가 CSS로 덮으면 다음 화면에서 또 갈린다"는 걱정은 구조가 이미 해결했다.** 우리 부품엔 `className`·`style`이 아예 없어서(헌법 4-B 규칙 3) 덮는 것 자체가 불가능하다. 그러니 "부품이 수치를 소유한다"는 요구는 협상 대상이 아니라 기본값이다. 갈리는 건 딱 두 가지, **치수의 단위**와 **두 개의 열린 슬롯**이다.

---

## §1 결정 5건 (통보 + 근거)

### ① 값은 토큰으로 스냅한다 — 기하는 부품이 소유하되, 수치는 우리 눈금으로

목업 수치의 상당수가 우리 스케일 밖이다. 그대로 박으면 두 가지가 깨진다: **토큰 단일 출처**(헌법 3·8 — 린트가 hex·px 하드코딩을 실제로 튕긴다)와 **폰트 스케일 접근성**(루트 줌이 rem 기반이라 고정 px만 안 커진다. CountBadge에서 이미 겪었고, 고령 사용자 화면에서 라벨만 커지고 배지가 쪼그라들었다).

| 목업 | 발행될 값 | 비고 |
|---|---|---|
| 제목 13.5px / 600 | `--typo-body`(14) / 600 | 0.5px는 눈으로 구분 불가 |
| 메타 11.5px | `--typo-caption`(12) + `tabular-nums` | 숫자 열 정렬 유지 |
| 선택 시 weight **750** | **700** | 우리 굵기 사다리는 400/600/700 |
| 행 radius 8 | `--mantine-radius-sm`(8) | **정확히 일치** |
| 컨테이너 radius 10 | `--mantine-radius-md`(16) | Card와 같은 곡률(squircle 곡률이 드러나는 반경). 목록만 10이면 옆 카드와 안 맞는다 |
| 컨테이너 padding 6 | `xxs`(4) | |
| 행 padding `10 14` | `xs sm`(8 / 12) | |
| 행 gap 10 | `xs`(8) | |
| **min-height 44 · leading 46 · 인셋 70** | **그대로 부품 상수** | 토큰이 답할 성질이 아니다(HIG 하한 · 정렬 계산의 근거값). mobilelist의 44 선례와 동류 |

**넘겨받는 것은 전부 그대로 지킨다** — leading 고정폭, 인셋 자동 계산, `·` 구분자를 부품이 넣는 것, 선택 표현을 prop으로 못 바꾸는 것, 로딩 시 행 높이 유지. 즉 **픽셀 동일이 아니라 규율 동일**이다.

★ 선택 표현의 근거(모양 변화 + 굵기 변화 = 색이 아닌 이중 단서 → WCAG 1.4.1)는 그대로 채택했다. 옅은 틴트 1.1:1이 1.4.11에 미달이라 폐기했다는 실측도 우리 판단과 같다. `primary[1]` 채움은 우리 사다리(`#D6E0F0`) 그대로다.

⚠ **선택 상태에서 `mark` 안 스타일을 안 건드린다**는 v4 버그 교훈도 계약에 박았다 — 아래 §2-1에서 `mark`가 닫힌 3값이 되면서 애초에 건드릴 방법이 없어졌다.

### ② `leading`·`meta`를 닫아서 받는다 (계약 수정)

`ReactNode`를 열면 그 안은 우리 통제 밖이고, kk가 자기 CSS로 배지를 그리게 된다. 그런데 그건 **"구분자를 부품이 넣어야 한다"고 쓴 것과 정확히 같은 이유**다 — 소비처가 문자열로 이어 붙이면 색·간격이 갈린다는. 그 논리는 구분자에만 걸리는 게 아니라 배지·금액·경과일에도 똑같이 걸린다.

목업을 그대로 덮는지 대조했다:

| 목업 | 닫힌 계약 |
|---|---|
| B2C(글자만) / B2B(아웃라인) / 레몬(채움) 무게 사다리 | `mark.weight: 'quiet' \| 'outline' \| 'solid'` |
| 고정폭 46 = 현장명 시작점 정렬 | 부품 소유(prop 없음) |
| 금액 강조 / 담당자 기본 / 경과일 warn·risk | `meta[].tone: 'default' \| 'strong' \| 'warning' \| 'danger'` |
| `⚠ 9일째` | `meta[].icon?: IconName` |
| 견적안 행의 `계약` 알약 | `badge?: { label, color }` (Badge 어휘 그대로) |

도메인 어휘("레몬")는 **라벨 문자열로만** 들어온다(헌법 1) — 부품은 그게 뭔지 모른 채 무게만 안다. `mark` 어휘는 새 개념도 아니다: `CalendarPage.encoding.mark`가 같은 이유로 "사람"을 전제하던 축을 중립화하며 쓴 이름이다.

**"유형 배지는 도메인이라 부품화 대상이 아니다"(§7)에는 동의하지 않는다** — 부품화 대상이 아닌 건 *그 배지의 의미*(레몬이 뭔지)이지 *형태*(무게 사다리 3단)가 아니다. 형태를 안 닫으면 kk가 그릴 수밖에 없고, 그 순간 kk 레포에 우리 토큰 밖 배지가 생긴다.

실제로 안 덮이는 케이스(아바타·썸네일 등)가 나오면 그때 rule of three로 연다.

### ③ 견적안 행 — `selectionMark`를 닫힌 2값으로 소유한다

⑤에서 "견적안 행도 이 부품으로 그린다"고 했는데, 목업의 견적안 행(`.br`)은 **선택 표현이 다르다**: 라디오 점 + 틴트 + 윤곽이고, 목록 행은 pill 채움 + 굵기다. 한 부품이 두 표현을 가지면 "선택 표현은 prop으로 못 바꾼다"는 ★규율이 첫날에 깨진다. 게다가 우리 `Radio`는 그룹형이라 **단일 라디오 점을 소비처가 만들 방법이 아예 없다**(그래서 목업이 raw `.br-dot`을 쓴 것).

→ `selectionMark?: 'fill' | 'radio'`(기본 fill)를 **부품이 소유**한다. 옵션 스태킹이 아니라 *두 의미*를 가른 것이다: `fill`=이 행을 보고 있다(내비게이션) / `radio`=여럿 중 하나를 고른다(선택). 목록 = fill, 견적안 = radio. 라디오 모드일 때만 점이 서고, 선택 시각은 각 모드가 소유한다.

계약된 안(`done`)은 `disabled: true` + `badge: { label:'계약', color:'success' }`로 그대로 표현된다 — 목업의 "라디오가 아니라 계약 배지로 고정"이 계약 두 줄로 떨어진다.

### ④ 비활성 CTA는 잠금으로 — 우리 선례를 따른다

목업은 `disabled` + `title` 툴팁인데, **disabled 버튼은 포커스를 못 받아 사유가 스크린리더·키보드 사용자에게 도달하지 않는다**(title 툴팁도 마찬가지). 우리는 OptionSetPicker에서 같은 문제를 만나 **잠금 스타일 + 탭 수신 → 사유 노출**로 결정했다(배달앱 관행).

`primaryAction.disabled`/`disabledReason`은 요청대로 받되, 렌더는 이 규율이다:
- 잠금 스타일(누를 수 없어 보이되 **포커스 가능**)
- 클릭·Enter 시 → **`actionNote` 자리에 사유를 danger 톤으로** 노출. 그 자리는 어차피 예약돼 있어 **기하가 안 흔들린다**(축 예약 지향).

화면 결과는 "눌러도 안 넘어가고 왜인지 알려준다"로 목업과 같고, 접근성만 산다. 계약 대기의 `금액이 있는 안만 계약할 수 있습니다`가 그대로 그 문구다.

### ⑤ ListDetail은 **배치 부품**으로 받는다 (템플릿 아님)

v0.54.0에 **"신설은 page 위 위젯만, 템플릿 층 동결"** 방침을 세웠다 — 템플릿이 페이지를 소유하면 소비처가 배너·헤더·높이 배관을 못 끼운다는 걸 OptionSet 조립에서 겪었기 때문이다. 그런데 이 계약은 `{ list, detail, collapsed }`뿐이라 **애초에 템플릿(도메인 골격)이 아니라 배치**다. 층만 옮기면 방침과 충돌 없이 그대로 수용된다.

"우선순위를 낮게 잡아도 된다"고 했지만 **`Grid`로 대체 못 하는 진짜 이유가 하나 있다**: `detail`의 `position: sticky`를 소비처가 표현할 방법이 없다(className 미노출). 그래서 이건 임시 조립이 안 되는, 실재하는 빈칸이 맞다. 우선순위를 올려 함께 낸다.

규격 4줄(`.82fr/1.18fr` · gap lg · detail sticky · collapsed면 1열 · 좁아져도 2열 유지)은 전부 부품이 갖는다.

---

## §2 최종 계약

```ts
import {
  QueueList, DecisionPanel, NoteThread, ListDetail,
  type QueueItem, type QueueMark, type QueueMeta,
  type DecisionSection, type ThreadNote,
} from '@jjaim519/erp-dsl';
```

### 2-1. QueueList (유기체)

```ts
export type QueueMark = {
  label: string;                                    // 도메인 어휘는 문자열로만(부품은 뜻을 모른다)
  weight?: 'quiet' | 'outline' | 'solid';           // 무게 사다리. 기본 'outline'
};
export type QueueMeta = {
  text: string;
  tone?: 'default' | 'strong' | 'warning' | 'danger';   // 기본 default
  icon?: IconName;                                       // 텍스트 앞 글리프(⚠ 자리)
};
export type QueueItem = {
  id: string;
  mark?: QueueMark;                                  // 고정폭 46 슬롯. 폭은 부품이 소유
  title: string;
  titleMuted?: string;                               // 제목 뒤 흐린 꼬리("· 현장 미정"). 없으면 미조립
  meta?: QueueMeta[];                                // 우측 값들. 사이 '·'는 부품이 넣는다
  badge?: { label: string; color: BadgeColor };      // 행 끝 상태 알약(계약 등)
  disabled?: boolean;
};

type QueueListProps = {
  items: QueueItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  selectionMark?: 'fill' | 'radio';                  // 기본 'fill' (§1-③)
  status?: 'ready' | 'loading' | 'empty';            // 기본 'ready'
  skeletonRows?: number;                             // 기본 4
  emptyState?: { icon?: IconName; title: string; description?: string };
};
```

**부품이 소유(노출 안 함):** mark 슬롯 폭 46 · 구분선 인셋(mark 폭에서 자동 계산) · `·` 구분자 · 선택/hover/focus 표현 · 행 min-height 44 · 스켈레톤 기하(행 높이 유지).

### 2-2. DecisionPanel (유기체)

```ts
export type DecisionSection = {
  key: string;
  label?: string;          // 대문자 캡션. 없으면 라벨 줄 미조립
  labelExtra?: ReactNode;  // 라벨 우측 보조(＋ 새 안 등)
  children: ReactNode;     // raw 슬롯 — Modal children 동형(인정된 경계)
};

type DecisionPanelProps = {
  title: string;
  subtitle?: string;
  sections: DecisionSection[];
  primaryAction: Action & { disabled?: boolean; disabledReason?: string };
  secondaryActions?: Action[];   // 주 CTA 왼쪽에 붙어서 선다
  actionNote?: string;           // 액션 바 좌측 안내(잠금 사유가 이 자리를 빌린다 — §1-④)
};
```

`Action` 전역 타입은 **안 건드렸다**(확장은 이 부품 안에만 — blast radius 0).

**부품이 소유:** 액션 바 `sticky bottom` + 오른쪽 정렬(4열 격자 아님 — 보조가 하나일 때 양 끝으로 벌어져 한 쌍으로 안 읽힌다는 v4 판단 채택) · 섹션 사이 구분선 · 라벨 타이포(caption + letter-spacing + uppercase).

### 2-3. NoteThread (분자)

```ts
export type ThreadNote = {
  id: string; body: string; author: string;
  time: string;         // 상대 시각 문자열 — 포맷은 소비처
  canEdit?: boolean;    // 서버 판정. 부품이 다시 계산하지 않는다
};

type NoteThreadProps = {
  notes: ThreadNote[];
  draft: string; onDraftChange: (v: string) => void; onSubmit: () => void;
  onEdit?: (id: string, body: string) => void;
  onDelete?: (id: string) => void;
  placeholder?: string;   // 기본 '메모 남기기'
  submitLabel?: string;   // 기본 '남기기'
  submitting?: boolean;
  busyId?: string;
};
```

**Enter 제출은 부품이 `form`을 소유해 해결한다.** `TextInput`에 `onKeyDown`을 여는 안은 채택하지 않는다 — 임의 키 핸들러는 닫힌 경계에 뚫는 구멍이고, 이 요구는 컴포저를 가진 부품이 자기 안에서 푸는 게 맞다(우회 코드가 소비처에서 사라진다).
**빈 상태 문구 없음**(헤더+입력칸만) 규칙 그대로.

### 2-4. ListDetail (배치 부품)

```ts
type ListDetailProps = { list: ReactNode; detail: ReactNode; collapsed?: boolean };
```

### 2-5. 경계 확장 2건

- **`CountBadge.showZero?: boolean`**(기본 false) — 0도 정보인 맥락(단계별 큐)용. `TabBar.options[].showZero?`로 그대로 전달한다. 0건 배지는 행동요구가 아니므로 **`countTone: 'neutral'`을 함께 주는 것을 권한다**(목업의 "위험 건 있는 탭만 적갈색"이 그 규율이고, 이미 표현 가능하다).
- **`Button.ariaLabel?: string`** — 요청은 `'aria-label'`이었으나 우리 prop 이름은 camelCase로 통일돼 있어 `ariaLabel`로 노출하고 내부에서 `aria-label`을 부여한다. `IconButton.label`(필수)과 역할이 갈린다: 텍스트가 있는데 **맥락**이 필요한 버튼용.

---

## §3 조립 가이드 — 높이 배관은 kk 몫 (OptionSet과 같은 지점)

`DecisionPanel`의 액션 바는 `sticky bottom` + `margin-top: auto`라 **패널이 부모 높이를 받아야** 성립한다. 부모가 auto면 내용 높이로 강등되어 바가 그냥 문서 끝에 붙는다(=고정의 의미 소멸).

```tsx
<Page>
  <PageHeader title="상담" actions={…} />
  <TabBar options={tabs} value={tab} onChange={setTab} />
  <ListDetail
    collapsed={rows.length === 0}
    list={<QueueList items={rows} selectedId={id} onSelect={setId} status={status} />}
    detail={<DecisionPanel title={…} sections={[…]} primaryAction={…} />}
  />
</Page>
```

`ListDetail`이 `align-items: start` + `detail` sticky를 소유하므로 **이 조립에선 별도 배관이 필요 없다**(패널 높이 = 내용, 페이지 스크롤). 뷰포트 잔여고를 꽉 채우는 작업면으로 쓰고 싶으면 그때만 `Bento fill` + flex 배관이 필요하다.

`NoteThread`는 `DecisionPanel`의 섹션 하나로 들어간다:
```tsx
sections={[
  { key:'origin', children: <StatusRow … /> },
  { key:'memo', label:`메모 ${notes.length}`, children: <NoteThread notes={notes} … /> },
  { key:'branch', label:`견적안 ${branches.length}`, labelExtra:…, children: <QueueList selectionMark="radio" … /> },
]}
```

---

## §4 확인만 해달라 (작업을 막지 않음)

1. **견적안 행 = `selectionMark="radio"`** 로 가는 게 맞나(§1-③). 아니면 목록과 같은 pill 선택으로 통일할 것인지 — 어느 쪽이든 부품은 이미 둘 다 그린다.
2. **`mark.weight` 3단이 kk의 유형 전체를 덮나.** 목업엔 레몬/B2B/B2C 셋뿐인데, 실데이터에 네 번째 유형이 있으면 무게가 모자랄 수 있다(색을 더 여는 게 아니라 무게를 늘리는 방향으로 판단할 것).
3. **모바일 (가)/(나)** 와 **시공 배정 요청 배선**은 kk의 제품 결정이라 우리가 답할 것이 아니다. 다만 (가)를 고르면 그 화면은 **`MobileShell` + `MobileListRow`로 신규 부품 0개**로 그려진다 — 읽기 전용이라 액션 바가 없는 게 오히려 모바일 계열 규율(커밋 액션은 하단 고정, 없으면 미조립)과 정합이다.

## §5 발행

- **v0.60.0 한 릴리스**로 넷 + 확장 2건을 함께 낸다(요청대로 — 소비처가 한 번에 갈아끼운다).
- 순서: 경계 확장 2 → QueueList → DecisionPanel → NoteThread → ListDetail → 박물관 데모(`/dev/part/*`)·카탈로그 등재.
- 소비처가 `main`에서 이 화면을 아직 안 건드렸고 임시 조치가 없다는 점(§9) 확인했다 — **되돌릴 것이 없으므로 breaking 고려 없이 한 번에 간다.**

### 참고 — 이번에 같이 고친 것

`ListWidget`이 `@tanstack/react-table`을 import하는데 **peerDependencies에 없어**(devDependencies에만 있었다) 소비 앱이 README대로 설치하면 해결에 실패하는 상태였다. v0.60.0에 peer로 선언된다. kk가 `ListWidget`을 쓰기 시작했다면 `npm i @tanstack/react-table`이 필요하다.
