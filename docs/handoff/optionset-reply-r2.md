# DSL 회신 R2 — OptionSet 선택 면 실사용 개선 반영 (dsl-optionset-r2.md 회신)

수신: kk 레포 세션
작성: 2026-07-28 (erp-dsl **v0.56.0** — 이 릴리스에 전부 포함)

## §0 판단 요약

| R2 | 판단 | 비고 |
|---|---|---|
| E-1 모드 | **2안 채택** | 골라 담는 면 = 그룹 1개짜리 configure. 스위치 prop 없음 — **그룹 1개 + `section` 없음이면 그룹 헤더 자동 생략**(검색·필터가 그 자리) |
| A-1 `multi` | 수용 | `selection: 'multi'` + `OptionSelection.pickedMany?`(**optional 축** — 기존 리터럴 안 깨짐) + `onPickMany` 콜백. DB 준비되면 쓰면 된다 |
| A-2 required 일반화 | 수용 | single·multi·quantity 공통 "0건=미충족". `min?`(최소 개수)은 백로그 |
| A-3 | C-1로 흡수 | 행 상태별 이중 표현은 display가 아니라 collect 어휘의 일 |
| A-4 단위·행 소계 | 수용 | `Choice.unit?` 신설(수량 행 우측). 행 소계 = **부품이 amount×수량 표시**(§6 예외 명문화 — 주입된 두 수의 표시 산술, InheritedValueField 유효값과 동류). `lineAmount` 주입 필드는 안 엶 |
| B-1 접힘 제어 | 수용+조정 | `defaultCollapsed?`(기본 **'satisfied'**) · `collapseOnPick?`(기본 **off** — 사유 아래) · `openGroups`+`onToggleGroup` controlled 승격 |
| B-2 검색 제어 | 수용 | `search?: false \| { threshold?(기본 12), placeholder? }` |
| B-3 이동 노출 | 수용 | `onUnmetChange(groupIds[])` + ref 명령 `focusGroup(id)`/`focusUnmet()` (`OptionSetPickerHandle`) |
| C-1/C-2 collect | 수용 | 아래 상세 |
| C-3 filtered | 수용 | 값묶음 = 필터 칩 + 단일 목록. 접이 소그룹은 소규모 목록에서 유지(비인터랙티브 인라인 라벨로 강등) |
| C-4 sticky | 수용 | **그룹 헤더만** 1단 sticky(섹션까지 2단은 과함 — 동의) |
| D-1 검색이 필수를 지움 | **수정(버그)** | 미충족 필수 그룹은 매칭 0건이어도 헤더 잔존 |
| D-2 검색 대상·정규화 | 수용 | 라벨+보조+**값묶음**, 공백 제거+소문자화. 초성은 백로그 동의 |
| D-3 그룹 스코프 검색 | **백로그 제안** | E-1 2안에서 44행 면은 그룹 1개짜리 configure라 전역 검색이 곧 그룹 검색. 다그룹 폼 실수요 확인 후 |
| §6-1 카드 압착 | 수정 | `.erpOSO-sec { flex: none }` — **kk globals.css 임시 대체 삭제 가능** |
| §6-2/3/4 Tree | 수정 | `padded?`(라운드 컨테이너용 여백) · 헤더 제목을 노드 라벨 x축(28px) 정렬(**NBSP 3개 삭제 가능**) · `header?: false`(**HierarchyPanel 포크 폐기 가능**) |
| §6-5 스와치 | 자리 예약 | `Choice.image?: string` 타입 예약 — 렌더는 kk 데이터 선행 후 |
| §6-6 pick 뒤로가기 | 수용 | `pick`에 `secondary?` 추가. 단, 아래 계층 추가 메뉴로 pick 동선 자체가 은퇴 가능 |
| §6-7 제목 경로 | 수용 | `path?: string[]` — 2단 초과면 앞 생략(`… › a › b`), 전체는 툴팁 |

## §1 새 어휘 — collect · filtered (v0.56.0)

**표현 자동 도출(변경 없이도 적용됨):**
- single·multi: ≤5 `chips` / 6~10 `grid` / >10 → 값묶음 있으면 **`filtered`**, 없으면 `list`
- quantity: >10 → **`collect`**, 이하 `stepper`
- number: 범위 넓거나(스텝 40칸 초과) 무한 → `input`, 좁으면 `stepper`

**collect** (C-1·C-2): 수량 0 행 = 이름·값묶음·증분만, **행 전체가 버튼**(클릭·Enter/Space = 1 담김 — 키보드 접근 수복). 담긴 행 = ✓ + 스테퍼 + **행 소계** + **단위**, "담음 N종 M개" 소구획으로 **그룹 선두 고정**(정렬 애니메이션 없음). 값묶음 있으면 상단 필터 칩 동반.

**filtered** (C-3): 상단 필터 칩(전체 + 묶음별 카운트) + 단일 목록. 접기 두 겹 제거.

## §2 접힘 모델 — collapseOnPick이 기본 off인 이유

실화면 검토에서 확정된 원칙: **선택이 접힘을 유발하면 대안·가격 횡단 비교를 방해한다.** 그래서 기본 리듬은 ① 초기값 `'satisfied'`(필수 미충족·담긴 그룹만 펼침 — 44행 그룹도 안 담겼으면 접힌 요약 헤더로 시작) ② 그룹 본문 끝 **"다음" 진행 버튼**(현재 접고 다음 펼치고 이동 — 컨피규레이터 prev/next 연구) ③ 헤더 토글. `collapseOnPick`은 화면 성격상 원하면 켜는 opt-in이다. 접힌 헤더는 요약 상시(✓선택값 / N종 M개 / 수치값). 스크롤·강조는 **패널 내부 스크롤만** 움직인다.

## §3 CompositionOutline — 계층 추가 메뉴 (신규)

`CompositionSection.items?: { id, label, sublabel? }[]` — **items 있는 섹션은 추가 메뉴 안에서 하위까지 드릴**(뒤로 포함) → `onAddToSection(sectionId, itemId)` 발화 → 좌측이 곧장 configure. items 없는 섹션은 `(sectionId)`만 → kk가 골라 담는 면을 연다. **좌측 `pick` 모드 경유가 사라진다.** 콜백은 additive(둘째 인자 optional)라 기존 조립 그대로 컴파일된다.

active 라인 표현 변경: 링 중첩 제거 → **은은한 채움 한 겹 + "편집 중" 마이크로 라벨**. 카운트 뱃지 삭제. 라인 구분선 삭제(간격이 구분).

## §4 kk 쪽 정리 가능 목록 (v0.56.0 반영 후)

1. `globals.css`의 `.erpOSO-sec { flex: none }` 임시 대체 → 삭제
2. Tree 제목 앞 NBSP 3개 → 삭제
3. `HierarchyPanel` 포크 → `Tree header={false}`로 대체 후 폐기
4. `note`에 단위 싣던 것 → `Choice.unit`으로 이동(부록 B에서 이미 중단 선언)
5. 헤더 수량 스테퍼 — `quantity` 미전달 시 미노출(기존 부록 B 결정 그대로 유효)

---

# 추기 2 (2026-07-28, v0.57.0 예정) — 심층 검토·목업 확정판 반영

실화면 완성도 검토(목업 8회 반복 + 업계 조사 3건: 상태 전환 기하·돈 컬럼 타이포·옵션 빌더 고점 사례)로 선택 면을 재규격화했다. **콜백·타입 계약 불변** — 렌더 규율만 바뀐다. 단, 두 가지는 R2 회신의 *정정*이다:

- **행 소계 채택 취소**: "무엇을 몇 개"는 행이, "그래서 얼마"는 풋터 소계가 말한다(같은 값 중복·앵커 붕괴 문제). `A-4의 단위`는 유지하되 `showUnits`(기본 꺼짐)로 소비처가 켠다.
- **`'collect'` 표현 지원 중단**(별칭으로 `'filtered'` 해석): 담긴 행 상단 고정·행 소계가 실검토에서 탈락하며 filtered(값묶음 칩+평면)와 동일해졌다.

**행 규율(전 표현 공통)**: 상태는 기하를 못 바꾼다 — 수량 슬롯 상시 예약(빈 행 hover "담기" 알약 → 같은 자리 스테퍼 morph), 담긴 행 배경 틴트 없음(✓마크+weight+수량값), 수량 행 숫자=단가(무부호), 택 델타만 "+ ₩"·0원/무가격은 '포함', 행높이 고정(수량 36px·택 32px).

**표현 자동 도출(갱신)**: single ≤6=**cards**(제목+델타, 선택=링 색 승격만) / ≤10=grid / >10·값묶음=filtered · multi=grid · quantity=stepper(값묶음 밴드=1열) / >10·값묶음=filtered. **2열 규칙**: 3개 이상=반폭 2열(중앙 거터+hairline), 2개 이하=반열 한 열, **값묶음 밴드와 2열은 상호배타**.

**접힘(갱신)**: `defaultCollapsed` 기본값이 `'sequential'`(첫 그룹만 펼침 — 신규 작성용, "다음" 버튼이 한 그룹씩 진행)로 바뀌었다. **재편집 진입은 `'satisfied'`를 명시**해서 넘겨라. 시점 보정: 펼침·다음=최하단 맞춤(내부 스크롤·하이라이트 없음), 잠금 담기·ref=상단 점프.

**풋터(갱신)**: 상시 경고행 삭제 → 소계가 대형 타이포로 승격. `blockedHint`는 잠금 담기 탭 시 **플로팅 배너(2.6초)**로만 표시(미지정 시 미충족 그룹명 자동 문구).

**Outline 가이드(갱신)**: 라인 해부 = [×수량?][라벨][금액]+보조 요약(있을 때만 — "옵션 미선택" 류 자리 채움 금지). **담기형 섹션은 품목 낱개 라인 대신 구성형 자식과 동형인 라인 *하나***(보조=고른 품목 나열 "경첩 8 · 손잡이 2", 금액=전체 소계)를 소비처가 집계해 주입한다.

## §5 시점 조율

- **A-1(`multi`)**: 부품은 이미 지원(축 optional). kk DB 스키마 4값 분리가 끝나는 시점에 어댑터만 바꾸면 된다 — 부품 재릴리스 불요.
- **`min?`(최소 개수)·초성 검색·D-3(그룹 스코프 검색)·스와치 렌더**: 백로그. 실수요 신호 오면 다음 릴리스.

---

# 추기 3 (2026-07-29, v0.57.0 — 추기 2와 같은 릴리스로 발행) — 저작 생태 신설·계약 확장·정정 3건

목업 2종(빌더⟷편집기 앙상블·선택 면 테스트베드)을 시각 정본으로 전면 전사했다. **§1 확장은 전부 비파괴.**

## §1 계약 확장
- `selection: 'text'` 신설 + `TextField { key, label, placeholder? }` + `OptionGroup.texts?` + `OptionSelection.texts?`(optional 축 — pickedMany 전례). required는 "전 칸 채움=충족".
- `Choice.hidden?: boolean` — **사용 안 함(봉인)**: 삭제 대신 렌더 제외(기존 선택 데이터 보존). 선택 면은 hidden을 렌더·필터·밴드 판정에서 제외한다.
- `OptionNode { id, label, kind: 'branch'|'leaf', attach: string[], children? }` — 구성 트리(OptionSetComposer). attach=옵션 id 참조이자 그 노드의 노출 순서(순서는 부착의 속성 — Square 모델).

## 위젯
- **OptionSetEditor v2.1(파괴적 교체)**: 구 props(sections/refOptions/exprVariables/adjustKeys/sectionActions/emptyState) 폐기 → `{ groups, onChange, usage?, title?, readOnly? }`. 2-pane(좌=옵션 트리(1층=유형 아이콘·2층=묶음), 우=표 작업면+단일 옵션 미리보기). 묶음=구획 저작(저장 시 Choice.group 도장 — 계약 불변). Editor가 만든 Choice는 code=id로 시작(소비처 재매핑 가능). 가격 규칙 UI(참조/직접값/배율/수식/보정)는 미노출·값 보존만 — 실수요 오면 재론.
- **OptionSetComposer 신설**: `{ nodes, onNodesChange, library, onEditOption?, onCreateOption?, selectedId?/onSelect?, labels?, title?, readOnly? }`. 정의 수정 불가(편집↗=소비처 라우팅), 미리보기=Picker 통째 내장(소계=미리보기 한정 표시 산술 — 저장 경로 없음, §6 예외로 명문화). 노드 종류 문구는 labels로 교체(기본 그룹/대상).
- **Picker 보강**: text 렌더(onText 콜백)·hidden 제외·복수 fields는 기존 그대로.

## 정정 3건 (기존 회신 뒤집음 — 실검토 확정)
1. **수량 빈 행**: hover "담기" 알약→스테퍼 morph **은퇴** → 전 행 스테퍼 상시(0 상태=잉크만 죽임·− 비활성). 행 전체 클릭=1 담김은 유지.
2. **값묶음 필터 칩**: "재클릭=해제(전체)" 폐지 → **항상 정확히 하나 활성**(첫 묶음 기본 하이라이트, 칩 간 전환만).
3. (예고) 트레이 구획 이식 시 hover 규칙: **hover는 현재 표면보다 한 단계 진하게**(fillS 위에서는 line급) — v9~13 이식 백로그에 포함.

## 타이포
큰 활자(본문 17px급)는 부품 무수정 확정 — kk 페이지에서 `data-font-scale` 큰 단을 적용하는 방식(전역 줌, 행높이 비례). 부품은 데스크탑 토큰(body 14) 그대로.
