'use client';
// MobileShell 데모 화면 — /shell/mobile 프리뷰의 iframe 안에 뜨는 실물.
//  · 이 파일은 *소비처* 역할이다(패키지 아님). 셸이 내주는 슬롯에 화면을 조립해본다.
//  · 1차 추출 완료: 여기 인라인으로 짰던 "행"과 "묶음"이 MobileListRow·MobileSection으로 올라갔다.
//    남은 인라인(본문 문단 등)은 아직 세 번 반복되지 않아 부품으로 올리지 않는다(rule of three).
import { useState } from 'react';
import {
  MobileShell, MobileTop, MobileSection, MobileListRow, MobileStatRow,
  MobileDisclosure, MobilePhotoPicker, MobileCalendar,
  FormField, TextInput, Select, Text, Title, Badge,
  type MobileTab, type FileItem,
  type CalendarEvent, type CalendarEncoding, type CalendarAnnotation,
} from '@/ui';

const TABS: MobileTab[] = [
  { path: '/board', label: '게시판', icon: 'clipboard', count: 3 },
  { path: '/orders', label: '발주', icon: 'upload' },
  { path: '/sites', label: '현장', icon: 'building' },
  { path: '/my', label: '내정보', icon: 'user' },
];

const POSTS = [
  { id: 'p1', cat: '공지', title: '2026년 하계 휴가 신청 및 근태 처리 안내', who: '김서연 · 인사팀', when: '06.24', must: true },
  { id: 'p2', cat: '업무', title: '사내 보안 정책 개정 — VPN 2차 인증 의무화', who: '박상우 · 정보보안', when: '06.20', must: false },
  { id: 'p3', cat: '업무', title: '2026년 거래처 단가표 v3 배포', who: '정민호 · 구매', when: '06.25', must: false },
  { id: 'p4', cat: '공지', title: '3분기 전사 워크샵 일정 공유', who: '김서연 · 인사팀', when: '06.18', must: false },
];

// 달력 데이터 — 데스크탑 CalendarPage와 *같은 타입*이다(소비처가 한 벌만 들고 두 화면에 넘긴다).
const SITE_ENCODING: CalendarEncoding = {
  anchor: { attr: 'kind', values: {
    install:  { color: 'primary', label: '시공' },
    measure:  { color: 'info',    label: '실측' },
    delivery: { color: 'success', label: '납품' },
    issue:    { color: 'danger',  label: '이슈' },
  } },
};
const SITE_EVENTS: CalendarEvent[] = [
  { id: 'e1', start: '2026-07-06', end: '2026-07-10', label: '대명물산 시공', attrs: { kind: 'install' } },
  { id: 'e2', start: '2026-07-09', end: '2026-07-09', label: '한빛산업 실측', attrs: { kind: 'measure' } },
  { id: 'e3', start: '2026-07-13', end: '2026-07-24', label: '세종테크 시공', attrs: { kind: 'install' } },
  { id: 'e4', start: '2026-07-16', end: '2026-07-17', label: '자재 납품', attrs: { kind: 'delivery' } },
  { id: 'e5', start: '2026-07-22', end: '2026-07-23', label: '누수 이슈', attrs: { kind: 'issue' } },
  { id: 'e6', start: '2026-07-27', end: '2026-07-31', label: '대명물산 2차', attrs: { kind: 'install' } },
  { id: 'e7', start: '2026-07-27', end: '2026-07-28', label: '실측 재방문', attrs: { kind: 'measure' } },
  { id: 'e8', start: '2026-07-27', end: '2026-07-29', label: '추가 납품', attrs: { kind: 'delivery' } },
  { id: 'e9', start: '2026-07-27', end: '2026-07-27', label: '하자 점검', attrs: { kind: 'issue' } },
];
const SITE_ANNOS: CalendarAnnotation[] = [
  { id: 't1', start: '2026-07-13', end: '2026-07-17', label: '하계 단축근무', tone: 'warning', display: 'banner' },
  { id: 't2', start: '2026-07-29', end: '2026-07-31', label: '본사 워크샵', tone: 'neutral', display: 'background' },
];

// 날짜 라벨 — 포맷은 *소비처*의 일이다(부품은 날짜 계산·표기를 모른다).
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 일정`;
};

export default function MobileShellDemo() {
  const [tab, setTab] = useState('/board');
  const [open, setOpen] = useState<string | null>(null);
  const [site, setSite] = useState('');
  const [kind, setKind] = useState<string | null>(null);
  const [photos, setPhotos] = useState<FileItem[]>([]);
  const [month, setMonth] = useState('2026-07');
  const [day, setDay] = useState('2026-07-27');
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const post = POSTS.find((p) => p.id === open);

  // '현장' 탭 — 달력이 화면 전체를 갖는다(3뎁스: 달력 → 그날 일정 목록 → 일정 상세).
  //  달력 화면엔 MobileTop을 두지 않는다 — 큰 월 제목을 달력이 직접 갖고 있어 제목이 둘이 되기 때문.
  if (tab === '/sites') {
    // 3뎁스: 일정 상세
    if (openEvent) {
      const ev = SITE_EVENTS.find((e) => e.id === openEvent)!;
      return (
        <MobileShell title={SITE_ENCODING.anchor.values[ev.attrs!.kind].label}
          onBack={() => setOpenEvent(null)}
          tabs={TABS} activePath={tab} onNavigate={(p) => { setOpenEvent(null); setTab(p); }}>
          <MobileSection>
            <Title variant="subheading">{ev.label}</Title>
            <div style={{ marginTop: 8 }}>
              <Text variant="caption" color="secondary">{ev.start} ~ {ev.end ?? ev.start}</Text>
            </div>
          </MobileSection>
          <MobileSection flush>
            <MobileDisclosure title="시공 상세" meta="4개 항목" defaultOpen>
              <Text variant="body">주방 상부장 · 하부장 · 아일랜드 · 팬트리</Text>
            </MobileDisclosure>
            <MobileDisclosure title="변경 이력" meta="2건">
              <Text variant="body">07.20 자재 변경 · 07.25 일정 조정</Text>
            </MobileDisclosure>
          </MobileSection>
          <MobileSection title="현장 사진">
            <MobilePhotoPicker value={photos} onChange={setPhotos} max={6} />
          </MobileSection>
        </MobileShell>
      );
    }

    // 2뎁스: 그날 일정 목록
    if (dayOpen) {
      const list = SITE_EVENTS.filter((e) => dayOpen >= e.start && dayOpen <= (e.end ?? e.start));
      return (
        <MobileShell title={dayLabel(dayOpen)}
          onBack={() => setDayOpen(null)}
          tabs={TABS} activePath={tab} onNavigate={(p) => { setDayOpen(null); setTab(p); }}>
          <MobileSection flush>
            {list.map((e) => (
              <MobileListRow key={e.id} title={e.label}
                meta={`${e.start} ~ ${e.end ?? e.start}`}
                badges={<Badge color="neutral">{SITE_ENCODING.anchor.values[e.attrs!.kind].label}</Badge>}
                onClick={() => setOpenEvent(e.id)} />
            ))}
          </MobileSection>
        </MobileShell>
      );
    }

    // 1뎁스: 달력이 본문의 유일한 자식 → height:100%가 성립한다.
    return (
      <MobileShell tabs={TABS} activePath={tab} onNavigate={setTab}>
        <MobileCalendar
          fill
          month={month} onMonthChange={setMonth}
          selected={day}
          onSelect={(d) => { setDay(d); setDayOpen(d); }}
          onSelectEvent={(e) => setOpenEvent(e.id)}
          events={SITE_EVENTS}
          encoding={SITE_ENCODING}
          annotations={SITE_ANNOS}
        />
      </MobileShell>
    );
  }

  // '발주' 탭 — KPI 행 + 입력. 입력은 모바일 전용 부품 없이 기존 FormField·TextInput을 그대로 쓴다
  //  (타이포는 셸 스코프가, 44pt 높이는 mobileshell.css가 이미 처리 — 새 부품이 필요 없음을 이 화면이 증명).
  if (tab === '/orders') {
    return (
      <MobileShell tabs={TABS} activePath={tab} onNavigate={setTab}
        cta={{ label: '발주 요청', onClick: () => {} }}>
        <MobileTop title="발주" />
        <MobileSection flush>
          <MobileStatRow items={[
            { label: '진행 중', value: '12건', onClick: () => {} },
            { label: '승인 대기', value: '3건', sub: '2건 지연', tone: 'danger', onClick: () => {} },
            { label: '이번 달', value: '48건', sub: '+12%', tone: 'success' },
          ]} />
        </MobileSection>

        <MobileSection title="새 발주">
          <FormField label="현장" withAsterisk>
            <TextInput value={site} onChange={setSite} placeholder="현장을 입력하세요" />
          </FormField>
          <div style={{ height: 'var(--mantine-spacing-md)' }} />
          <FormField label="품목 분류">
            <Select
              options={[{ value: 'a', label: '자재' }, { value: 'b', label: '장비' }]}
              value={kind} onChange={setKind} placeholder="분류 선택"
            />
          </FormField>
        </MobileSection>
      </MobileShell>
    );
  }

  // 2뎁스(상세) — Navigation이 뒤로+제목을 갖는다. 최상위는 제목 없이 본문 Top이 갖는다.
  if (post) {
    return (
      <MobileShell
        title={post.cat}
        onBack={() => setOpen(null)}
        actions={[{ label: '더보기', icon: 'dots-vertical', iconOnly: true, onClick: () => {} }]}
        tabs={TABS} activePath={tab} onNavigate={(p) => { setOpen(null); setTab(p); }}
      >
        <MobileSection>
          <Title variant="subheading">{post.title}</Title>
          <div style={{ marginTop: 8 }}>
            <Text variant="caption" color="secondary">{post.who} · {post.when}</Text>
          </div>
        </MobileSection>

        {/* 자유 슬롯 — 본문. 텍스트든 배지든 소비처가 조립한다. */}
        <MobileSection>
          <Text variant="body">
            안녕하세요, 인사팀입니다. 아래 내용을 안내드립니다. 신청 기간은 7월 1일부터 7월 15일 18시까지이며,
            전자결재 &gt; 휴가신청서로 제출해 주세요. 기한 내 미신청 시 부서별 기본 일정으로 자동 배정됩니다.
          </Text>
        </MobileSection>

        {/* 라벨-값 나열도 지금은 자유 슬롯으로 — 세 번째 반복이 나오면 그때 행 부품으로 추출한다. */}
        <MobileSection title="문의">
          <Text variant="body">인사팀 · 내선 1234</Text>
        </MobileSection>
      </MobileShell>
    );
  }

  return (
    <MobileShell tabs={TABS} activePath={tab} onNavigate={setTab}>
      <MobileTop title="게시판" />

      <MobileSection flush>
        {POSTS.map((p) => (
          <MobileListRow
            key={p.id}
            title={p.title}
            meta={`${p.who} · ${p.when}`}
            badges={
              <>
                <Badge color={p.cat === '공지' ? 'info' : 'neutral'}>{p.cat}</Badge>
                {p.must && <Badge color="danger">필독</Badge>}
              </>
            }
            onClick={() => setOpen(p.id)}
          />
        ))}
      </MobileSection>
    </MobileShell>
  );
}
