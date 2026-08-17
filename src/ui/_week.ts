// 요일 어휘 — **주 시작·요일 이름·주말 색이 여기 하나에서 온다.**
//
// 왜 한 자리인가: 달력이 넷이다(Calendar 유기체 · CalendarPage 템플릿 · MobileCalendar 분자 ·
//  DatePicker 계열의 드롭다운). 전에는 넷이 각자 월요일 시작을 코드에 박고 있었다 — 요일 이름 배열 셋
//  (`['월'…'일']`)과 Providers의 `firstDayOfWeek` 하나. 그 상태에서 주 시작을 바꾸면 **같은 앱에서
//  달력이 갈린다**: 넷 중 하나를 놓치는 순간 「8월 3주」가 부품마다 다른 주를 가리킨다.
//  Providers의 옛 주석이 그 위험을 알고도 «1로 못박음»으로 막고 있었다 — 못박는 대신 모은다.
//
// ⚠ 주 시작은 **prop으로 열지 않는다.** 한 앱 안에서 달력마다 주 시작이 다른 건 취향이 아니라 결함이다.
//    로케일이 달라지는 날이 오면 그건 이 파일 하나를 고치는 일이 된다(그게 이 파일의 목적이다).
import dayjs, { type Dayjs } from 'dayjs';

/** 주의 첫 요일. 0=일 … 6=토. **일요일 시작**(한국 관습). */
export const WEEK_START = 0 as const;

const NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 주말 «종류» — 색 채널이 둘이라(토=파랑 · 일=빨강) 불리언이 아니다. */
export type WeekTone = 'sat' | 'sun';
export const weekTone = (day: number): WeekTone | undefined =>
  day === 6 ? 'sat' : day === 0 ? 'sun' : undefined;

/** 주 시작부터 7개 — `[이름, 주말 종류]`. 달력 머리가 이걸 그대로 깐다. */
export const WEEKDAYS: readonly (readonly [string, WeekTone?])[] =
  Array.from({ length: 7 }, (_, i) => {
    const d = (WEEK_START + i) % 7;
    return [NAMES[d], weekTone(d)] as const;
  });

/** 그 날이 속한 주의 첫날. 주 시작이 바뀌면 격자 셋이 여기 하나를 따라 움직인다. */
export const startOfWeek = (d: Dayjs): Dayjs => d.subtract((d.day() - WEEK_START + 7) % 7, 'day');

/**
 * 주차를 판정하는 기준 요일의 **주 내 위치**(ISO 관습 = 목요일 = 4).
 * 「그 주가 어느 달의 몇 주째인가」는 주 시작마다 답이 달라진다 — 월요일 시작이면 3번째 칸,
 * 일요일 시작이면 4번째 칸이 목요일이다. 그래서 상수가 아니라 도출이다.
 */
export const WEEK_ANCHOR = (4 - WEEK_START + 7) % 7;

/**
 * 공휴일 — **로케일 데이터이고, 표는 소비처가 쥔다**(오너 결정 2026-08-17).
 * 부품이 표를 물면 안 되는 이유: 설·추석·부처님오신날은 음력이고 대체공휴일은 정부가 지정한다.
 * 규칙이 아니라 표라서, 부품 안에 넣으면 **해가 바뀔 때마다 부품을 발행**해야 하고
 * 표의 유효 범위 밖에서 조용히 틀린다. 부품은 구멍만 뚫는다.
 *
 * 한 벌을 달력 계열과 날짜 입력에 **그대로** 넘길 수 있게 타입을 공유한다(변환 계층 0).
 */
export type CalendarHoliday = { date: string; name: string };

export const holidayMap = (holidays?: CalendarHoliday[]) =>
  new Map((holidays ?? []).map((h) => [h.date, h.name]));

/**
 * 날짜 입력의 드롭다운 한 칸에 달 속성 — **우리 이름만 단다**(`data-week-*`).
 * 드롭다운은 Mantine이 포털에 그리는 남의 상자다. 그 클래스를 겨누면 같은 포털을 쓰는 다른 부품까지
 * 물들기 때문에(그 사고가 이미 있었다) 우리 속성을 달고 week.css가 그 속성만 선택한다.
 *
 * 공휴일 «이름»은 칸에 넣을 자리가 없다(칸이 숫자 하나다) — 색으로 말하고 이름은 hover(title)로 준다.
 */
export const weekDayAttrs = (date: string, hol?: Map<string, string>) => {
  const name = hol?.get(date);
  return {
    'data-week-tone': weekTone(dayjs(date).day()),
    'data-week-holiday': name ? '' : undefined,
    // 오늘 — Mantine도 `data-today`를 항상 달지만 **우리 이름으로 다시 단다**: 남의 속성에 우리 색을
    //  걸면 그쪽이 계약을 바꾸는 날 조용히 사라지고, 여기선 그게 «오늘이 안 보임»으로 나타난다.
    //  ⚠ 매번 오늘을 다시 구한다(모듈 로드 시점에 굳히지 않는다) — 자정을 넘겨 켜 둔 화면에서 어제가
    //    오늘로 남는다. 하루 종일 안 닫는 ERP 화면에서 실제로 걸리는 자리다.
    'data-week-today': date === dayjs().format('YYYY-MM-DD') ? '' : undefined,
    title: name,
  };
};
