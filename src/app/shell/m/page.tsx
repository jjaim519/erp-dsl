'use client';
// MobileShell 데모 화면 — /shell/mobile 프리뷰의 iframe 안에 뜨는 실물.
//  · 이 파일은 *소비처* 역할이다(패키지 아님). 셸이 내주는 슬롯에 화면을 조립해본다.
//  · 1차 추출 완료: 여기 인라인으로 짰던 "행"과 "묶음"이 MobileListRow·MobileSection으로 올라갔다.
//    남은 인라인(본문 문단 등)은 아직 세 번 반복되지 않아 부품으로 올리지 않는다(rule of three).
import { useState } from 'react';
import {
  MobileShell, MobileTop, MobileSection, MobileListRow, MobileStatRow,
  MobileDisclosure, MobilePhotoPicker, MobileCalendar, MobileComposer,
  MobileBoardList, MobileBoardView, MobileBoardWrite,
  MobileField, MobileChoice, TextInput, Button, Text, Title, Badge, RichText,
  type MobileTab, type FileItem, type BoardComment, type BoardPost, type AudienceNode,
  type CalendarEvent, type CalendarEncoding, type CalendarAnnotation,
} from '@/ui';

const TABS: MobileTab[] = [
  { path: '/board', label: '게시판', icon: 'clipboard', count: 3 },
  { path: '/orders', label: '발주', icon: 'upload' },
  { path: '/sites', label: '현장', icon: 'building' },
  { path: '/my', label: '내정보', icon: 'user' },
];

const COMMENTS: BoardComment[] = [
  { id: 'c1', author: { name: '박상우', dept: '구매' }, date: '06.24 15:02', body: '반차도 이 기간에 같이 신청해야 하나요?' },
  { id: 'c2', author: { name: '김서연', dept: '인사' }, date: '06.24 15:20', isAuthor: true, parentId: 'c1',
    body: '반차는 본 휴가와 무관하게 평소처럼 수시 신청 가능합니다.' },
  { id: 'c3', author: { name: '정민호', dept: '물류' }, date: '06.24 16:40', body: '확인했습니다. 창고 인원 조율해서 제출하겠습니다.' },
];

const POST_HTML = `<h2>1. 신청 기간</h2><p>신청 기간은 <strong>7월 1일 ~ 7월 15일 18:00</strong>까지입니다. 전자결재 &gt; 휴가신청서로 제출해 주세요.</p><ul><li>승인: 팀장 1차 → 인사팀 최종</li><li>반차·반반차는 휴가신청서에서 선택</li></ul>`;

// 게시판 데이터 — 데스크탑 BoardList와 *같은 타입*(BoardPost). 소비처는 한 벌만 들고 두 화면에 넘긴다.
const POSTS: BoardPost[] = [
  { id: 'p1', category: '공지', title: '2026년 하계 휴가 신청 및 근태 처리 안내', author: { name: '김서연', dept: '인사팀' },
    date: '06.24', pinned: true, mustRead: true, comments: 3, attachments: 2, views: 214 },
  { id: 'p2', category: '업무', title: '사내 보안 정책 개정 — VPN 2차 인증 의무화', author: { name: '박상우', dept: '정보보안' },
    date: '06.20', unread: true, comments: 1, views: 88 },
  { id: 'p3', category: '업무', title: '2026년 거래처 단가표 v3 배포', author: { name: '정민호', dept: '구매' },
    date: '06.25', unread: true, isNew: true, attachments: 1, views: 41 },
  { id: 'p4', category: '공지', title: '3분기 전사 워크샵 일정 공유', author: { name: '김서연', dept: '인사팀' },
    date: '06.18', views: 176 },
];
const CATS = [
  { value: 'all', label: '전체' }, { value: 'notice', label: '공지' },
  { value: 'work', label: '업무' }, { value: 'hr', label: '인사' }, { value: 'safety', label: '안전' },
];
const AUDIENCES: AudienceNode[] = [
  { id: 'all', label: '전사', exclusive: true },
  { id: 'hq', label: '본사', children: [
    { id: 'hr', label: '인사팀', members: [{ id: 'u1', name: '김서연', dept: '인사팀' }] },
    { id: 'pur', label: '구매팀', members: [{ id: 'u2', name: '정민호', dept: '구매팀' }] },
  ] },
  { id: 'site', label: '현장', members: [{ id: 'u3', name: '옥성훈', dept: '시공' }] },
];

// 달력 데이터 — 데스크탑 CalendarPage와 *같은 타입*이다(소비처가 한 벌만 들고 두 화면에 넘긴다).
const SITE_ENCODING: CalendarEncoding = {
  anchor: { attr: 'kind', values: {
    install:  { color: 'primary', label: '시공' },
    measure:  { color: 'info',    label: '실측' },
    delivery: { color: 'success', label: '납품' },
    issue:    { color: 'danger',  label: '이슈' },
  } },
  // 두 번째 범주 축 — 부품은 이게 무엇인지 모른다(여기선 담당이지만 시공 종류·자재여도 코드는 동일).
  mark: { attr: 'owner', label: '담당', values: {
    ok:  { glyph: '옥', label: '옥성훈', color: 'primary' },
    kim: { glyph: '김', label: '김민지', color: 'success' },
  } },
};
const SITE_EVENTS: CalendarEvent[] = [
  { id: 'e1', start: '2026-07-06', end: '2026-07-10', label: '대명물산 시공', attrs: { kind: 'install', owner: 'ok' } },
  { id: 'e2', start: '2026-07-09', end: '2026-07-09', label: '한빛산업 실측', attrs: { kind: 'measure', owner: 'kim' } },
  { id: 'e3', start: '2026-07-13', end: '2026-07-24', label: '세종테크 시공', attrs: { kind: 'install', owner: 'kim' } },
  { id: 'e4', start: '2026-07-16', end: '2026-07-17', label: '자재 납품', attrs: { kind: 'delivery', owner: 'ok' } },
  { id: 'e5', start: '2026-07-22', end: '2026-07-23', label: '누수 이슈', attrs: { kind: 'issue' } },
  { id: 'e6', start: '2026-07-27', end: '2026-07-31', label: '대명물산 2차', attrs: { kind: 'install', owner: 'ok' } },
  { id: 'e7', start: '2026-07-27', end: '2026-07-28', label: '실측 재방문', attrs: { kind: 'measure', owner: 'kim' } },
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
  const [cmts, setCmts] = useState<BoardComment[]>(COMMENTS);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [wTitle, setWTitle] = useState('');
  const [wCat, setWCat] = useState<string | null>('notice');
  const [wBody, setWBody] = useState('');
  const [wNotice, setWNotice] = useState(false);
  const [wMust, setWMust] = useState(false);
  const [wComments, setWComments] = useState(true);
  const [wAud, setWAud] = useState<string[]>(['hr']);
  const [wFiles, setWFiles] = useState<FileItem[]>([]);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [acked, setAcked] = useState(false);

  const submitComment = () => {
    const body = draft.trim();
    if (!body) return;
    setCmts((p) => [...p, {
      id: 'n' + p.length, author: { name: '옥성훈', dept: '대표' }, date: '방금', body,
      ...(replyTo ? { parentId: replyTo } : {}),
    }]);
    setDraft(''); setReplyTo(null);
  };
  // parentId로 부모 아래 묶는다(배열 순서에 기대지 않음 — BoardView와 같은 규칙).
  const roots = cmts.filter((c) => !c.parentId);
  const repliesOf = (id: string) => cmts.filter((c) => c.parentId === id);
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
        bottom={<div style={{ padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-md)' }}>
          <Button variant="primary" fullWidth onClick={() => {}}>발주 요청</Button>
        </div>}>
        <MobileTop title="발주" />
        <MobileSection flush>
          <MobileStatRow items={[
            { label: '진행 중', value: '12건', onClick: () => {} },
            { label: '승인 대기', value: '3건', sub: '2건 지연', tone: 'danger', onClick: () => {} },
            { label: '이번 달', value: '48건', sub: '+12%', tone: 'success' },
          ]} />
        </MobileSection>

        <MobileSection title="새 발주" flush>
          <MobileField label="현장" required>
            <TextInput value={site} onChange={setSite} placeholder="현장을 입력하세요" />
          </MobileField>
          <MobileField label="품목 분류">
            <MobileChoice options={[{ value: 'a', label: '자재' }, { value: 'b', label: '장비' }]}
              value={kind} onChange={setKind} ariaLabel="품목 분류" />
          </MobileField>
        </MobileSection>
      </MobileShell>
    );
  }

  // ── 게시판 쓰기 — 부품 하나로. 등록(커밋)은 셸 하단, 취소는 뒤로가기(부품은 본문만 소유) ──
  if (writing) {
    return (
      <MobileShell title="글쓰기" onBack={() => setWriting(false)}
        /* 임시저장은 상단 보조 액션 — 커밋(등록)은 하단 한 자리, 안전망은 여기.
           실제 제품이라면 여기에 더해 ① 입력 blur마다 백그라운드 초안 저장 ② onBack에서 "초안을 저장할까요?"가 붙는다. */
        actions={[{ label: '임시저장', icon: 'save', iconOnly: true, onClick: () => {} }]}
        tabs={TABS} activePath={tab} onNavigate={(p) => { setWriting(false); setTab(p); }}
        bottom={<div style={{ padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-md)' }}>
          <Button variant="primary" fullWidth onClick={() => setWriting(false)}>등록</Button>
        </div>}>
        <MobileBoardWrite
          categories={CATS.slice(1)} category={wCat} onCategoryChange={setWCat}
          postTitle={wTitle} onPostTitleChange={setWTitle}
          body={wBody} onBodyChange={setWBody}
          audiences={AUDIENCES} selectedAudiences={wAud} onAudiencesChange={setWAud}
          files={wFiles} onFilesChange={setWFiles}
          notice={wNotice} onNoticeChange={setWNotice}
          mustRead={wMust} onMustReadChange={setWMust}
          commentsAllowed={wComments} onCommentsAllowedChange={setWComments}
        />
      </MobileShell>
    );
  }

  // ── 게시판 읽기 (2뎁스) — 댓글 입력은 셸 하단 고정 ──
  if (post) {
    return (
      <MobileShell
        title={post.category ?? '게시글'}
        onBack={() => setOpen(null)}
        actions={[{ label: '더보기', icon: 'dots-vertical', iconOnly: true, onClick: () => {} }]}
        tabs={TABS} activePath={tab} onNavigate={(p) => { setOpen(null); setTab(p); }}
        bottom={
          <MobileComposer
            value={draft} onChange={setDraft} onSubmit={submitComment}
            placeholder="댓글을 입력하세요"
            replyTo={replyTo
              ? { label: `${cmts.find((c) => c.id === replyTo)?.author.name}님에게 답글`, onCancel: () => setReplyTo(null) }
              : undefined}
          />
        }
      >
        <MobileBoardView
          category={post.category}
          notice={post.pinned}
          mustRead={post.mustRead}
          title={post.title}
          author={{ name: post.author.name, dept: post.author.dept, role: '팀장' }}
          date={post.date}
          views={post.views}
          content={<RichText html={POST_HTML} />}
          attachments={[
            { id: 'f1', name: '2026_하계휴가_신청서.xlsx', size: '24 KB', onDownload: () => {} },
            { id: 'f2', name: '휴가규정_개정본.pdf', size: '180 KB', onDownload: () => {} },
          ]}
          readState={post.mustRead ? { read: 18, total: 32, acknowledged: acked, onAcknowledge: () => setAcked(true) } : undefined}
          prev={{ title: '3분기 전사 워크샵 일정 공유', date: '06.18', onClick: () => setOpen('p4') }}
          next={{ title: '2026년 거래처 단가표 v3 배포', date: '06.25', onClick: () => setOpen('p3') }}
          comments={cmts}
          onReply={setReplyTo}
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell tabs={TABS} activePath={tab} onNavigate={setTab}>
      <MobileTop title="게시판"
        action={{ label: '글쓰기', variant: 'primary', onClick: () => setWriting(true) }} />

      <MobileBoardList
        posts={POSTS}
        categories={CATS} category={cat} onCategoryChange={setCat}
        searchQuery={q} onSearchChange={setQ}
        onSelectPost={(p) => setOpen(p.id)}
        onLoadMore={() => {}}
        totalCount={12}     /* 데모: 총 12건 중 4건만 불러온 상태 → 더보기가 뜬다(다 불러오면 저절로 사라진다) */
      />
    </MobileShell>
  );
}
