'use client';
// CalendarPage (템플릿) — "자원×시간" 스케줄 화면 골격. 도메인 0줄(헌법 1).
//  · 주력 = 리소스 타임라인(행=기준축, x=일, spanning 바). 범위 1주(기본)/2주, 더 줌아웃=월 그리드.
//  · 데이터/표현 분리: CalendarEvent.attrs=임의 차원 · CalendarEncoding=attr→채널 매핑. 색은 6역할 팔레트만(헌법 8).
//  · 태그(annotations) = "기간 표식"(이벤트 아님). 배경형(색+윤곽, 라벨은 범례·hover) / 배너형(상단 라벨 바). display로 선택.
//    본문엔 텍스트 0 → 의미는 접힘 범례(색→라벨·필터) + hover/포커스 툴팁. (보통 ≤6색이라 색으로 구분)
//  · today = 날짜 채운 원(양 뷰) + 타임라인 헤더 "오늘" 배지. (간트 라인/음영 대신 — 과한 표현 역효과)
//  · 7열/일 트랙은 raw CSS grid 명시 예외(calendarpage.css). 주말 토=파랑/일=빨강, 공휴일 holidays 주입.
//  · [백로그] 선택→태그/일정 저작·빈칸 hover+·드래그 이동/리사이즈·일괄 = 공통 DnD 정립 때.
import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import dayjs from 'dayjs';
import { PageHeader } from './PageHeader';
import { Page } from './Page';
import { SegmentedControl } from './SegmentedControl';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { Drawer } from './Drawer';
import { EmptyState } from './EmptyState';
import { Stack } from './Stack';
import { Group } from './Group';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import './calendarpage.css';

export type CalendarColorRole = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type CalendarEvent = {
  id: string;
  start: string;            // ISO 'YYYY-MM-DD'
  end?: string;             // ISO inclusive; 미지정 = start
  label: string;
  attrs?: Record<string, string>;  // 임의 차원 — 부품은 의미를 모른다
};
export type CalendarHoliday = { date: string; name: string };  // 로케일 데이터(주입) — 부품은 달력을 모른다
// 태그(기간 표식) — 이벤트와 별개. display: 'background'(색+윤곽, 환경) | 'banner'(상단 라벨 바, 종일 이벤트식).
export type CalendarAnnotation = {
  id: string;
  start: string;
  end?: string;
  label: string;
  tone: CalendarColorRole;
  display?: 'background' | 'banner';   // 기본 background
};
// ⚑ 적층 가이드: anchor.values / status.values의 *정의 순서* = 바 적층 중요도(위→아래).
export type CalendarEncoding = {
  anchor: { attr: string; values: Record<string, { color: CalendarColorRole; icon?: IconName; label: string }> };
  status?: { attr: string; values: Record<string, { emphasis: 'solid' | 'dashed'; label: string }> };
  person?: { attr: string; values: Record<string, { initial: string; label: string; color?: CalendarColorRole }> };
  rowAxes?: { attr: string; label: string }[];
};
type Props = {
  title: string;
  description?: string;
  events: CalendarEvent[];
  encoding: CalendarEncoding;
  annotations?: CalendarAnnotation[];
  holidays?: CalendarHoliday[];
  createLabel?: string;
  onCreate?: () => void;
  onSelectEvent?: (e: CalendarEvent) => void;
  renderEventDetail?: (e: CalendarEvent) => ReactNode;
  rowMiniBar?: boolean;   // 행 헤더 분류-구성 미니막대 노출(기본 true)
  onTagRange?: (startISO: string, endISO: string) => void;    // 선택 구간 → 태그(소비처가 annotations에 추가)
  onCreateRange?: (startISO: string, endISO: string) => void; // 선택 구간 → 일정 생성
  viewToggle?: boolean;   // 1주/2주/월 토글 노출(기본 false = 월 고정). 타임라인 쓸 소비처가 켠다
};

type Range = 'week' | 'biweek' | 'month';
const NAME_COL = 150;
const monStart = (d: dayjs.Dayjs) => d.subtract((d.day() + 6) % 7, 'day');
const weekOfMonth = (mon: dayjs.Dayjs) => { const th = mon.add(3, 'day'); return { m: th.month() + 1, w: Math.floor((th.date() - 1) / 7) + 1 }; };
const cvar = (role: CalendarColorRole, s: number) => `var(--mantine-color-${role}-${s})`;
// 태그 배경 = 반투명 틴트(토큰 색 + 투명도만, color-mix — 헌법 8 유지). 빗금 아님.
const tint = (role: CalendarColorRole) => `color-mix(in srgb, ${cvar(role, 6)} 14%, transparent)`;
function barCss(role: CalendarColorRole, emphasis: 'solid' | 'dashed'): CSSProperties {
  return emphasis === 'dashed'
    ? { background: cvar(role, 0), border: `1.4px dashed ${cvar(role, 5)}`, color: cvar(role, 6), opacity: 0.7 }
    : { background: cvar(role, 2), borderLeft: `3px solid ${cvar(role, 6)}`, color: cvar(role, 7) };
}
function packLanes<T extends { a: number; b: number; ai: number; si: number }>(items: T[]) {
  const lanes: T[][] = []; const out: (T & { lane: number })[] = [];
  for (const it of [...items].sort((x, y) => (x.ai - y.ai) || (x.si - y.si) || (x.a - y.a))) {
    let i = 0; while (lanes[i] && lanes[i].some((r) => !(it.b < r.a || it.a > r.b))) i++;
    (lanes[i] = lanes[i] || []).push(it); out.push({ ...it, lane: i });
  }
  return { out, laneCount: lanes.length };
}

export function CalendarPage({ title, description, events, encoding, annotations = [], holidays, createLabel = '새 일정', onCreate, onSelectEvent, renderEventDetail, rowMiniBar = true, onTagRange, onCreateRange, viewToggle = false }: Props) {
  const [range, setRange] = useState<Range>('month');
  const rowAxisOpts = encoding.rowAxes ?? (encoding.person ? [{ attr: encoding.person.attr, label: '담당' }] : []);
  const [rowAxis, setRowAxis] = useState(rowAxisOpts[0]?.attr ?? encoding.anchor.attr);
  const [anchor, setAnchor] = useState(() => dayjs());
  const [daySel, setDaySel] = useState<string | null>(null);
  const [evSel, setEvSel] = useState<CalendarEvent | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [tagDropOpen, setTagDropOpen] = useState(false);
  const [tip, setTip] = useState<{ t: string; x: number; y: number } | null>(null);
  const today = dayjs();

  // ── 날짜 범위 선택(드래그) — 날짜 기준이라 월 주-경계 자동 통과. 단순 클릭=그날 Drawer ──
  const selecting = useRef(false); const selAnchor = useRef<string | null>(null); const moved = useRef(false);
  const [selRange, setSelRange] = useState<{ a: string; b: string } | null>(null);
  const selectable = !!(onTagRange || onCreateRange);
  const inSel = (d: dayjs.Dayjs) => !!selRange && !d.isBefore(dayjs(selRange.a), 'day') && !d.isAfter(dayjs(selRange.b), 'day');
  const startSel = (iso: string) => { if (!selectable) { setDaySel(iso); return; } selecting.current = true; selAnchor.current = iso; moved.current = false; setSelPos(null); setSelRange({ a: iso, b: iso }); };
  const extendSel = (iso: string) => { if (!selecting.current || !selAnchor.current) return; if (iso !== selAnchor.current) moved.current = true; const x = selAnchor.current; setSelRange(x <= iso ? { a: x, b: iso } : { a: iso, b: x }); };
  const [selPos, setSelPos] = useState<{ x: number; y: number } | null>(null);  // 액션 팝오버 = 드래그 종료 지점 앵커
  const clearSel = () => { selecting.current = false; setSelRange(null); setSelPos(null); };
  useEffect(() => {
    const up = (e: PointerEvent) => {
      if (!selecting.current) return; selecting.current = false;
      if (!moved.current) { const a = selAnchor.current; setSelRange(null); if (a) setDaySel(a); }
      else setSelPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('pointerup', up); return () => window.removeEventListener('pointerup', up);
  }, []);

  const holMap = new Map((holidays ?? []).map((h) => [h.date, h.name]));
  const anchorOrder = Object.keys(encoding.anchor.values);
  const statusOrder = encoding.status ? Object.keys(encoding.status.values) : [];
  const aiOf = (e: CalendarEvent) => { const v = e.attrs?.[encoding.anchor.attr]; const i = v ? anchorOrder.indexOf(v) : -1; return i < 0 ? 999 : i; };
  const siOf = (e: CalendarEvent) => { if (!encoding.status) return 0; const v = e.attrs?.[encoding.status.attr]; const i = v ? statusOrder.indexOf(v) : -1; return i < 0 ? 99 : i; };
  const evStart = (e: CalendarEvent) => dayjs(e.start);
  const evEnd = (e: CalendarEvent) => dayjs(e.end ?? e.start);
  const anStart = (an: CalendarAnnotation) => dayjs(an.start);
  const anEnd = (an: CalendarAnnotation) => dayjs(an.end ?? an.start);
  const toggle = (k: string) => setHidden((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const isHidden = (e: CalendarEvent) => {
    const av = e.attrs?.[encoding.anchor.attr]; if (av && hidden.has('a:' + av)) return true;
    if (encoding.status) { const sv = e.attrs?.[encoding.status.attr]; if (sv && hidden.has('s:' + sv)) return true; }
    return false;
  };
  const visible = events.filter((e) => !isHidden(e));
  const visAnnos = annotations.filter((an) => !hidden.has('t:' + an.id));
  const openEvent = (ev: CalendarEvent) => { setEvSel(ev); onSelectEvent?.(ev); };
  const tipText = (an: CalendarAnnotation) => `${an.label} · ${anStart(an).format('M/D')}–${anEnd(an).format('M/D')}`;

  // ── 이벤트 바 ──
  function bar(ev: CalendarEvent, a: number, b: number, lane: number, opts: { contL?: boolean; contR?: boolean; avatar?: boolean }) {
    const av = ev.attrs?.[encoding.anchor.attr]; const aspec = av ? encoding.anchor.values[av] : undefined;
    const role = aspec?.color ?? 'neutral';
    const sv = encoding.status ? ev.attrs?.[encoding.status.attr] : undefined;
    const emphasis = (sv ? encoding.status?.values[sv]?.emphasis : undefined) ?? 'solid';
    const pv = encoding.person ? ev.attrs?.[encoding.person.attr] : undefined; const pspec = pv ? encoding.person?.values[pv] : undefined;
    const cls = ['cal-bar', opts.contL ? 'cont-l' : '', opts.contR ? 'cont-r' : ''].filter(Boolean).join(' ');
    return (
      <div key={ev.id} className={cls}
        style={{ ...barCss(role, emphasis), gridColumn: `${a + 1} / span ${b - a + 1}`, gridRow: lane + 1 }}
        onClick={(e) => { e.stopPropagation(); openEvent(ev); }}>
        {aspec?.icon && <span className="gly"><Icon name={aspec.icon} size="sm" /></span>}
        <span className="ttl">{ev.label}</span>
        {opts.avatar && pspec && <span className="cal-ava" style={pspec.color ? { background: cvar(pspec.color, 6) } : undefined}>{pspec.initial}</span>}
      </div>
    );
  }

  function rowHeaderMain(val: string): ReactNode {
    if (rowAxis === encoding.person?.attr) { const p = encoding.person.values[val]; return <><span className="cal-ava lg" style={p?.color ? { background: cvar(p.color, 6) } : undefined}>{p?.initial ?? val.slice(0, 1)}</span>{p?.label ?? val}</>; }
    if (rowAxis === encoding.anchor.attr) { const a = encoding.anchor.values[val]; return <><span className="cal-sw" style={{ background: cvar(a?.color ?? 'neutral', 6) }} />{a?.icon && <Icon name={a.icon} size="sm" color="secondary" />}{a?.label ?? val}</>; }
    if (rowAxis === encoding.status?.attr) { const s = encoding.status.values[val]; return <>{s?.label ?? val}</>; }
    return <>{val}</>;
  }

  function rowBrief(rowEvents: CalendarEvent[]): ReactNode {
    const total = rowEvents.length;
    const showAnchor = rowAxis !== encoding.anchor.attr;
    const showStatus = encoding.status && rowAxis !== encoding.status.attr;
    const byAnchor: Record<string, number> = {};
    if (showAnchor) rowEvents.forEach((e) => { const v = e.attrs?.[encoding.anchor.attr]; if (v) byAnchor[v] = (byAnchor[v] || 0) + 1; });
    const statusText = showStatus
      ? Object.entries(encoding.status!.values).map(([v, s]) => `${s.label} ${rowEvents.filter((e) => e.attrs?.[encoding.status!.attr] === v).length}`).join(' · ')
      : '';
    return (
      <div className="cal-brief">
        {rowMiniBar && showAnchor && total > 0 && (
          <div className="cal-mini">
            {Object.entries(byAnchor).map(([v, c]) => <span key={v} style={{ width: `${(c / total) * 100}%`, background: cvar(encoding.anchor.values[v]?.color ?? 'neutral', 6) }} />)}
          </div>
        )}
        <span className="cal-brief-txt">{total}건{statusText && ` · ${statusText}`}</span>
      </div>
    );
  }

  // ── 타임라인 ──
  function timeline() {
    const days = range === 'biweek' ? 14 : 7;
    const winStart = monStart(anchor); const winEnd = winStart.add(days - 1, 'day');
    const cols = `repeat(${days}, minmax(0, 1fr))`; const colTpl = `${NAME_COL}px ${cols}`;
    const known = rowAxis === encoding.anchor.attr ? encoding.anchor.values
      : rowAxis === encoding.status?.attr ? encoding.status.values
      : rowAxis === encoding.person?.attr ? encoding.person.values : null;
    const vals = known ? Object.keys(known) : [...new Set(visible.map((e) => e.attrs?.[rowAxis]).filter(Boolean) as string[])];
    const inWin = (e: CalendarEvent) => !(evEnd(e).isBefore(winStart, 'day') || evStart(e).isAfter(winEnd, 'day'));
    const showAvatar = rowAxis !== encoding.person?.attr;
    const colLeft = (i: number) => `calc(${NAME_COL}px + ${i} * (100% - ${NAME_COL}px) / ${days})`;
    const colWidth = (n: number) => `calc(${n} * (100% - ${NAME_COL}px) / ${days})`;
    const colBody = (i: number) => `calc(${i} * 100% / ${days})`;
    const winAnnos = visAnnos.filter((an) => !(anEnd(an).isBefore(winStart, 'day') || anStart(an).isAfter(winEnd, 'day')));
    const bgAnnos = winAnnos.filter((an) => (an.display ?? 'background') === 'background');
    const bannerAnnos = winAnnos.filter((an) => an.display === 'banner');

    // 본문 hover → 커서 x로 날짜 계산해 배경 태그 툴팁(태그는 rows 뒤라 직접 hover 불가)
    const onMove = (e: React.MouseEvent) => {
      const el = e.target as HTMLElement; const track = el.closest('.cal-tl-track');
      if (!track || el.closest('.cal-bar')) { setTip(null); return; }
      const r = track.getBoundingClientRect(); const day = Math.floor((e.clientX - r.left) / (r.width / days));
      const d = winStart.add(day, 'day');
      const hit = bgAnnos.find((an) => !d.isBefore(anStart(an), 'day') && !d.isAfter(anEnd(an), 'day'));
      setTip(hit ? { t: tipText(hit), x: e.clientX, y: e.clientY } : null);
    };

    return (
      <div className="cal-tl">
        <div className="cal-tl-head" style={{ gridTemplateColumns: colTpl }}>
          <div className="cal-tl-corner" />
          {Array.from({ length: days }, (_, i) => {
            const d = winStart.add(i, 'day'); const wd = d.day(); const hol = holMap.get(d.format('YYYY-MM-DD')); const isToday = d.isSame(today, 'day');
            const cls = ['cal-tl-dh', wd === 6 ? 'sat' : '', wd === 0 ? 'sun' : '', hol ? 'hol' : '', isToday ? 'today' : '', inSel(d) ? 'selhi' : ''].filter(Boolean).join(' ');
            const iso = d.format('YYYY-MM-DD');
            return <div key={i} className={cls} onPointerDown={() => startSel(iso)} onPointerEnter={() => extendSel(iso)}><span className="cal-dh-top">{isToday ? <span className="cal-todaypill">{d.date()} 오늘</span> : <span className="cal-dnum">{d.date()}</span>}{hol && <span className="cal-hol-in">·{hol}</span>}</span><small>{'일월화수목금토'[wd]}</small></div>;
          })}
        </div>
        {bannerAnnos.length > 0 && (
          <div className="cal-tl-lane" style={{ gridTemplateColumns: colTpl }}>
            <div className="cal-tl-lname">🏷</div>
            <div className="cal-tl-lbody">
              {bannerAnnos.map((an) => { const a = Math.max(0, anStart(an).diff(winStart, 'day')), b = Math.min(days - 1, anEnd(an).diff(winStart, 'day'));
                return <div key={an.id} className="cal-banner" style={{ left: colBody(a), width: `calc(${b - a + 1} * 100% / ${days})`, background: cvar(an.tone, 6) }}>🏷 <span className="ttl">{an.label}</span></div>; })}
            </div>
          </div>
        )}
        <div className="cal-tl-body" onMouseMove={onMove} onMouseLeave={() => setTip(null)}>
          <div className="cal-tl-shade">
            {bgAnnos.map((an) => { const a = Math.max(0, anStart(an).diff(winStart, 'day')), b = Math.min(days - 1, anEnd(an).diff(winStart, 'day'));
              return <div key={an.id} className="cal-region" style={{ left: colLeft(a), width: colWidth(b - a + 1), background: tint(an.tone), borderColor: cvar(an.tone, 4) }} />; })}
          </div>
          {vals.map((val) => {
            const rowEvents = visible.filter((e) => e.attrs?.[rowAxis] === val && inWin(e));
            const items = rowEvents.map((e) => ({ a: Math.max(0, evStart(e).diff(winStart, 'day')), b: Math.min(days - 1, evEnd(e).diff(winStart, 'day')), e, ai: aiOf(e), si: siOf(e), contL: evStart(e).isBefore(winStart, 'day'), contR: evEnd(e).isAfter(winEnd, 'day') }));
            const { out, laneCount } = packLanes(items);
            return (
              <div key={val} className="cal-tl-row" style={{ gridTemplateColumns: colTpl }}>
                <div className="cal-tl-name">
                  <div className="cal-name-main">{rowHeaderMain(val)}</div>
                  {rowBrief(rowEvents)}
                </div>
                <div className="cal-tl-track" style={{ gridTemplateColumns: cols, backgroundSize: `${100 / days}% 100%`, minHeight: Math.max(1, laneCount) * 27 + 8 }}>
                  {out.map((it) => bar(it.e, it.a, it.b, it.lane, { contL: it.contL, contR: it.contR, avatar: showAvatar }))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 월 그리드 ──
  function month() {
    const mStart = anchor.startOf('month'); const gridStart = monStart(mStart);
    const weeks = monStart(mStart.endOf('month')).diff(gridStart, 'week') + 1;  // 그 달이 걸치는 주만(5~6) — 다음달 전용 주 X
    const weekdays = [['월'], ['화'], ['수'], ['목'], ['금'], ['토', 'sat'], ['일', 'sun']] as [string, string?][];
    const onMove = (e: React.MouseEvent) => { const el = (e.target as HTMLElement).closest('[data-tip]') as HTMLElement | null; setTip(el?.dataset.tip ? { t: el.dataset.tip, x: e.clientX, y: e.clientY } : null); };
    return (
      <div onMouseMove={onMove} onMouseLeave={() => setTip(null)}>
        <div className="cal-mh">{weekdays.map(([w, c]) => <div key={w} className={c}>{w}</div>)}</div>
        {Array.from({ length: weeks }, (_, w) => {
          const ws = gridStart.add(w * 7, 'day'); const we = ws.add(6, 'day');
          const segs = visible.filter((e) => !(evEnd(e).isBefore(ws, 'day') || evStart(e).isAfter(we, 'day')))
            .map((e) => ({ a: Math.max(0, evStart(e).diff(ws, 'day')), b: Math.min(6, evEnd(e).diff(ws, 'day')), e, ai: aiOf(e), si: siOf(e), isStart: !evStart(e).isBefore(ws, 'day'), isEnd: !evEnd(e).isAfter(we, 'day') }));
          // 배너 태그 = 주 상단 라벨 바(이벤트 위 레인)
          const banners = visAnnos.filter((an) => an.display === 'banner' && !(anEnd(an).isBefore(ws, 'day') || anStart(an).isAfter(we, 'day')));
          const { out, laneCount } = packLanes(segs);
          const cellH = Math.max(96, 34 + (banners.length ? 20 : 0) + laneCount * 25);  // 34=숫자/today배지 행 확보(바 미침범)
          return (
            <div key={w} className="cal-wk">
              <div className="cal-days">
                {Array.from({ length: 7 }, (_, c) => {
                  const d = ws.add(c, 'day'); const wd = d.day(); const hol = holMap.get(d.format('YYYY-MM-DD'));
                  // 배경 태그 = 셀 빗금 + 범위 윤곽 브래킷(시작/끝 변에 테두리)
                  const bg = visAnnos.find((an) => (an.display ?? 'background') === 'background' && !d.isBefore(anStart(an), 'day') && !d.isAfter(anEnd(an), 'day'));
                  const cls = ['cal-cell', d.month() !== mStart.month() ? 'other' : '', wd === 6 ? 'sat' : '', wd === 0 ? 'sun' : '', hol ? 'hol' : '', d.isSame(today, 'day') ? 'today' : '', inSel(d) ? 'selhi' : ''].filter(Boolean).join(' ');
                  const iso = d.format('YYYY-MM-DD');
                  const bgStyle: CSSProperties = { minHeight: cellH };
                  if (bg) { bgStyle.background = tint(bg.tone); const bc = cvar(bg.tone, 4);
                    bgStyle.borderTop = `var(--border-width) solid ${bc}`; bgStyle.borderBottom = `var(--border-width) solid ${bc}`;
                    if (d.isSame(anStart(bg), 'day') || c === 0) bgStyle.borderLeft = `var(--border-width) solid ${bc}`;
                    if (d.isSame(anEnd(bg), 'day') || c === 6) bgStyle.borderRight = `var(--border-width) solid ${bc}`; }
                  if (inSel(d) && selRange) { const pc = cvar('primary', 5);  // 선택 = 점선 브래킷(태그 미리보기 느낌, 텍스트 선택과 구분)
                    bgStyle.borderTop = `var(--border-width) dashed ${pc}`; bgStyle.borderBottom = `var(--border-width) dashed ${pc}`;
                    if (d.isSame(dayjs(selRange.a), 'day') || c === 0) bgStyle.borderLeft = `var(--border-width) dashed ${pc}`;
                    if (d.isSame(dayjs(selRange.b), 'day') || c === 6) bgStyle.borderRight = `var(--border-width) dashed ${pc}`; }
                  const isToday = d.isSame(today, 'day');
                  return <div key={c} className={cls} style={bgStyle} data-tip={bg ? tipText(bg) : undefined} onPointerDown={() => startSel(iso)} onPointerEnter={() => extendSel(iso)}><span className="cal-numrow">{isToday ? <span className="cal-todaypill">{d.date()} 오늘</span> : <span className="cal-num">{d.date()}</span>}{hol && <span className="cal-hol-in">·{hol}</span>}</span></div>;
                })}
              </div>
              <div className="cal-mbars" style={{ top: banners.length ? 52 : 32 }}>
                {out.map((it) => bar(it.e, it.a, it.b, it.lane, { contL: !it.isStart, contR: !it.isEnd, avatar: true }))}
              </div>
              {banners.length > 0 && (
                <div className="cal-mbanners">
                  {banners.map((an) => { const a = Math.max(0, anStart(an).diff(ws, 'day')), b = Math.min(6, anEnd(an).diff(ws, 'day'));
                    return <div key={an.id} className="cal-banner" style={{ gridColumn: `${a + 1} / span ${b - a + 1}`, background: cvar(an.tone, 6) }}>🏷 <span className="ttl">{an.label}</span></div>; })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── 네비게이션 + "오늘" 관계 ──
  const step = (dir: number) => setAnchor(range === 'month' ? anchor.add(dir, 'month') : anchor.add(dir * (range === 'biweek' ? 14 : 7), 'day'));
  let onToday: boolean; let todayDir: 'left' | 'right' | null = null;
  if (range === 'month') { onToday = anchor.isSame(today, 'month'); if (!onToday) todayDir = today.isBefore(anchor, 'month') ? 'left' : 'right'; }
  else { const s = monStart(anchor); const e = s.add((range === 'biweek' ? 14 : 7) - 1, 'day'); onToday = !today.isBefore(s, 'day') && !today.isAfter(e, 'day'); if (!onToday) todayDir = today.isBefore(s, 'day') ? 'left' : 'right'; }

  const rangeLabel = (() => {
    if (range === 'month') return anchor.format('YYYY년 M월');
    const s = monStart(anchor); const days = range === 'biweek' ? 14 : 7; const e = s.add(days - 1, 'day');
    const dateRange = `${s.format('M/D')}–${e.format('M/D')}`;
    if (range === 'week') { const { m, w } = weekOfMonth(s); return `${m}월 ${w}주차 (${dateRange})`; }
    const w1 = weekOfMonth(s); const w2 = weekOfMonth(s.add(7, 'day'));
    const tag = w1.m === w2.m ? `${w1.m}월 ${w1.w}·${w2.w}주차` : `${w1.m}월 ${w1.w}주차·${w2.m}월 ${w2.w}주차`;
    return `${tag} (${dateRange})`;
  })();

  const dayEvents = daySel ? events.filter((e) => !(evEnd(e).isBefore(dayjs(daySel), 'day') || evStart(e).isAfter(dayjs(daySel), 'day'))) : [];

  function dayRow(ev: CalendarEvent) {
    const av = ev.attrs?.[encoding.anchor.attr]; const a = av ? encoding.anchor.values[av] : undefined;
    const sv = encoding.status ? ev.attrs?.[encoding.status.attr] : undefined; const s = sv ? encoding.status?.values[sv] : undefined;
    const pv = encoding.person ? ev.attrs?.[encoding.person.attr] : undefined; const p = pv ? encoding.person?.values[pv] : undefined;
    return (
      <div key={ev.id} onClick={() => openEvent(ev)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--mantine-spacing-xs)', padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)', border: 'var(--border-width) solid var(--border-default)', borderRadius: 'var(--mantine-radius-sm)', cursor: 'pointer' }}>
        <span className="cal-sw" style={{ background: cvar(a?.color ?? 'neutral', 6) }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text variant="body">{ev.label}</Text>
          <Text variant="caption" color="secondary">{[a?.label, s?.label, p?.label].filter(Boolean).join(' · ')}</Text>
        </div>
        {p && <span className="cal-ava" style={p.color ? { background: cvar(p.color, 6) } : undefined}>{p.initial}</span>}
      </div>
    );
  }

  function eventDetailDefault(ev: CalendarEvent): ReactNode {
    const av = ev.attrs?.[encoding.anchor.attr]; const a = av ? encoding.anchor.values[av] : undefined;
    const sv = encoding.status ? ev.attrs?.[encoding.status.attr] : undefined; const s = sv ? encoding.status?.values[sv] : undefined;
    const pv = encoding.person ? ev.attrs?.[encoding.person.attr] : undefined; const p = pv ? encoding.person?.values[pv] : undefined;
    const row = (k: string, v: ReactNode) => <Group gap="md" align="start"><div style={{ width: 64, flex: 'none' }}><Text variant="caption" color="secondary">{k}</Text></div><div>{v}</div></Group>;
    const period = ev.end && ev.end !== ev.start ? `${dayjs(ev.start).format('M월 D일')} – ${dayjs(ev.end).format('M월 D일')}` : dayjs(ev.start).format('M월 D일');
    return (
      <Stack gap="sm">
        {row('현장', <Text variant="body">{ev.label}</Text>)}
        {a && row('분류', <Group gap="xs" align="center">{a.icon && <Icon name={a.icon} size="sm" color="secondary" />}<Text variant="body">{a.label}</Text></Group>)}
        {s && row('상태', <Text variant="body">{s.label}</Text>)}
        {p && row('담당', <Group gap="xs" align="center"><span className="cal-ava" style={p.color ? { background: cvar(p.color, 6) } : undefined}>{p.initial}</span><Text variant="body">{p.label}</Text></Group>)}
        {row('기간', <Text variant="body">{period}</Text>)}
      </Stack>
    );
  }

  const rangeOptions = [{ label: '1주', value: 'week' }, { label: '2주', value: 'biweek' }, { label: '월', value: 'month' }];

  return (
    <Page>
      <div className="cal">
      <PageHeader title={title} meta={description ? [{ kind: 'text', label: description }] : undefined}
        actions={onCreate ? [{ label: createLabel, variant: 'primary', icon: 'plus', onClick: onCreate }] : undefined} />
      <div className="cal-card">
        <div className="cal-toolbar">
          {viewToggle && <SegmentedControl options={rangeOptions} value={range} onChange={(v) => setRange(v as Range)} size="sm" />}
          <span className="cal-nav">
            <IconButton icon="chevron-left" label="이전" variant="ghost" size="sm" onClick={() => step(-1)} />
            <span className="cal-rlabel">{rangeLabel}</span>
            <IconButton icon="chevron-right" label="다음" variant="ghost" size="sm" onClick={() => step(1)} />
          </span>
          <Button variant={onToday ? 'ghost' : 'secondary'} size="sm" disabled={onToday}
            leftIcon={todayDir === 'left' ? <Icon name="chevron-left" size="sm" /> : undefined}
            rightIcon={todayDir === 'right' ? <Icon name="chevron-right" size="sm" /> : undefined}
            onClick={() => setAnchor(today)}>오늘</Button>
          <span className="cal-spacer" />
          {range !== 'month' && rowAxisOpts.length > 1 && (
            <Group gap="xs" align="center">
              <Text variant="caption" color="secondary">행 기준</Text>
              <SegmentedControl options={rowAxisOpts.map((o) => ({ label: o.label, value: o.attr }))} value={rowAxis} onChange={setRowAxis} size="sm" />
            </Group>
          )}
        </div>

        <div className="cal-legend">
          <span className="lab">분류</span>
          <span className="set">
            {Object.entries(encoding.anchor.values).map(([val, a]) => (
              <button key={val} className={`cal-chip ${hidden.has('a:' + val) ? 'off' : ''}`} onClick={() => toggle('a:' + val)}>
                <span className="cal-sw" style={{ background: cvar(a.color, 6) }} />{a.icon && <Icon name={a.icon} size="sm" color="secondary" />}{a.label}
              </button>
            ))}
          </span>
          {encoding.status && (<>
            <span className="sep" />
            <span className="lab">상태</span>
            <span className="set">
              {Object.entries(encoding.status.values).map(([val, s]) => (
                <button key={val} className={`cal-chip ${hidden.has('s:' + val) ? 'off' : ''}`} onClick={() => toggle('s:' + val)}>
                  <span style={{ ...barCss('neutral', s.emphasis), width: '1.5em', height: '0.9em', borderRadius: 'var(--mantine-radius-xs)', flex: 'none' }} />{s.label}
                </button>
              ))}
            </span>
          </>)}
          {annotations.length > 0 && (<>
            <span className="sep" />
            <span className="cal-tagsec">
              <button className="cal-chip" onClick={() => setTagDropOpen((o) => !o)} aria-expanded={tagDropOpen}>🏷 태그 {annotations.length} ▾</button>
              {tagDropOpen && (
                <div className="cal-tagdrop">
                  <Text variant="caption" color="secondary">태그 — 색→의미 · 클릭=필터</Text>
                  {annotations.map((an) => (
                    <button key={an.id} className={`cal-chip ${hidden.has('t:' + an.id) ? 'off' : ''}`} onClick={() => toggle('t:' + an.id)}>
                      <span className="cal-sw" style={{ background: tint(an.tone), border: `1px solid ${cvar(an.tone, 4)}` }} />{an.label}
                    </button>
                  ))}
                </div>
              )}
            </span>
          </>)}
        </div>

        {range === 'month' ? month() : timeline()}
      </div>

      {tip && <div className="cal-tip" style={{ left: Math.min(tip.x + 12, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 220), top: tip.y + 14 }}>{tip.t}</div>}

      {selRange && selPos && !selecting.current && selectable && (
        <div className="cal-selbar" style={{ left: selPos.x, top: selPos.y }}>
          <span className="c">{dayjs(selRange.b).diff(dayjs(selRange.a), 'day') + 1}일 선택</span>
          {onTagRange && <button onClick={() => { onTagRange(selRange.a, selRange.b); clearSel(); }}>🏷 태그</button>}
          {onCreateRange && <button onClick={() => { onCreateRange(selRange.a, selRange.b); clearSel(); }}>＋ 일정</button>}
          <button onClick={clearSel}>해제</button>
        </div>
      )}

      <Drawer opened={daySel != null} onClose={() => setDaySel(null)}
        title={daySel ? `${dayjs(daySel).format('M월 D일')} (${'일월화수목금토'[dayjs(daySel).day()]})${holMap.get(daySel) ? ' · ' + holMap.get(daySel) : ''}` : ''}
        actions={onCreate ? [{ label: createLabel, variant: 'primary', icon: 'plus', onClick: onCreate }] : undefined}>
        {dayEvents.length === 0
          ? <EmptyState icon="calendar" title="이 날의 일정이 없습니다" />
          : <Stack gap="xs"><Text variant="caption" color="secondary">{dayEvents.length}건</Text>{dayEvents.map(dayRow)}</Stack>}
      </Drawer>

      <Drawer opened={evSel != null} onClose={() => setEvSel(null)} title="상세"
        actions={[{ label: '편집', variant: 'primary', icon: 'edit', onClick: () => {} }, { label: '삭제', variant: 'danger', icon: 'trash', onClick: () => {} }]}>
        {evSel && (renderEventDetail ? renderEventDetail(evSel) : eventDetailDefault(evSel))}
      </Drawer>
      </div>
    </Page>
  );
}
