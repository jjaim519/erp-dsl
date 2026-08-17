// DateRangePicker 원자 — **한 칸에서 시작~끝을 이어서 고른다**(연속 구간 하나).
// DatePicker(단일)·MultiDatePicker(흩어진 여러 날)의 셋째 형제다. 받는 데이터가 다르다:
// 「구간」은 두 날짜가 아니라 *하나의 값*이라 그 사이가 달력에서 이어져 보여야 하고, 그래서 칸이 하나다.
//
// ⚠ **DateRangeField(분자)와 경쟁하지 않는다 — 쓰임으로 갈린다**(오너 결정 2026-08-17).
//    · 이 원자 = 조회·필터. 「8/1~8/31」을 한 번에 집어 오는 자리. 끌어서 고르는 게 빠르다.
//    · DateRangeField = 폼. 시작·끝이 **각자 라벨·설명·에러를 갖는** 자리(FormField가 칸마다 붙는다).
//      한 칸으로는 "끝일을 비워 두세요" 같은 안내를 어디에도 붙일 수 없다.
//    값 모양은 **같다**(DateRange) — 그래서 자리가 바뀌어도 소비처의 데이터는 안 바뀐다.
//
// 경계 닫기는 형제들과 동일: label/description/required → FormField, min/max → 스키마, className/style → 규칙 3.
// **표기는 소비처가 정한다** — 구간은 특히 그렇다: 「8/1 ~ 8/31」인지 「2026-08-01 ~ 2026-08-31」인지,
//  이음말이 `~`인지 `→`인지는 그 화면의 폭과 관습이 정한다(우리가 고르면 어느 화면에선 칸을 넘친다).
import { DatePickerInput as M } from '@mantine/dates';
import { fieldBorder, DATE_FORMAT } from './_fieldStyles';
import { holidayMap, weekDayAttrs, type CalendarHoliday } from './_week';

/** 구간 값 — 「시작만 골랐다」는 **유효한 중간 상태**다(끝이 null). 검증 진실은 스키마(끝 ≥ 시작). */
export type DateRange = { start: string | null; end: string | null };

type Props = {
  value: DateRange; onChange: (value: DateRange) => void;
  placeholder?: string; disabled?: boolean; size?: 'sm' | 'md'; name?: string;
  /** 공휴일 표시(빨강) — DatePicker와 같은 계약. 표는 소비처가 쥔다. */
  holidays?: CalendarHoliday[];
  /** 표기 형식(dayjs 토큰). 기본 `'YYYY-MM-DD'`. 값은 늘 ISO다 — 표기만 바뀐다. */
  format?: string;
  /** 두 날짜를 잇는 말. 기본 `'~'`. 칸이 좁으면 `'~'`, 흐름을 말해야 하면 `'→'`. */
  separator?: string;
};

export function DateRangePicker({
  value, onChange, placeholder, disabled, size = 'md', name, holidays,
  format = DATE_FORMAT, separator = '~',
}: Props) {
  const hol = holidayMap(holidays);
  return (
    <M
      type="range"
      // 안팎의 모양이 다르다 — 밖은 이름 있는 객체({start,end}), 안은 Mantine의 튜플.
      //  객체로 내보내는 이유: 배열은 `[0]`이 시작인지 끝인지를 읽는 사람이 기억해야 한다.
      value={[value.start, value.end]}
      onChange={([start, end]) => onChange({ start: start ?? null, end: end ?? null })}
      placeholder={placeholder} disabled={disabled}
      valueFormat={format} labelSeparator={separator} getDayProps={(d) => weekDayAttrs(d, hol)}
      size={size} name={name} radius="sm" styles={{ input: fieldBorder }}
    />
  );
}
