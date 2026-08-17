// Calendar (유기체) — 월 달력. 셀당 이벤트 배지 + 셀 클릭. 닫힌 이벤트 스키마 + 콜백만.
//  · 도메인 무지: 이벤트 색·라벨은 데이터 주입(DataTable=columns, Timeline=events와 동형). 캘린더는 도메인을 모른다.
//  · 함정 회피(03 §11-3): 뷰 토글·셀 렌더 슬롯·옵션 토글 0개. 월 뷰 단일. 변형 필요 시 별개 부품으로.
//  · 모달 비소유: 셀 클릭은 onSelectDate로 신호만. 그날 무엇을 띄울지는 페이지가 결정(raw 슬롯 차단).
//  · 7열 그리드는 우리 Grid(12의 약수만)로 못 만들어 격리 구역 raw CSS grid로 짠다(calendar.css, 명시 예외).
import { Stack } from './Stack';
import { Group } from './Group';
import { Text } from './Text';
import { Title } from './Title';
import { Badge } from './Badge';
import { IconButton } from './IconButton';
import type { BadgeColor } from './_cells';
import { WEEKDAYS, startOfWeek } from './_week';
import dayjs from 'dayjs';

type CalendarEvent = {
  id: string;
  date: string;        // ISO 'YYYY-MM-DD'
  label: string;       // 배지 텍스트(예: 현장명) — 콘텐츠 prop
  tone: BadgeColor;    // 배지 색 — 닫힌 enum 5종
};

type CalendarProps = {
  month: string;                                                     // 'YYYY-MM' 표시 월 (controlled)
  onMonthChange: (month: string) => void;                            // 이전/다음 달 네비
  events: CalendarEvent[];
  onSelectDate?: (date: string, dayEvents: CalendarEvent[]) => void; // 셀 클릭 → 페이지가 모달 소유
  onSelectEvent?: (event: CalendarEvent) => void;                    // 배지 직접 클릭(선택)
};

const MAX_BADGES = 3;                                        // 셀당 배지 최대(고정) + "+N"

export function Calendar({ month, onMonthChange, events, onSelectDate, onSelectEvent }: CalendarProps) {
  const monthStart = dayjs(`${month}-01`);
  const today = dayjs();

  // 그리드의 첫 칸(이전 달 꼬리 포함) — 주 시작은 _week 하나가 정한다(달력 넷이 같은 값을 봐야 한다).
  const gridStart = startOfWeek(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day')); // 7×6 고정

  // 날짜별 이벤트 묶음
  const byDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const list = byDate.get(ev.date);
    if (list) list.push(ev);
    else byDate.set(ev.date, [ev]);
  }

  const monthLabel = `${monthStart.year()}년 ${monthStart.month() + 1}월`;
  const goPrev = () => onMonthChange(monthStart.subtract(1, 'month').format('YYYY-MM'));
  const goNext = () => onMonthChange(monthStart.add(1, 'month').format('YYYY-MM'));

  // 좁은 화면 폴백용: 표시 월의 이벤트를 날짜순으로
  const monthEvents = events
    .filter((e) => e.date.startsWith(month))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const renderBadge = (ev: CalendarEvent) => (
    <span
      key={ev.id}
      className={`erp-cal-event${onSelectEvent ? ' is-clickable' : ''}`}
      onClick={onSelectEvent ? (e) => { e.stopPropagation(); onSelectEvent(ev); } : undefined}
    >
      <Badge color={ev.tone}>{ev.label}</Badge>
    </span>
  );

  return (
    <Stack gap="md">
      {/* 월 네비게이션 헤더 (< 2026년 6월 >) */}
      <Group justify="between" align="center">
        <IconButton icon="chevron-left" label="이전 달" variant="ghost" onClick={goPrev} />
        <Title variant="subheading">{monthLabel}</Title>
        <IconButton icon="chevron-right" label="다음 달" variant="ghost" onClick={goNext} />
      </Group>

      {/* 월 그리드(7×6) — 격리 구역 raw CSS grid */}
      <div className="erp-cal-grid">
        {WEEKDAYS.map(([w, tone]) => (
          <div className="erp-cal-head" key={w} data-week-tone={tone}>
            <Text variant="caption" color="secondary">{w}</Text>
          </div>
        ))}
        {cells.map((d) => {
          const dateStr = d.format('YYYY-MM-DD');
          const isOther = d.month() !== monthStart.month();
          const isToday = d.isSame(today, 'day');
          const dayEvents = byDate.get(dateStr) ?? [];
          const clickable = !!onSelectDate;
          return (
            <div
              key={dateStr}
              className={`erp-cal-cell${isOther ? ' is-other' : ''}${clickable ? ' is-clickable' : ''}`}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onSelectDate(dateStr, dayEvents) : undefined}
              onKeyDown={clickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDate(dateStr, dayEvents); }
              } : undefined}
            >
              <span>
                {isToday ? (
                  <span className="erp-cal-today"><Text variant="caption">{d.date()}</Text></span>
                ) : (
                  <Text variant="caption" color={isOther ? 'secondary' : 'primary'}>{d.date()}</Text>
                )}
              </span>
              {dayEvents.slice(0, MAX_BADGES).map(renderBadge)}
              {dayEvents.length > MAX_BADGES && (
                <Text variant="caption" color="secondary">+{dayEvents.length - MAX_BADGES}</Text>
              )}
            </div>
          );
        })}
      </div>

      {/* 좁은 화면 폴백 — 다가오는 이벤트 리스트(CSS media query로 토글) */}
      <div className="erp-cal-list">
        <Stack gap="sm">
          {monthEvents.length === 0 ? (
            <Text variant="body" color="secondary">이 달의 이벤트가 없습니다.</Text>
          ) : (
            monthEvents.map((ev) => (
              <Group key={ev.id} justify="between" align="center">
                <Text variant="body" color="secondary">{dayjs(ev.date).format('M월 D일')}</Text>
                {renderBadge(ev)}
              </Group>
            ))
          )}
        </Stack>
      </div>
    </Stack>
  );
}
