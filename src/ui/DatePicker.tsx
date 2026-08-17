// DatePicker 원자 — 단일 날짜. controlled. 다중은 MultiDatePicker, 구간은 DateRangePicker(형제 셋).
//  · **표기는 소비처가 정한다**(format) — 연도를 보일지·요일을 붙일지는 그 화면을 아는 쪽만 안다.
//    안 주면 DATE_FORMAT(_fieldStyles)이고, 그건 «우리가 고른 표기»가 아니라 안전한 기본값이다.
//    다만 안 넘기는 건 안 된다: 비워 두면 Mantine 기본이 `MMMM D, YYYY`(영어)로 나온다.
//  · 드롭다운 안쪽(월 이름·요일 머리)은 **dayjs 로케일**이라 여기서 못 고친다 — Providers의 DatesProvider가 한다.
//  · 주 시작·요일 색은 _week 하나가 정한다(달력 넷 공통). 여기서는 그 어휘를 «칸에 달아» 주기만 한다.
import { DatePickerInput as M } from '@mantine/dates';
import { fieldBorder, DATE_FORMAT } from './_fieldStyles';
import { holidayMap, weekDayAttrs, type CalendarHoliday } from './_week';
type Props = {
  value: string | null; onChange: (value: string | null) => void;
  placeholder?: string; disabled?: boolean; size?: 'sm' | 'md'; name?: string;
  /**
   * 공휴일 — 그 날을 빨강으로 표시한다(고르지 못하게 막지는 않는다: 공휴일에 시공하는 현장이 있다).
   * **표는 소비처가 쥔다** — 음력·대체공휴일은 규칙이 아니라 표라서 부품이 물면 해마다 부품을 발행해야 한다.
   * 달력 계열(CalendarPage·MobileCalendar)과 **같은 타입**이라 한 벌을 그대로 넘긴다(변환 0).
   */
  holidays?: CalendarHoliday[];
  /**
   * 표기 형식(dayjs 토큰). 기본 `'YYYY-MM-DD'`.
   * **값은 안 바뀐다** — onChange로 나가는 건 늘 ISO('YYYY-MM-DD')다. 표기만 바뀐다.
   * 예: `'M월 D일'`(같은 해 안에서만 쓰는 화면) · `'YY.MM.DD (ddd)'`(요일이 필요한 배차·시공 화면).
   */
  format?: string;
};
export function DatePicker({ value, onChange, placeholder, disabled, size = 'md', name, holidays, format = DATE_FORMAT }: Props) {
  const hol = holidayMap(holidays);
  return (
    <M value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      valueFormat={format} getDayProps={(d) => weekDayAttrs(d, hol)}
      size={size} name={name} radius="sm" styles={{ input: fieldBorder }} />
  );
}
