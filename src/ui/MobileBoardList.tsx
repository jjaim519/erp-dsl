'use client';
// MobileBoardList (유기체) — 사내 게시판 목록의 모바일 화면. 데스크탑 BoardList의 짝.
//
//  · **타입을 공유한다**: `BoardPost` 한 벌을 소비처가 두 화면에 그대로 넘긴다(변환 0).
//    MobileCalendar가 CalendarEvent를 데스크탑과 공유하는 것과 같은 규율 — 복제하면 두 화면이 갈린다.
//  · 시각 체계는 모바일 계열 그대로: 면·그림자 0, 배경 + 가로 헤어라인. 행은 MobileListRow가 그린다
//    (여기서 행을 다시 짜지 않는다 — 44pt·:active·chevron 규율이 그 부품에 이미 있다).
//  · 데스크탑과 갈리는 것:
//    ① 표 헤더(분류/제목/…/조회)가 없다 — 폰 폭에 6열은 안 들어가고, 열 제목은 행이 이미 말한다.
//    ② 번호 페이징 대신 '더보기'다. 폰에서 번호 페이징은 표적이 작고 스크롤 맥락을 끊는다.
//    ③ 분류(말머리)는 SegmentedControl이 아니라 **가로 스크롤 필터 칩**이다 — 분류가 5개를 넘으면
//       세그먼트는 글자가 뭉개진다. MobileCalendar 범례 칩 줄과 같은 어휘.
//  · 하단 고정(글쓰기 CTA)은 이 부품이 아니라 셸이 소유한다 — MobileShell의 `bottom` 한 자리.
//    부품이 자기 sticky 바를 그리면 같은 자리를 두 경로가 다툰다(v0.52.0에서 슬롯을 하나로 합친 이유).
import { Badge } from './Badge';
import { Icon, type IconName } from './Icon';
import { MobileListRow } from './MobileListRow';
import { MobileList } from './MobileList';
import { fmtNumber } from './_cells';
import type { BoardPost } from './BoardList';
import './board.css';      // 공지·필독·NEW 솔리드 배지 어휘는 데스크탑과 *같은 클래스*를 쓴다(같은 신호 = 같은 형태)
import './mobileboard.css';

type Props = {
  posts: BoardPost[];
  categories?: { value: string; label: string }[];   // 말머리. 안 주면 칩 줄 미조립('전체'는 소비처가 포함)
  category?: string;
  onCategoryChange?: (v: string) => void;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  // 로딩·빈 상태 — 데스크탑 DataTable·ListPage와 **같은 어휘**를 쓴다(같은 말은 같은 뜻이어야 한다).
  //  loading 표시는 스켈레톤이 아니라 **스피너**다. 두 가지 이유:
  //   ① 실증이 약하다 — Viget 2017 실험에서 스켈레톤이 스피너·빈 화면 대비 *체감 대기가 가장 나빴고*,
  //      이후 연구도 스피너 쪽 체감이 더 짧았다. NN/g 2025는 "빈 공간보다 나은 건 500ms 초과일 때뿐"이라 한다.
  //   ② 우리 모바일 계열은 아직 배치가 움직인다 — 스켈레톤은 구조를 복제하므로 부품이 바뀔 때마다
  //      실제와 어긋난다(스켈레톤은 구조가 굳은 자리에서만 값을 한다).
  status?: 'loading' | 'empty' | 'ready';
  onSelectPost?: (post: BoardPost) => void;
  onLoadMore?: () => void;                            // '더보기'(폰은 번호 페이징을 안 쓴다). 노출 조건은 아래 hasMore — 데이터가 정한다
  loadMoreLabel?: string;
  totalCount?: number;
  emptyState?: { icon?: IconName; title: string; description?: string };
};

export function MobileBoardList({
  posts, categories, category, onCategoryChange,
  searchQuery, onSearchChange, searchPlaceholder = '제목·작성자 검색',
  status = 'ready', onSelectPost, onLoadMore, loadMoreLabel = '더보기', totalCount, emptyState,
}: Props) {
  // 껍데기(검색·필터·로딩/빈 상태·더보기·구획)는 전부 MobileList가 갖는다.
  //  이 부품에 남는 건 **게시판 고유의 것**뿐이다: 행의 3층 배치, 공지/필독/NEW 배지, 안읽음 신호, 공지 구획.
  //  전에는 껍데기가 여기 있었고, 그래서 v0.68.0의 로딩 규율이 게시판 화면에서만 지켜졌다.

  // 행 하나 — 데스크탑의 열(분류·필독·NEW·안읽음·첨부/댓글·작성자·날짜·조회)을 폰의 3층
  //  [배지 줄 / 제목 / 보조 줄]로 접는다. 잃는 정보는 없고 배치만 세로로 눕는다.
  const row = (p: BoardPost) => {
    const meta = [p.author.name + (p.author.dept ? ` · ${p.author.dept}` : ''), p.date]
      .concat(p.views != null ? [`조회 ${fmtNumber(p.views)}`] : [])
      .join(' · ');
    const counts = (p.attachments || p.comments) ? (
      <span className="mb-counts">
        {p.attachments ? <span><Icon name="paperclip" size="sm" />{p.attachments}</span> : null}
        {p.comments ? <span className="cmt"><Icon name="message" size="sm" />{p.comments}</span> : null}
      </span>
    ) : undefined;

    return (
      <MobileListRow
        key={p.id}
        title={p.title}
        emphasis={p.unread}                                   // 안 읽음 = 제목 강조(데스크탑 볼드와 같은 신호)
        // 공지는 굵되 점은 안 찍는다 — 이미 배지로 구분되므로 점까지 붙이면 신호가 겹친다.
        //  두 값이 갈리는 자리라 emphasis와 unread를 한 prop으로 못 합친다(MobileListRow 주석).
        unread={p.unread && !p.pinned}
        meta={meta}
        badges={
          <>
            {p.pinned ? <Badge color="info" strength="fill">공지</Badge> : p.category ? <Badge color="neutral">{p.category}</Badge> : null}
            {p.mustRead && <Badge color="danger" strength="fill">필독</Badge>}
            {p.isNew && <Badge color="danger">NEW</Badge>}
          </>
        }
        trailing={counts}
        onClick={onSelectPost ? () => onSelectPost(p) : undefined}
      />
    );
  };

  return (
    <MobileList<BoardPost>
      items={posts}
      getKey={(p) => p.id}
      renderRow={row}
      /* 공지는 별도 구획으로 먼저 — 데스크탑의 '상단 고정 밴드'를 모바일에선 *섹션 하나*가 대신한다.
         (배지만으로는 "고정"이 안 읽힌다. 구획이 곧 고정의 표현 — 틴트는 mobileboard.css가 건다.)
         0건이면 MobileList가 헤더만 남기는데, 제목이 빈 문자열이라 실제로는 아무것도 안 그린다. */
      sections={[
        { key: 'pinned', title: '', match: (p) => Boolean(p.pinned) },
        { key: 'normal', title: '', match: (p) => !p.pinned },
      ]}
      filters={categories}
      filter={category}
      onFilterChange={onCategoryChange}
      filterLabel="말머리 필터"
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      status={status}
      emptyState={{ icon: emptyState?.icon ?? 'file-text', title: emptyState?.title ?? '게시글이 없습니다', description: emptyState?.description }}
      onLoadMore={onLoadMore}
      loadMoreLabel={loadMoreLabel}
      totalCount={totalCount}
    />
  );
}
