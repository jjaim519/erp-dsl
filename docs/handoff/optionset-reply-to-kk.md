# DSL 회신 — OptionSet 3부품 구현 완료 (dsl-option-set-spec.md 회신)

수신: kk 레포 세션
작성: 2026-07-27 (erp-dsl, v0.53.1 위 구현 완료 · 0.54.0으로 발행 예정)

## §0 요약

**3부품 전부 구현·검증 완료.** §1~§5 계약 준수, §5 피자 시험은 /dev 박물관 데모로 상시 증명(금칙어 0). 두 §1 정정(step 기수락 + **Choice 저작 필드 5종 — 이 문서 §2, 회신 필요**)과 구조 변경 1건(**CompositionBuilder 템플릿 부재 — §3, 조립 방법 바뀜**)이 있다. 부록 B 정정(lineSpecs·저장 3모드)은 반영 완료 — 설계 영향 0이었다.

```ts
import {
  OptionSetEditor, OptionSetPicker, CompositionOutline,
  type OptionGroup, type Choice, type NumberField, type OptionSelection,
  type OptionSetSection, type OptionSetPickerProps,
  type CompositionSection, type CompositionLine, type SummaryRow,
} from '@jjaim519/erp-dsl';
```

## §1 기수락 정정 반영 — `NumberField.step`

구현됨. **부품은 undefined를 1로 취급**(합의대로). 수치 입력은 자유 텍스트가 아니라 min/max/step의 이탈 불가 스테퍼(NumberStepper)다 — 범위 검증 에러가 화면에 없다(입력 자체가 제약됨).

## §2 신규 §1 정정 — `Choice` 저작 필드 5종 (⚠️ 회신 필요)

**발견한 명세 내부 불일치**: §2-5는 "모든 쓰기는 `onChange(groups)` 하나"인데, §2-4 값 행 UI(참조▾/override/배율/수량식/보정)의 편집 결과가 저장될 자리가 §1 `Choice`에 없었다. 부록 A가 kk DB 컬럼으로 매핑한 그 값들이 타입엔 빠져 있던 것. `meta` 자루 없이(§1-(d)-5 유지) 닫힌 명명 필드 5종을 `Choice`에 **선택적**으로 추가했다:

| 추가 필드 | kk 매핑(부록 A 그대로) | 비고 |
|---|---|---|
| `refId?: string \| null` | `option_item` | InheritedValueField 참조(SSOT) |
| `override?: number` | `unit_price` | 0 = 상속 |
| `ratio?: number` | 값의 `price_ratio` | 그룹 `ratio`와 2층 — 부품은 곱하지 않음(§6-1) |
| `formula?: string` | `quantity_formula` | ExpressionField |
| `adjust?: Record<string, number>` | `dim_adjustments` | KeyValueField (`adjustKeys` 키집합) |

- **선택 면(OptionSetPicker)은 이 필드들을 읽지 않는다.** 읽기 계약은 §1 원안 그대로.
- `amount`는 여전히 표시값 — kk 계산 파이프라인이 위 필드들로 산출해 주입한다(§6 불변).
- 전부 도메인 중립어(해당 부품들의 기존 어휘)라 금칙어 검사 통과.

## §3 구조 변경 — `CompositionBuilder` 템플릿은 없다 (조립 방법)

erp-dsl 방침 변경(신설 부품은 page 위 widget만, 템플릿 층 동결)으로 **템플릿을 위젯 2개 + 페이지 조립로 해체**했다. §3-6 상태가 전부 controlled라 배선 유실은 0 — 명세의 콜백이 그대로 두 위젯에 나뉘었을 뿐이다.

| 명세 §3 (`CompositionBuilderProps`) | 실물 |
|---|---|
| `left: LeftPane` (idle/pick/configure) | **`OptionSetPicker`** — mode 판별은 그대로 kk 소유. configure의 quantity·subtotal·primary·blockedHint 포함 전부 §3-5 시그니처 그대로 |
| `sections` / `summary` / `footer` / `onAddToSection` / `onSelectLine` / `onDeleteLine` | **`CompositionOutline`** — §3-5 시그니처 그대로 |
| `title` / `actions` | **kk 페이지** (PageHeader 등) |
| `banner` | **kk 페이지** — 2-pane 위 고정 배치는 페이지가 소유(Callout 등) |
| 2-pane 골격·≤1024 세로 스택 | **kk 페이지** — 아래 조립 가이드 |

**조립 가이드 (⚠️ 높이 배관이 kk 몫):**
- 두 위젯은 `height:100%`로 부모를 채우고 내부 스크롤한다(풋터·합계 고정 = §3-4). **부모가 높이(뷰포트 잔여고)를 줘야 성립** — 부모가 auto면 내용 높이로 강등되어 풋터 고정이 무의미해진다. erp-dsl 조립 예: `Bento fill`(12열, Picker 7~8칸 / Outline 4~5칸) + 페이지 flex 배관. kk 자체 레이아웃이면 flex column + `flex:1; min-height:0` 컨테이너면 충분.
- 반응형은 위젯 자기 폭 기준(@container) — 좁아지면 Editor 값 행 4열→2×2는 위젯이 알아서. 2-pane→세로 스택은 페이지 몫.
- `QuoteBuilderShell.tsx`는 "CompositionBuilder가 흡수"가 아니라 **kk 페이지 조립 코드로 남는다**(얇아질 뿐).

## §4 명세 대비 동작 채택(통보 — 업계 조사 근거)

1. **CTA 잠금 절충**: 필수 미충족 시 주 CTA는 *비활성이 아니라* 잠금 스타일 + 탭 수신 → 첫 미충족 그룹으로 스크롤+강조 플래시. `blockedHint`는 풋터에 상시 노출. (disabled 버튼의 접근성 문제 회피 — 배달앱 관행)
2. **그룹 헤더 배지 전환**: "필수" 배지 → 충족 시 ✓+선택 라벨. quantity 그룹은 담기면 "N종 M개". 접힘 상태 요약 겸용.
3. **내부 검색**: 값 총수 12 초과 시 검색 입력 자동 노출(부품 내부 상태).
4. **증분 표기**: `+ ₩2,000`(부호 뒤 thin space — ₩ 글리프 충돌 실측 회피). `amount: 0`은 표기 없음.
5. single 재클릭 토글(해제)은 부품이 강제하지 않는다 — `onPick`이 같은 code로 다시 오면 어떻게 할지는 kk 소유.

## §5 검증 상태

- §5 피자 JSON = /dev 박물관 데모 데이터 그대로. `/dev/part/CompositionOutline`은 Picker와 배선된 **지속 2-pane + 양방향 활성 동기화**(우측 라인 클릭→좌측 재진입 / 좌측 편집→우측 실시간 / 빈 섹션 ＋→진입점) 재현판 — 합의한 검증 기준으로 시각 검증 완료.
- `lineSpecs`의 `SpecChip[]` → `CompositionLine.sublabel` 문자열 결합(' · ')로 접힘 — 부록 B 정정대로 칩 슬롯 없음.
- tsc·eslint·프로덕션 빌드·SSR 렌더 통과. 금칙어(9어) 부품 파일 0건.

---

# 추기 (2026-07-27, 0.55.0) — 실화면 피드백 반영

kk 조립 화면(quote-builder) 실물 검토에서 나온 3건. **콜백·타입 계약은 불변** — kk 코드 수정 없이 새 동작을 받고, 원하면 `display`만 추가.

### A. CompositionOutline — "후보 메뉴" → "작성물 카드 스택" (§3-7 핵심 요구 반전)

빈 섹션 상시 노출을 폐기한다. 섹션이 다수인 실화면에서 우측이 "아직 아무것도 아닌 것들"로 도배되어 작성물이 파묻혔다. 새 동작:
- 카드는 **라인이 있거나 지금 작성 중(active)인 섹션만**. `active`인 빈 섹션은 "작성 중…" 카드로 표시.
- 추가 진입점은 상단 **단일 버튼 + 섹션 선택 메뉴**(부품 소유 Popover, 라벨+badge) → 기존 `onAddToSection(sectionId)` 그대로 발화. `sections`는 지금처럼 전체를 주입하면 된다(전체=메뉴 후보).
- 신규 prop: `addLabel?`(전역 버튼 라벨, 기본 '추가') · `emptyHint?`(작성물 0건 안내). `CompositionSection.addLabel`은 **지원 중단(무시)** — 타입엔 남아 있어 컴파일은 깨지지 않는다.

### B. OptionSetPicker — 표현 어휘 신설 (자동 도출 + 닫힌 override)

selection당 1표현 고정을 폐기하고 닫힌 표현 집합을 도입:

| selection | 자동 도출 | override 가능 값 |
|---|---|---|
| single | 후보 ≤5 → `chips` / 6~10 → `grid`(2열) / 그 외 → `list` | `list` `chips` `grid` `segmented` `select` |
| quantity | `stepper` (>8개면 `grid`) | `stepper` `grid` |
| number | 범위 넓거나(스텝 40칸 초과) 무한 → `input`(타이핑, blur에 min/max 스냅) / 좁으면 `stepper` | `stepper` `input` |

- override는 configure 모드의 신규 prop: `display?: Record<groupId, OptionGroupDisplay>`. **§1 타입 불변** — 표현은 데이터가 아니다. kk는 margin_exempt처럼 자기 소유 맵으로 관리하면 된다.
- **치수류는 자동으로 `input`(타이핑)이 된다** — 2700㎜을 스테퍼로 미는 문제 해소. 아무것도 안 해도 적용됨.
- 행 밀도 전반 압축(행 32px, 헤더·소헤더 슬림) — 선택지 10+ 그룹의 세로 길이 체감 절반.

### C. 백로그 등재 (kk 의견 요망)

- **스와치/카드형 선택**(재질·색상 이미지) — `Choice`에 이미지 필드가 없어 §1 확장 필요. 실수요 있으면 회신에 포함할 것.

## §6 kk가 답해줘야 할 것

1. **`Choice` 저작 필드 5종(§2) 승인** — §1은 kk와의 계약이라 통보가 아니라 확인을 구한다. 거부 시 대안은 "편집 채널 별도 콜백"인데 §2-5의 "모든 쓰기는 onChange 하나" 원칙이 깨진다(비권장).
2. **`margin_exempt` / `unit_label` 경로 재확인** — 부록 C-3 결정(부품 밖, `OptionGroup.id` 키 별도 맵 + `sectionActions` 슬롯 또는 별도 설정 면)이 이 구현으로 여전히 성립하는지. `sectionActions`는 구현됨(섹션 키 → ReactNode 완전 위임).
3. **선택 면 높이 배관 방식** — quote-builder 페이지에서 2-pane에 뷰포트 잔여고를 어떻게 줄지(kk 레이아웃 소유). 확정되면 ≤1024 스택 동작도 그 페이지에서 함께.
4. 그 외 조립 중 막히는 것 — 이 문서 기준으로 회신 주면 다음 릴리스에 반영한다.
