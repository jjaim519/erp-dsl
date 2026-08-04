'use client';
// MobileCalendar (분자) — 모바일 월 달력. **화면을 꽉 채우고 스팬 바로 기간을 읽는다.**
//  · 바가 곧 읽는 대상이다: 여러 날 일정은 *하나의 연속 알약*이어야 "언제부터 언제까지"·겹침·연속이 읽힌다.
//    점으로 축약하면 그 수행 자체가 사라진다. 근거: iOS 18이 월 뷰를 Compact/**Stacked**/Details로 재편하며
//    iOS 17의 점 표기를 교체했다 — 취한 건 Stacked(이벤트마다 얇은 알약이 쌓임).
//  · **높이가 이 부품의 절반이다.** 달력을 섹션에 가두면 주 행이 짓눌려 바가 "날짜 밑줄"처럼 보인다(실측:
//    iOS 주 행 ~87pt vs 갇힌 우리 46px). 그래서 fill 모드에서 셸 본문을 전부 차지하고,
//    주 행은 **필요한 만큼 가져가고 남는 높이를 균등 분배**한다(바쁜 주는 커지고 한산한 주가 자리를 내준다).
//  · 데스크탑 CalendarPage와 **데이터 모델·레인 알고리즘 공유** — 소비처가 같은 events/encoding/annotations를
//    그대로 넘긴다(변환 0). packLanes는 _calendarLanes에 한 벌만 둬 적층 순서가 두 화면에서 갈리지 않는다.
//  · 바는 축을 여럿 싣는다(1차원 아님): 색=분류(anchor) / 윤곽=상태(status) / 우측 표식=두 번째 범주 축(mark).
//    표식이 무엇인지는 부품이 모른다 — glyph·색을 소비처가 주고 부품은 자리만 내준다(헌법 1).
//  · 큰 월 제목을 이 부품이 소유한다(MobileTop을 같이 쓰지 않는다 — 제목이 둘이 된다). iOS와 같은 구성.
//  · 오늘 = **꽉 찬 원**, 선택 = 윤곽 원. iOS와 같은 위계다: 오늘은 *항상 거기 있는* 기준점이라 가장 강한
//    표현을 갖고, 선택은 탭하면 다른 화면으로 넘어가는 *일시적* 표시라 약하게 둔다. 둘이 겹치면 오늘이 이긴다
//    (이미 최대 강조라 더할 게 없다). 그전엔 반대로 걸어 오늘이 윤곽뿐이라 눈에 안 띄었다.
//  · 선택은 두 갈래: 바를 누르면 그 일정(onSelectEvent), 빈 곳을 누르면 그 날(onSelect). 무엇을 띄울지는
//    소비처가 정한다 — 보통 화면 전체 상세로 간다(데스크탑 Calendar의 "모달 비소유"와 같은 경계).
//  · 7열 그리드는 우리 Grid(12의 약수만)로 못 만들어 격리 raw CSS grid(calendarpage.css 선례와 같은 명시 예외).
import { useState } from 'react';
import dayjs from 'dayjs';
import { Chip } from './Chip';
import { IconButton } from './IconButton';
import { packLanes } from './_calendarLanes';
import type { CalendarEvent, CalendarAnnotation, CalendarEncoding, CalendarHoliday } from './CalendarPage';
import './mobilelist.css';

type Props = {
  month: string;                          // 'YYYY-MM' (controlled — 상태 주인은 소비처)
  onMonthChange: (month: string) => void;
  selected?: string;                      // 'YYYY-MM-DD'
  onSelect: (date: string) => void;       // 빈 곳(날짜) 선택
  onSelectEvent?: (e: CalendarEvent) => void;  // 바 선택 — 없으면 바는 표시 전용
  events?: CalendarEvent[];
  encoding: CalendarEncoding;             // 색·적층 순서 — 데스크탑과 동일 규칙
  annotations?: CalendarAnnotation[];     // background=셀 틴트 / banner=주 상단 라벨 바
  holidays?: CalendarHoliday[];
  fill?: boolean;                         // true=셸 본문 높이를 전부 차지(달력 전용 화면). 기본 false=내용만큼
  maxLanes?: number;                      // 한 주에 쌓을 최대 레인(기본 6). 넘치면 그 칸에 +N
};

const WEEK: [string, string?][] = [['월'], ['화'], ['수'], ['목'], ['금'], ['토', 'sat'], ['일', 'sun']];
const cvar = (role: string, s: number) => `var(--mantine-color-${role}-${s})`;
// 바 표면 — 데스크탑 CalendarPage와 같은 레시피(두 화면 공통 표현).
//  좌측 강조선을 두지 않는다: 분류는 이미 톤 배경이 말하고 있어 같은 정보를 두 번 말하는 것이고,
//  범례 칩(톤 채움)과 바가 달라 보이게 만드는 원인이었다. 바와 칩은 같은 톤 알약이어야 대응이 읽힌다.
const barCss = (role: string, emphasis: 'solid' | 'dashed') =>
  emphasis === 'dashed'
    ? { background: cvar(role, 0), border: `1.4px dashed ${cvar(role, 5)}`, color: cvar(role, 6), opacity: 0.7 }
    : { background: cvar(role, 2), color: cvar(role, 8) };
const NUM_ROW = 44;   // 날짜 줄 확보 — 숫자(28) + 위 여백(4) + **아래 숨통(12)**. 바가 숫자에 붙으면 밑줄처럼 읽힌다.
const LANE_H = 26;    // 알약 22 + 간격 4

export function MobileCalendar({
  month, onMonthChange, selected, onSelect, onSelectEvent,
  events = [], encoding, annotations = [], holidays = [],
  fill = false, maxLanes = 6,
}: Props) {
  // 범례 겸 필터 — 축이 셋이다: 분류(anchor) / 표식(mark) / 태그(annotations). 한 줄에 두되 divider로 가른다.
  //  세 축은 이벤트에 *동시에* 붙는다(1차원 분류가 아니다) — 그래서 축 사이는 AND, 축 안은 OR이고
  //  divider가 그 논리 경계를 표시한다. hidden 접두로 축을 구분: k:(분류) m:(표식) t:(태그).
  //  색만 있고 이름이 없으면 navy가 시공인지, 회색 셀이 무엇인지 알 방법이 없다(데스크탑엔 범례가 있다).
  //  **색은 메인 축(anchor)만 갖는다.** anchor 색은 곧 바의 색이라 칩이 그 톤이면 대응을 배울 필요가 없다.
  //  mark(작은 표식)·태그(배너·틴트)까지 칠하면 칩 줄이 무지개가 되고, 어느 색이 바 색인지도 흐려진다.
  //  → 나머지 두 축은 중립색 필터 칩. 구분은 divider와 라벨이 맡는다.
  //  체크마크는 안 쓴다: 기본이 전부 켜짐이라 체크가 모든 칩에 붙어 아무것도 구분하지 못한다.
  //  숨김은 UI 표현이라 내부 소유(데스크탑 hidden Set과 동형).
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setHidden((prev) => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const base = dayjs(`${month}-01`);
  const today = dayjs();
  const holMap = new Map(holidays.map((h) => [h.date, h.name]));

  const evStart = (e: CalendarEvent) => dayjs(e.start);
  const evEnd = (e: CalendarEvent) => dayjs(e.end ?? e.start);
  const anStart = (a: CalendarAnnotation) => dayjs(a.start);
  const anEnd = (a: CalendarAnnotation) => dayjs(a.end ?? a.start);

  // 적층 중요도 — 데스크탑과 같은 규칙(anchor/status의 *정의 순서*).
  const anchorKeys = Object.keys(encoding.anchor.values);
  const statusKeys = encoding.status ? Object.keys(encoding.status.values) : [];
  const aiOf = (e: CalendarEvent) => anchorKeys.indexOf(e.attrs?.[encoding.anchor.attr] ?? '');
  const siOf = (e: CalendarEvent) => (encoding.status ? statusKeys.indexOf(e.attrs?.[encoding.status.attr] ?? '') : 0);
  const toneOf = (e: CalendarEvent) => encoding.anchor.values[e.attrs?.[encoding.anchor.attr] ?? '']?.color ?? 'neutral';
  // 두 번째 범주 축의 표식 — 무엇인지는 부품이 모른다(소비처가 glyph·색을 준다).
  const markOf = (e: CalendarEvent) =>
    (encoding.mark ? encoding.mark.values[e.attrs?.[encoding.mark.attr] ?? ''] : undefined);
  const emphOf = (e: CalendarEvent) =>
    (encoding.status ? encoding.status.values[e.attrs?.[encoding.status.attr] ?? '']?.emphasis : undefined) ?? 'solid';

  const visAnnos = annotations.filter((an) => !hidden.has('t:' + an.id));

  const monStart = (d: dayjs.Dayjs) => d.subtract((d.day() + 6) % 7, 'day');
  const gridStart = monStart(base.startOf('month'));
  const weekCount = monStart(base.endOf('month')).diff(gridStart, 'week') + 1;

  // 주별 레이아웃을 먼저 계산한다 — 행 높이가 그 주의 레인 수에 달려 있어서(동적 분배).
  const rows = Array.from({ length: weekCount }, (_, w) => {
    const ws = gridStart.add(w * 7, 'day');
    const we = ws.add(6, 'day');
    const segs = events
      .filter((e) => !hidden.has('k:' + (e.attrs?.[encoding.anchor.attr] ?? '')))
      .filter((e) => !encoding.mark || !hidden.has('m:' + (e.attrs?.[encoding.mark.attr] ?? '')))
      .filter((e) => !(evEnd(e).isBefore(ws, 'day') || evStart(e).isAfter(we, 'day')))
      .map((e) => ({
        e,
        a: Math.max(0, evStart(e).diff(ws, 'day')),
        b: Math.min(6, evEnd(e).diff(ws, 'day')),
        ai: aiOf(e), si: siOf(e),
        isStart: !evStart(e).isBefore(ws, 'day'),
        isEnd: !evEnd(e).isAfter(we, 'day'),
      }));
    const { out } = packLanes(segs);
    const banners = visAnnos.filter((an) => an.display === 'banner'
      && !(anEnd(an).isBefore(ws, 'day') || anStart(an).isAfter(we, 'day')));
    const shown = out.filter((it) => it.lane < maxLanes);
    const lanes = Math.min(maxLanes, out.reduce((m, it) => Math.max(m, it.lane + 1), 0));
    const overflowOn = (col: number) => out.filter((it) => it.lane >= maxLanes && it.a <= col && col <= it.b).length;
    const hasOverflow = Array.from({ length: 7 }, (_, c) => overflowOn(c)).some((n) => n > 0);
    // 그 주가 *필요로 하는* 높이. flex-basis로 쓰고, 남는 높이는 모든 주가 균등히 나눠 가진다.
    const need = NUM_ROW + banners.length * 26 + lanes * LANE_H + (hasOverflow ? 14 : 0);
    return { ws, shown, banners, lanes, overflowOn, need };
  });

  return (
    <div className={fill ? 'mcal fill' : 'mcal'}>
      {/* 헤더 — 큰 월 제목을 달력이 소유한다(iOS 구성). 화면 제목을 따로 두지 않는다. */}
      <div className="mcal-hd">
        <IconButton icon="chevron-left" label="이전 달" variant="ghost" size="sm"
          onClick={() => onMonthChange(base.subtract(1, 'month').format('YYYY-MM'))} />
        <span className="mcal-title">{base.format('YYYY년 M월')}</span>
        <IconButton icon="chevron-right" label="다음 달" variant="ghost" size="sm"
          onClick={() => onMonthChange(base.add(1, 'month').format('YYYY-MM'))} />
      </div>

      {/* 범례 겸 필터 — 가로 스크롤(줄바꿈 대신 옆으로). 두 축은 세로 divider로 가른다. */}
      <div className="mcal-kinds">
        {Object.entries(encoding.anchor.values).map(([key, spec]) => (
          <Chip key={key} variant="legend" color={spec.color} selected={!hidden.has('k:' + key)} onChange={() => toggle('k:' + key)}>
            {spec.label}
          </Chip>
        ))}
        {encoding.mark && <span className="mcal-kinds-sep" aria-hidden="true" />}
        {encoding.mark && Object.entries(encoding.mark.values).map(([key, spec]) => (
          <Chip key={key} variant="legend" color="neutral"
            selected={!hidden.has('m:' + key)} onChange={() => toggle('m:' + key)}>
            {spec.label}
          </Chip>
        ))}
        {annotations.length > 0 && <span className="mcal-kinds-sep" aria-hidden="true" />}
        {annotations.map((an) => (
          <Chip key={an.id} variant="legend" color="neutral" selected={!hidden.has('t:' + an.id)} onChange={() => toggle('t:' + an.id)}>
            {an.label}
          </Chip>
        ))}
      </div>

      <div className="mcal-week">
        {WEEK.map(([w, c]) => <span key={w} className="mcal-wd" data-weekend={c}>{w}</span>)}
      </div>

      <div className="mcal-body">
        {rows.map(({ ws, shown, banners, lanes, overflowOn, need }, w) => (
          <div key={w} className="mcal-wk" style={{ flexBasis: need, minHeight: need }}>
            <div className="mcal-grid">
              {Array.from({ length: 7 }, (_, c) => {
                const d = ws.add(c, 'day');
                const iso = d.format('YYYY-MM-DD');
                const hol = holMap.get(iso);
                const bg = visAnnos.find((an) => (an.display ?? 'background') === 'background'
                  && !d.isBefore(anStart(an), 'day') && !d.isAfter(anEnd(an), 'day'));
                return (
                  <button
                    key={c}
                    type="button"
                    className="mcal-cell"
                    style={{ background: bg ? cvar(bg.tone, 0) : undefined }}
                    data-outside={d.month() !== base.month() || undefined}
                    data-selected={iso === selected || undefined}
                    data-today={d.isSame(today, 'day') || undefined}
                    data-holiday={hol ? '' : undefined}
                    onClick={() => onSelect(iso)}
                  >
                    <span className="mcal-num">{d.date()}</span>
                  </button>
                );
              })}
            </div>

            {/* 배너 태그 — 이벤트 바 위 레인 */}
            {banners.length > 0 && (
              <div className="mcal-banners" style={{ top: NUM_ROW }}>
                {banners.map((an) => {
                  const a = Math.max(0, anStart(an).diff(ws, 'day'));
                  const b = Math.min(6, anEnd(an).diff(ws, 'day'));
                  return (
                    <span key={an.id} className="mcal-banner"
                      style={{ gridColumn: `${a + 1} / span ${b - a + 1}`, background: cvar(an.tone, 6) }}>
                      {an.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* 이벤트 스팬 바 — 주 경계에서 잘리면 그쪽 끝을 삼각형으로 깎아 "계속됨"을 표시(데스크탑 cont-l/cont-r과 같은 신호·같은 클래스명).
                라벨은 **조각마다 반복한다.** 전에는 `isStart`인 조각에만 그려서, 3주에 걸친 일정이
                둘째·셋째 주에서는 이름 없는 색 막대가 됐다 — 데스크탑은 반복하는데 여기만 안 해서
                **같은 데이터가 두 표현에서 다르게 읽혔다**(v0.73.0 수정). prop으로 열지 않는다:
                안 반복하는 게 맞는 사례가 나오면 그때 축을 연다(06 §3-1). */}
            <div className="mcal-bars" style={{ top: NUM_ROW + banners.length * 26 }}>
              {shown.map((it) => (
                <button
                  key={it.e.id}
                  type="button"
                  className={['mcal-bar', it.isStart ? '' : 'cont-l', it.isEnd ? '' : 'cont-r'].filter(Boolean).join(' ')}
                  disabled={!onSelectEvent}
                  style={{
                    ...barCss(toneOf(it.e), emphOf(it.e)),
                    gridColumn: `${it.a + 1} / span ${it.b - it.a + 1}`,
                    gridRow: it.lane + 1,
                  }}
                  onClick={() => onSelectEvent?.(it.e)}
                >
                  <span className="mcal-bartxt">{it.e.label}</span>
                  {/* 표식 = 남은 유일한 채널(색=분류, 윤곽=상태, 길이=기간, 텍스트=라벨은 이미 점유).
                      라벨이 먼저 줄고 표식은 남는다 — 좁은 칸에서도 두 번째 축은 읽혀야 한다. */}
                  {markOf(it.e) && (
                    <span className="mcal-mark"
                      style={markOf(it.e)!.color ? { background: cvar(markOf(it.e)!.color!, 6) } : undefined}>
                      {markOf(it.e)!.glyph}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 넘친 개수 — 칸마다 +N */}
            <div className="mcal-more" style={{ top: NUM_ROW + banners.length * 26 + lanes * LANE_H }}>
              {Array.from({ length: 7 }, (_, c) => {
                const n = overflowOn(c);
                return <span key={c} className="mcal-morecell">{n > 0 ? `+${n}` : ''}</span>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
