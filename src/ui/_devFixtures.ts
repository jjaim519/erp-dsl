// ─────────────────────────────────────────────────────────────────────────
// _devFixtures — dev 데모가 쓰는 **가짜 데이터 단일 출처**.
//
//  왜 따로 있나: 이 데이터가 /shell/m/page.tsx 안에 인라인으로 살던 동안, 부품별 라이브 예시를
//  만들 방법이 없어서 _registry의 Mobile* 항목이 전부 "→ /shell/mobile 에서 라이브" **링크 한 줄**이었다.
//  실물이 한 화면에만 존재하니 부품 하나를 보려면 4탭 데모를 통과해야 했다.
//  → 데이터를 여기로 올리면 (1) 부품별 캔버스와 (2) 4탭 셸 데모가 *같은 한 벌*을 본다. 두 벌이 안 생긴다.
//
//  · 데이터만 산다(JSX 금지 — 그건 _mobileDemos/_registry의 일).
//  · dev 전용(publish 제외). 소비처에 나가지 않으므로 도메인 냄새가 나도 된다.
// ─────────────────────────────────────────────────────────────────────────
import type { MobileTab } from './MobileShell';
import type { BoardPost } from './BoardList';
import type { BoardComment } from './BoardView';
import type { AudienceNode } from './_audience';
import type { CalendarEvent, CalendarEncoding, CalendarAnnotation } from './CalendarPage';

export const TABS: MobileTab[] = [
  { path: '/board', label: '게시판', icon: 'clipboard', count: 3 },
  { path: '/orders', label: '발주', icon: 'upload' },
  { path: '/sites', label: '현장', icon: 'building' },
  { path: '/my', label: '내정보', icon: 'user' },
];

export const COMMENTS: BoardComment[] = [
  { id: 'c1', author: { name: '박상우', dept: '구매' }, date: '06.24 15:02', body: '반차도 이 기간에 같이 신청해야 하나요?' },
  { id: 'c2', author: { name: '김서연', dept: '인사' }, date: '06.24 15:20', isAuthor: true, parentId: 'c1',
    body: '반차는 본 휴가와 무관하게 평소처럼 수시 신청 가능합니다.' },
  { id: 'c3', author: { name: '정민호', dept: '물류' }, date: '06.24 16:40', body: '확인했습니다. 창고 인원 조율해서 제출하겠습니다.' },
];

export const POST_HTML = `<h2>1. 신청 기간</h2><p>신청 기간은 <strong>7월 1일 ~ 7월 15일 18:00</strong>까지입니다. 전자결재 &gt; 휴가신청서로 제출해 주세요.</p><ul><li>승인: 팀장 1차 → 인사팀 최종</li><li>반차·반반차는 휴가신청서에서 선택</li></ul>`;

// 게시판 데이터 — 데스크탑 BoardList와 *같은 타입*(BoardPost). 소비처는 한 벌만 들고 두 화면에 넘긴다.
export const POSTS: BoardPost[] = [
  { id: 'p1', category: '공지', title: '2026년 하계 휴가 신청 및 근태 처리 안내', author: { name: '김서연', dept: '인사팀' },
    date: '06.24', pinned: true, mustRead: true, comments: 3, attachments: 2, views: 214 },
  { id: 'p2', category: '업무', title: '사내 보안 정책 개정 — VPN 2차 인증 의무화', author: { name: '박상우', dept: '정보보안' },
    date: '06.20', unread: true, comments: 1, views: 88 },
  { id: 'p3', category: '업무', title: '2026년 거래처 단가표 v3 배포', author: { name: '정민호', dept: '구매' },
    date: '06.25', unread: true, isNew: true, attachments: 1, views: 41 },
  { id: 'p4', category: '공지', title: '3분기 전사 워크샵 일정 공유', author: { name: '김서연', dept: '인사팀' },
    date: '06.18', views: 176 },
];

export const CATS = [
  { value: 'all', label: '전체' }, { value: 'notice', label: '공지' },
  { value: 'work', label: '업무' }, { value: 'hr', label: '인사' }, { value: 'safety', label: '안전' },
];

export const AUDIENCES: AudienceNode[] = [
  { id: 'all', label: '전사', exclusive: true },
  { id: 'hq', label: '본사', children: [
    { id: 'hr', label: '인사팀', members: [{ id: 'u1', name: '김서연', dept: '인사팀' }] },
    { id: 'pur', label: '구매팀', members: [{ id: 'u2', name: '정민호', dept: '구매팀' }] },
  ] },
  { id: 'site', label: '현장', members: [{ id: 'u3', name: '옥성훈', dept: '시공' }] },
];

// 달력 데이터 — 데스크탑 CalendarPage와 *같은 타입*이다(소비처가 한 벌만 들고 두 화면에 넘긴다).
export const SITE_ENCODING: CalendarEncoding = {
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

export const SITE_EVENTS: CalendarEvent[] = [
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

export const SITE_ANNOS: CalendarAnnotation[] = [
  { id: 't1', start: '2026-07-13', end: '2026-07-17', label: '하계 단축근무', tone: 'warning', display: 'banner' },
  { id: 't2', start: '2026-07-29', end: '2026-07-31', label: '본사 워크샵', tone: 'neutral', display: 'background' },
];

export const ATTACHMENTS = [
  { id: 'f1', name: '2026_하계휴가_신청서.xlsx', size: '24 KB' },
  { id: 'f2', name: '휴가규정_개정본.pdf', size: '180 KB' },
];

// 뷰어 데모용 첨부 — 렌더 가능한 것과 폴백 사유 4종을 한 벌에 담는다.
//  이미지는 외부 호스트를 안 쓴다(폐쇄망 규율을 데모에서도 지킨다) — 인라인 SVG data URI.
const demoSvg = (label: string, bg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="${bg}"/>` +
    `<text x="600" y="420" font-family="sans-serif" font-size="64" fill="#fff" text-anchor="middle">${label}</text></svg>`,
  )}`;

export const VIEWER_ITEMS = [
  // 아래 두 hex는 UI 색이 아니라 **가짜 사진의 내용**이다(실물 이미지 대신 그린 자리표시).
  //  theme 토큰을 쓸 자리가 아니고, dev 전용이라 배포에도 안 나간다.
  // eslint-disable-next-line no-restricted-syntax -- 데모 이미지 *콘텐츠* 색(UI 색 아님, dev 전용)
  { id: 'v1', kind: 'image' as const, name: '현장사진_주방_01.png', size: '1.2 MB', src: demoSvg('현장사진 01', '#1E4178'), alt: '주방 시공 현장' },
  // eslint-disable-next-line no-restricted-syntax -- 데모 이미지 *콘텐츠* 색(UI 색 아님, dev 전용)
  { id: 'v2', kind: 'image' as const, name: '현장사진_주방_02.png', size: '980 KB', src: demoSvg('현장사진 02', '#0B7357'), alt: '주방 시공 현장 2' },
  { id: 'v3', kind: 'pdf' as const, name: '휴가규정_개정본.pdf', size: '180 KB', src: '/pdfjs/sample.pdf' },
  { id: 'v4', kind: 'sheet' as const, name: '2026_단가표_v3.xlsx', size: '2.4 MB', unviewable: 'unsupported' as const },
  { id: 'v5', kind: 'document' as const, name: '계약서_원본.hwpx', size: '340 KB', unviewable: 'unsupported' as const },
  { id: 'v6', kind: 'image' as const, name: '설계도면_전체.png', size: '84 MB', unviewable: 'too-large' as const },
  { id: 'v7', kind: 'pdf' as const, name: '보안문서.pdf', size: '1.1 MB', unviewable: 'protected' as const },
];

// 날짜 라벨 — 포맷은 *소비처*의 일이다(부품은 날짜 계산·표기를 모른다).
export const dayLabel = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 일정`;
};
