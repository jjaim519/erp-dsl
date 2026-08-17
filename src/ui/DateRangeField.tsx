// DateRangeField 분자 — DatePicker 둘 + 가운데 ~. 내부 조립형. value={start,end} 객체.
// 검증 진실은 스키마(끝≥시작) — 분자는 자체 판정하지 않는다. "시작만 있음"은 유효 중간상태.
//
// ⚠ **DateRangePicker(원자)와 쓰임으로 갈린다**(오너 결정 2026-08-17): 여기는 **폼**이다.
//    시작·끝이 각자 라벨·설명·에러를 갖는 자리 — 칸이 둘이라 FormField가 칸마다 붙을 수 있다.
//    한 칸에서 끌어 고르는 조회·필터는 DateRangePicker가 받는다. 값 모양(DateRange)은 같아서
//    두 자리 사이를 옮겨도 소비처의 데이터는 안 바뀐다.
import { Group } from './Group';
import { Text } from './Text';
import { DatePicker } from './DatePicker';
import type { DateRange } from './DateRangePicker';
import type { CalendarHoliday } from './_week';

type Props = {
  value: DateRange;
  onChange: (value: DateRange) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  name?: string;
  /** 공휴일 표시(빨강) — 두 칸에 같이 내려간다. 표는 소비처가 쥔다. */
  holidays?: CalendarHoliday[];
  /** 표기 형식 — 두 칸이 같은 표기를 쓴다(한 묶음이라 갈리면 그게 결함이다). 기본 `'YYYY-MM-DD'`. */
  format?: string;
};

export function DateRangeField({
  value, onChange, startPlaceholder, endPlaceholder, disabled, size = 'md', name, holidays, format,
}: Props) {
  return (
    <Group gap="xs" align="center">
      <DatePicker
        value={value.start}
        onChange={(start) => onChange({ ...value, start })}
        placeholder={startPlaceholder}
        disabled={disabled}
        size={size}
        name={name ? `${name}-start` : undefined}
        holidays={holidays}
        format={format}
      />
      <Text variant="body" color="secondary">~</Text>
      <DatePicker
        value={value.end}
        onChange={(end) => onChange({ ...value, end })}
        placeholder={endPlaceholder}
        disabled={disabled}
        size={size}
        name={name ? `${name}-end` : undefined}
        holidays={holidays}
        format={format}
      />
    </Group>
  );
}
