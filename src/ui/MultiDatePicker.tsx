// MultiDatePicker 원자 — 여러 개의 *개별* 날짜를 한 입력칸에서 고른다(집합 = string[]).
// DatePicker의 형제 원자다: 화면상 "날짜 입력 한 칸"으로 더 쪼갤 수 없고(원자),
// 받는 데이터만 다르다(단일 Date vs Date 배열 — TextInput/NumberInput을 데이터로 가른 논리와 동일).
// **연속 구간(start~end)은 의미가 달라 DateRangePicker가 받는다** — 흩어진 날짜들과 한 구간은 같은 값이 아니다.
// 표기도 DatePicker와 같은 계약이다 — 소비처가 format으로 정하고, 안 주면 DATE_FORMAT이 기본값.
// 경계 닫기는 DatePicker와 동일: label/description/required → FormField, radius·variant 래퍼 고정,
// min/max → 스키마, className/style → 규칙 3.
import { DatePickerInput as M } from '@mantine/dates';
import { fieldBorder, DATE_FORMAT } from './_fieldStyles';
import { holidayMap, weekDayAttrs, type CalendarHoliday } from './_week';
type Props = {
  value: string[]; onChange: (value: string[]) => void;
  placeholder?: string; disabled?: boolean; size?: 'sm' | 'md'; name?: string;
  /** 공휴일 표시(빨강) — DatePicker와 같은 계약. 표는 소비처가 쥔다. */
  holidays?: CalendarHoliday[];
  /** 표기 형식(dayjs 토큰). 기본 `'YYYY-MM-DD'`. 값은 늘 ISO다 — 표기만 바뀐다. */
  format?: string;
};
export function MultiDatePicker({ value, onChange, placeholder, disabled, size = 'md', name, holidays, format = DATE_FORMAT }: Props) {
  const hol = holidayMap(holidays);
  return (
    <M type="multiple" value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      valueFormat={format} getDayProps={(d) => weekDayAttrs(d, hol)}
      size={size} name={name} radius="sm" styles={{ input: fieldBorder }} />
  );
}
