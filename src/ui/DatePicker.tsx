// DatePicker 원자 — 단일 날짜. controlled. 범위·다중·min/max는 분자/스키마로.
//  · 표시 형식은 **DATE_FORMAT 하나**(_fieldStyles) — 표 셀(_cells.fmtDate)과 같은 표기여야 한다.
//    안 주면 Mantine 기본이 `MMMM D, YYYY`(영어)다. prop으로 열지 않는다.
//  · 드롭다운 안쪽(월 이름·요일 머리)은 **dayjs 로케일**이라 여기서 못 고친다 — Providers의 DatesProvider가 한다.
import { DatePickerInput as M } from '@mantine/dates';
import { fieldBorder, DATE_FORMAT } from './_fieldStyles';
type Props = {
  value: string | null; onChange: (value: string | null) => void;
  placeholder?: string; disabled?: boolean; size?: 'sm' | 'md'; name?: string;
};
export function DatePicker({ value, onChange, placeholder, disabled, size = 'md', name }: Props) {
  return (
    <M value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      valueFormat={DATE_FORMAT}
      size={size} name={name} radius="sm" styles={{ input: fieldBorder }} />
  );
}
