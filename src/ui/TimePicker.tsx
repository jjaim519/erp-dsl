'use client';
// TimePicker 원자 — **시각 하나.** 날짜=DatePicker, 구간=DateRangePicker와 별개 축.
//
//  ⚠ **v0.93까지 이건 네이티브 위젯이었다(결함).** `@mantine/dates`의 `TimeInput`은 렌더를 브라우저에
//   넘긴다(`TimeInput.mjs` — `type: "time"`을 `InputBase`에 그대로 꽂는다). 그래서 화면에 뜬 것이
//   우리 부품이 아니라 **OS 위젯**이었고, 따라오는 것이 전부 우리 손 밖이었다:
//    ① 로케일이 12시간제를 붙인다 — 한국 크롬에서 `오전 09:30`. **웹앱이 24시간제를 강제할 방법이 없다**
//       (whatwg/html#6698, 아직 열린 이슈). 그룹웨어에서 오전/오후는 열 축이 아니다.
//    ② 값이 비면 `-- --:--`. placeholder도 폭도 우리가 못 정한다(세그먼트 수가 로케일마다 다르다).
//    ③ Safari는 피커 UI 자체가 없다(mdn/browser-compat-data#21674).
//   **형제 비대칭이 결정타였다** — `DatePicker`는 `DatePickerInput`으로 우리가 그리고 `_week` 어휘를
//   칸에 달고 표기를 소비처에 넘기는데, 시각만 OS에 위임하고 있었다.
//   → Mantine v8 `TimePicker`(우리가 그리는 분절 필드)로 교체. 업계도 여기 있다 —
//     USWDS·Carbon 둘 다 네이티브를 안 쓴다.
//
//  · **`format`은 축이 아니다.** `'24h'`로 못박는다(위 ①).
//  · **`minutesStep`이 드롭다운을 켠다 — 축을 따로 두지 않는다.** 1분 간격 드롭다운은 60행 스크롤이라
//    쓸 자리가 없고, 이산 간격 없이 드롭다운만 켜는 것도 마찬가지다. 하나의 사실이면 축도 하나다
//    (`Anchor.external` 선례). 안 주면 자유 입력(정확한 시각 — 도착·검침·통화 기록).
//
//  ⚠ **드롭다운은 「시 열 + 분 열」이 아니라 «완성된 시각 하나»의 목록이다**(2026-08-21 오너 지적:
//   *「왜 하이라이트는 시간인데 분도 선택할 수 있는거야?」*). 열 모델은 「단위를 따로 고른다」가 전제라
//   **초점이 있는 단위와 목록이 어긋난다** — 시 칸에 초점이 있어도 두 열이 다 열려 있다.
//   게다가 Mantine의 열 드롭다운은 범위를 **하드코딩한다**(`TimePicker.mjs` — `min: 0, max: 23` /
//   `0, 59`). 우리가 준 `min`/`max`는 blur 때 clamp만 걸리고 목록엔 안 먹어서, 09~18로 잡아도
//   04가 목록에 떴다. 둘 다 「성긴 눈금에 정밀 도구를 쓴」 하나의 증상이다.
//   → `presets`로 **완성된 시각의 평평한 목록**을 넘긴다. 범위가 «구성으로» 맞고, 고를 것이 하나다.
//     업계가 여기 있다 — MUI 데스크탑 TimePicker의 기본은 `DigitalClock`(한 줄 목록·30분)이고
//     열 모델(`MultiSectionDigitalClock`·5분)은 «더 잘게 골라야 할 때»로 못박혀 있다.
//     USWDS도 한 목록(기본 30분)이고 Carbon엔 열 모델 자체가 없다.
//  · **평평한 목록이 자유 입력을 막지는 않는다.** 칸은 여전히 분절 필드라 09:17을 손으로 적을 수 있다 —
//    목록은 「흔한 것」을 눈앞에 두는 것이지 값의 울타리가 아니다(울타리는 `min`/`max`다).
//  · 예약 슬롯처럼 **고를 것이 격자로 펼쳐져야 하는 자리**는 이 부품이 아니다(입력 칸이 아니라 선택 격자).
//    Mantine `TimeGrid`가 그 자리인데, 별개 부품으로 세울지는 위젯 재판정 때 본다.
import { TimePicker as M, getTimeRange } from '@mantine/dates';
import { fieldBorder } from './_fieldStyles';

type Props = {
  /** `"HH:MM"`. 비면 `""`. */
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  name?: string;
  /**
   * 분 간격. 주면 그 간격의 **드롭다운이 함께 열린다**(30 → 09:00·09:30·10:00…).
   * 안 주면 1분 자유 입력. 회의·배차처럼 「공통 눈금」이 있는 화면만 준다 —
   * USWDS도 30분을 기본으로 두되 「정확한 시각」에는 쓰지 말라고 못박는다.
   */
  minutesStep?: number;
  /** 고를 수 있는 하한 `"HH:MM"`(업무 시작). 벗어난 값은 칸이 안 받는다. */
  min?: string;
  /** 상한 `"HH:MM"`(업무 종료). */
  max?: string;
};

export function TimePicker({ value, onChange, size = 'md', disabled, name, minutesStep, min, max }: Props) {
  //  간격을 주면 그 눈금의 «완성된 시각» 목록을 만든다. 범위를 안 주면 하루 전체(30분이면 48칸) —
  //   MUI DigitalClock의 기본과 같은 자리다. 간격은 `"00:MM"`으로 넘긴다(초 단위로 환산되므로
  //   90분처럼 60을 넘는 값도 그대로 산다).
  //  ⚠ **초를 뗀다.** `getTimeRange`는 늘 `"HH:MM:SS"`를 주는데, 목록에서 고른 값은 Mantine이
  //   **가공 없이 그대로** 내보낸다(`use-time-picker.mjs` — `onChange?.(timeString)`, `next.value`가 아니다).
  //   안 떼면 손으로 적을 땐 `"09:30"`, 목록에서 고를 땐 `"09:30:00"`이 나가서 «같은 칸이 두 모양»이 된다.
  const presets = minutesStep === undefined ? undefined
    : getTimeRange({ startTime: min ?? '00:00', endTime: max ?? '23:59', interval: `00:${minutesStep}` })
        .map((t) => t.slice(0, 5));

  return (
    <M
      value={value}
      onChange={onChange}
      format="24h"
      minutesStep={minutesStep}
      withDropdown={minutesStep !== undefined}
      presets={presets}
      min={min}
      max={max}
      size={size}
      disabled={disabled}
      name={name}
      radius="sm"
      styles={{
        input: fieldBorder,
        // 뜬 것은 overlay 고도다(Modal·Popover와 같은 자). Mantine 기본 그림자를 쓰면 우리 2축 밖으로 샌다.
        dropdown: { boxShadow: 'var(--elevation-overlay)' },
      }}
    />
  );
}
